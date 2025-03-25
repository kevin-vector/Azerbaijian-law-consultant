import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import {load} from 'cheerio';
import { supabase } from '../../../lib/supabase';
import { postIndex } from '@/lib/pinecone';
import { getEmbedding } from '@/lib/embeddings';

async function scrapeAndInsertPosts() {
  const { data: post } = await supabase
        .from('Scrape')
        .select('last_one')
        .eq('source', 'law')
        .order("id", { ascending: false })
  if(post?.length === 0){
    return;
  }

  let i = 0;
  for (i = post![0]?.last_one; true; i++) {
    console.log(`Processing page ${i}`);
    const { error: insertError } = await supabase.from('Scrape').insert({source: 'post', status: 'running', last_one: i});
    if (insertError) {
      console.error('Error inserting');
    } else {
      console.log(`successfully registered post scraping`);
    }
    const url = `https://www.muhasibat.az/author/adminmuh/page/${i}`;
    try {
      const response = await axios.get(url);
      const $ = load(response.data);

      $('script, style').remove();
      const contentDiv = $('#content');
      if (!contentDiv.length) {
        console.warn(`Page ${i}: Content section not found, using full body as fallback`);
        break;
      }

      const headers = contentDiv.find('header');
      for (const header of headers.toArray()) {
        const aTag = $(header).find('a');
        const href = aTag.attr('href');
        if (!href) continue;

        try {
          const articleResponse = await axios.get(href);
          const article$ = load(articleResponse.data);

          $('script, style').remove();

          const headerWrapper = article$('#kad-banner');
          const id = headerWrapper.attr('data-id') || '';
          const title = article$('h1.entry-title').text().replace(/\s+/g, ' ').trim() || '';
          const view = article$('span.post-views-count').text().replace(/\s+/g, ' ').trim() || '';

          const content = article$('div.pf-content');
          let htmlContent = '';
          if (content.length) {
            const paragraphs = content
              .find('p')
              .map((_, p) => {
                const text = $(p).text().replace(/[\s\u200b]+/g, ' ').trim();
                return text && text !== '\xa0' && text !== ' ' ? text : null;
              })
              .get()
              .filter(Boolean);
            htmlContent = paragraphs.join('\n\n');
          }

          const dataToInsert = {
            content_id: id,
            title,
            content: htmlContent,
            view,
          };

          console.log(`Processing: content_id=${dataToInsert.content_id}, view=${dataToInsert.view}`);

          // Check for existing record to avoid duplicates
          const { data: existing, error: fetchError } = await supabase
            .from('Ajerbaijian_post')
            .select('content_id')
            .eq('content_id', id)
            .single();

          if (fetchError && fetchError.code !== 'PGRST116') {
            console.error(`Error checking content_id ${id}:`, fetchError);
            continue;
          }

          if (!existing) {
            const { error: insertError } = await supabase
              .from('Ajerbaijian_post')
              .insert(dataToInsert);
            if (insertError) {
              console.error(`Error inserting content_id ${id}:`, insertError);
            } else {
              console.log(`Inserted content_id ${id}`);
            }

            const embedding = await getEmbedding(dataToInsert.content);
            const { data: uniq, error: fetchError } = await supabase
              .from('Ajerbaijian_post')
              .select('id')
              .eq('content_id', dataToInsert.content_id)
              .single();

            if (fetchError) {
              console.error(`Error fetching unique id for content_id ${dataToInsert.content_id}:`, fetchError);
              continue;
            }
            
            await postIndex.upsert([
              {
                id: uniq?.id,
                values: embedding,
                metadata: { content_id: dataToInsert.content_id },
              },
            ]);
          } else {
            console.log(`Skipped duplicate content_id ${id}`);
          }
        } catch (articleError) {
          console.error(`Error processing article ${href}:`, articleError);
        }
      }
    } catch (pageError) {
      console.error(`Error processing page ${i}:`, pageError);
    }
  }
  const { error: insertedError } = await supabase.from('Scrape').insert({source: 'post', status: 'finished', last_one: i});
  if (insertedError) {
    console.error('Error inserting');
  } else {
    console.log(`successfully registered post scraping completed`);
  }
}

export async function POST(req: NextRequest) {
  try {
    await scrapeAndInsertPosts();
    return NextResponse.json({ message: 'Scraping completed successfully' });
  } catch (error) {
    console.error('Scraping error:', error);
    return NextResponse.json({ error: 'Failed to scrape posts' }, { status: 500 });
  }
}