import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { load } from 'cheerio'; // Fixed import for ESM
import { supabase } from '../../../lib/supabase';
import { getEmbedding } from '@/lib/embeddings';
import { lawIndex } from '@/lib/pinecone';

function splitText(text:string, maxLength = 1500, overlap = 100) {
  // Split text into chunks under maxLength with overlap
  if (text.length <= maxLength) {
      return [text];
  }
  
  const chunks = [];
  let start = 0;
  
  while (start < text.length) {
      let end = start + maxLength;
      const st = Math.max(start - overlap, 0);
      const ed = Math.min(end + overlap, text.length);
      const chunk = text.slice(st, ed);
      chunks.push(chunk);
      start = end - overlap < text.length ? end - overlap : end;
  }
  
  return chunks;
}

async function processData(id: number) {
  const url = `https://api.e-qanun.az/framework/${id}`;
  try {
    const response = await axios.get(url);
    const data = response.data.data || {};

    const requisite = data.requisite || {};
    const fields = requisite.fields || [];
    const resource = fields.map((field: any) => field.name || '').join('; ');

    const htmlUrl = data.htmlUrl || '';
    let htmlContent = '';
    if (htmlUrl) {
      const headers = {
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
        'Referer': `https://e-qanun.az/framework/${id}`,
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36',
        'sec-ch-ua': '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
      };
      const htmlResponse = await axios.get(htmlUrl, { headers });
      const $ = load(htmlResponse.data); // Use 'load' for cheerio

      $('script, style').remove();
      const contentDiv = $('.WordSection1').length ? $('.WordSection1') : $('body');
      const paragraphs = contentDiv
        .find('p')
        .map((_, p) => {
          const text = $(p).text().replace(/\s+/g, ' ').trim();
          return text && text !== '\xa0' && text !== ' ' ? text : null;
        })
        .get()
        .filter(Boolean);
      htmlContent = paragraphs.join('\n\n');
    }

    function getValidDate(dateStr: string | undefined): string | null {
      if (!dateStr) return null;
      try {
        const [day, month, year] = dateStr.split('.');
        const dateObj = new Date(`${year}-${month}-${day}`);
        if (isNaN(dateObj.getTime())) return null;
        return dateObj.toISOString().split('T')[0]; // YYYY-MM-DD
      } catch {
        return null;
      }
    }

    const chunks = htmlContent.length > 1500 ? splitText(htmlContent, 1500, 100) : [htmlContent];
    const dataToInsert = chunks.map((chunk, idx) => ({
      title: requisite.title || '',
      acceptDate: getValidDate(requisite.acceptDate),
      typeName: requisite.typeName || '',
      citation: requisite.citation || '',
      statusName: requisite.statusName || '',
      effectDate: getValidDate(requisite.effectDate),
      registerCode: requisite.registerCode || '',
      registerDate: getValidDate(requisite.registerDate),
      resource,
      content: chunk,
      chunk_id: `${id}_${idx}`,
    }));

    const { data: existing, error: fetchError } = await supabase
      .from('Ajerbaijian_law')
      .select('chunk_id')
      .eq('id', `${id}_0`)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error(`Error checking ID ${id}:`, fetchError);
      return;
    }

    if (!existing) {
      const { data: insertedData, error: insertError } = await supabase
        .from('Ajerbaijian_law')
        .insert(dataToInsert).select();
      if (insertError) {
        console.error(`Error inserting ID ${id}:`, insertError);
      } else {
        console.log(`Inserted ID ${id}`);
      }

      if (insertedData) {
        const pineconeRecords = await Promise.all(
          insertedData.map(async (row) => {
            const embedding = await getEmbedding(row.content); // Generate embedding for the content
            return {
              id: row.id.toString(), // Use the Supabase ID as the Pinecone ID
              values: embedding,
              metadata: {
                content_id: row.id, // Supabase ID
              },
            };
          })
        );
      
        try {
          await lawIndex.upsert(pineconeRecords);
          console.log(`Successfully upserted embeddings for Supabase IDs into Pinecone`);
        } catch (pineconeError) {
          console.error(`Error upserting embeddings into Pinecone:`, pineconeError);
        }
      }
    }
  } catch (error) {
    console.error(`Error processing ID ${id}:`, error);
  }
}

async function scrapeBatch(startId: number, endId: number, totalCount: number) {
  const cappedEndId = Math.min(endId, totalCount);
  for (let i = startId; i <= cappedEndId; i++) {
    await processData(i);
  }
  await supabase
    .from('scrape')
    .upsert({ source: 'law', value: cappedEndId });
}

export async function POST(req: NextRequest) {
  const { error: insertError } = await supabase.from('Scrape').insert({source: 'law', status: 'running'});
  if (insertError) {
    console.error('Error inserting');
  } else {
    console.log(`successfully registered law scraping`);
  }
  try {

    const url = 'https://api.e-qanun.az/getDetailSearch?start=3000&length=1000&orderColumn=1&orderDirection=asc&title=true&codeType=1&dateType=1&statusId=-1&secondType=2&specialDate=false&array=';
    const response = await axios.get(url);
    const totalCount = response.data.totalCount;
    console.log(`Total count: ${totalCount}`);

    const { data: progress } = await supabase
      .from('Ajerbaijian_law')
      .select('id')
      .order("id", { ascending: false })
      .single();

    const lastScrapedId = progress?.id;
    const startId = lastScrapedId + 1;
    const endId = Math.max(startId + 2, totalCount);

    if (startId > totalCount) {
      return NextResponse.json({ message: 'Scraping already completed' });
    }

    await scrapeBatch(startId, endId, totalCount);
    const { error: insertedError } = await supabase.from('Scrape').insert({source: 'law', status: 'finished'});
    if (insertedError) {
        console.error('Error inserting');
    } else {
        console.log(`successfully registered post scraping`);
    }
    return NextResponse.json({
      message: `Scraped IDs ${startId} to ${endId}`,
      nextStart: endId + 1,
    });
  } catch (error) {
    console.error('Scraping error:', error);
    const { error: insertedError } = await supabase.from('Scrape').insert({source: 'post', status: 'failed'});
    if (insertedError) {
        console.error('Error inserting');
    } else {
        console.log(`successfully registered post scraping`);
    }
    return NextResponse.json({ error: 'Failed to scrape data' }, { status: 500 });
  }
}
