import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { ruleIndex, postIndex, manualIndex } from '../../../lib/pinecone';
import { getEmbedding } from '../../../lib/embeddings';
import { getTokenCount } from '../../../lib/tokenizer';
import OpenAI from 'openai';
import {franc} from 'franc';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const TPM_LIMIT = 30000;

const basePrompt = `You are an advanced professional assistant built to help users in understanding and interpreting legal documents, laws, and related social media posts.

Respond in the following language: {}.

The user has provided a dataset containing the following retrieved entries:
{}

Follow these instructions precisely for every response:

1. If the user is greeting only, then please answer with a friendly welcoming greeting that tells him/her what your role is.

2. Analyze the provided datasets and generate structured responses in bullet-point format.

3. Cite exact provisions explicitly:
  - When referring to 'Azerbaijian Law', always refer to the specific Azerbaijian law by its exact title (e.g., 'Law on Environmental Protection', 'Criminal Code of Azerbaijan'), including section or article numbers.
  - When referring to 'Azerbaijian Tax Code', explicitly include articles or provisions.
  - When referring to 'Social Posts' and 'Manual Data', include the post title clearly.

4. Each response must have two separate, labeled sections:
  - [Detailed Response]:
    - Provide comprehensive analysis and explanations.
    - Include explicit references to specific law titles, articles, or sections from the datasets.
    - Provide clear translations if the original text is non-English.
    - Offer detailed explanations and concrete examples.
  - [Summarized Response]:
    - Provide concise bullet points.
    - Include clear, brief citations of law titles, sections, or articles without extensive elaboration.

5. For legal concepts, provide clear definitions with examples.

6. If the provided data does not sufficiently address the user's query, respond explicitly with: '{}' in both [Detailed Response] and [Summarized Response] sections. Do not answer any other words. Never.`;

async function reRankResults(results: any[], query: string) {
  try {

    const formattedResults = results
      .filter((result) => result && typeof result === 'object')
      .map((result) => ({
        ...result,
        content: result.content || result.text || result.description || result.body || '', // Fallback
        type: result.type || 'unknown', // Ensure type
      }));

    if (!formattedResults.length) {
      console.warn('No valid results to re-rank');
      return [];
    }

    const payload = {
      query: String(query),
      results: formattedResults,
    };

    const response = await fetch('http://127.0.0.1:8000/rerank', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('FastAPI error response:', JSON.stringify(errorData, null, 2));
      throw new Error(`FastAPI request failed: ${response.status}`);
    }

    const { ranked_results } = await response.json();
    return ranked_results;
  } catch (e) {
    console.error('Re-ranking error:', e);
    return results.slice(0, 20);
  }
}

async function fetchContentFromSupabase(id: number, tableName: string) {
  const table = `Ajerbaijian_${tableName}`;
  try {
    const { data, error } = await supabase
      .from(table)
      .select('title, content')
      .eq('id', id)
      .single();
    if (error) throw error;

    return {
      type: tableName,
      title: data?.title ?? 'No title',
      content: data?.content ?? 'No content',
      combined: `Data type: ${tableName}\nTitle: ${data?.title ?? 'No title'}\nContent: ${data?.content ?? 'No content'}`,
    };
  } catch (e) {
    console.error(`Supabase error for ${tableName} ID ${id}:`, e);
    return null; // Return null instead of string
  }
}

async function fetchResults(index: any, queryEmbedding: number[], indexName: string) {
  try {
    const results = await index.query({
      vector: queryEmbedding,
      topK: 50,
      includeMetadata: true,
    });
    const filteredResults = await Promise.all(
      results.matches
        .filter((match : any) => match.score >= 0.6)
        .map((match : any) => fetchContentFromSupabase(match.id, indexName))
    );
    return filteredResults.filter((result) => result && typeof result === 'object');
  } catch (e) {
    console.error(`Pinecone error for ${indexName}:`, e);
    return [];
  }
}

async function adjustPromptTokens(
  basePrompt: string,
  resultsAll: any[],
  query: string,
  tpmLimit: number
) {
  const detected_lang = franc(query);
  const lang = detected_lang === 'azj' ? 'Azerbaijani' : 'English';
  console.log(`Detected language: ${franc(query)}`);
  const noAnswerMsg =
    lang === 'English' ? 'Please contact a professional' : 'Zəhmət olmasa, peşəkarla əlaqə saxlayın';

  let systemPrompt = basePrompt.replace('{}', lang)
    .replace('{}', resultsAll.map(r => r.combined).join(', ') || 'No content found')
    .replace('{}', noAnswerMsg);
  let fullInput = systemPrompt + '\n' + query;
  let tokenCount = await getTokenCount(fullInput);

  if (tokenCount !== null && tokenCount <= tpmLimit) return systemPrompt;

  let adjusted = [...resultsAll]

  while (adjusted.length && tokenCount !== null && tokenCount > tpmLimit) {
    adjusted.pop();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjusted.map(r => r.combined).join(', ') || 'No content found')
      .replace('{}', noAnswerMsg);
    fullInput = systemPrompt + '\n' + query;
    tokenCount = await getTokenCount(fullInput);
  }
  return systemPrompt;
}

export async function POST(req: NextRequest) {
  const { query, settings } = await req.json();
  if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

  const queryEmbedding = await getEmbedding(query);

  let resultsManual = []
  let resultsPost = []
  let resultsLaw = []

  if (settings.includeScraping) {
    resultsPost = await fetchResults(postIndex, queryEmbedding, 'post');
    resultsLaw = await fetchResults(ruleIndex, queryEmbedding, 'law');
  }
  if(settings.includeManual){
    resultsManual = await fetchResults(manualIndex, queryEmbedding, 'manual');
  }
  
  let resultAll = [...resultsLaw, ...resultsPost, ...resultsManual];
  resultAll = await reRankResults(resultAll, query);
  console.log('Re-ranked results:', resultAll.length);

  const systemPrompt = await adjustPromptTokens(
    basePrompt,
    resultAll,
    query,
    TPM_LIMIT
  );

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      temperature: 0.7,
      max_tokens: 5000,
    });
    const aiResponse = response.choices[0].message.content;
    return NextResponse.json({ response: aiResponse });
  } catch (e) {
    console.error('OpenAI error:', e);
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 });
  }
}