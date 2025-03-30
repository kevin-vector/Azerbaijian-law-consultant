import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { lawIndex, ruleIndex, postIndex, manualIndex } from '../../../lib/pinecone';
import { getEmbedding } from '../../../lib/embeddings';
import { getTokenCount, truncateText } from '../../../lib/tokenizer';
import OpenAI from 'openai';
import {franc} from 'franc';
import { useState } from 'react';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const TPM_LIMIT = 30000;

const basePrompt = `You are an advanced professional assistant built to help users in understanding and interpreting legal documents, laws, and related social media posts.

Respond in the following language: {}.

The user has provided a dataset containing the following retrieved entries:
- 'Azerbaijian Law': {}  
- 'Azerbaijian Tax Code': {}
- 'Social Posts': {}
- 'Manual Data': {}

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

5. Explain clearly every mentioned legal concept with accurate definitions and examples, strictly based on the provided datasets.

6. If the provided data does not sufficiently address the user's query, respond explicitly with: '{}' in both [Detailed Response] and [Summarized Response] sections. Do not answer any other words. Never.`;

async function fetchContentFromSupabase(id: number, tableName: string) {
  const table = `Ajerbaijian_${tableName}`;
  try {
    const { data, error } = await supabase
      .from(table)
      .select('title, content')
      .eq('id', id)
      .single();
    if (error) throw error;

    // Combine title and content into a single string
    const combinedContent = `${data?.title ?? 'No title'}\n\n${data?.content ?? 'No content'}`;
    return combinedContent;
  } catch (e) {
    console.error(`Supabase error for ${tableName} ID ${id}:`, e);
    return 'No content found';
  }
}

async function fetchResults(index: any, queryEmbedding: number[], indexName: string) {
  try {
    const results = await index.query({
      vector: queryEmbedding,
      topK: 10,
      includeMetadata: true,
    });
    console.log(`Pinecone results for ${indexName}:`, results);
    const filteredResults = await Promise.all(
      results.matches
        .filter((match: any) => match.score >= 0.5)
        .map((match: any) => fetchContentFromSupabase(match.id, indexName))
    );
    return filteredResults.length ? filteredResults : ['No relevant content found'];
  } catch (e) {
    console.error(`Pinecone error for ${indexName}:`, e);
    return ['No relevant content found'];
  }
}

async function adjustPromptTokens(
  basePrompt: string,
  resultsRule: string[],
  resultsLaw: string[],
  resultsPost: string[],
  resultsManual: string[],
  query: string,
  tpmLimit: number
) {
  const detected_lang = franc(query);
  // const lang = detected_lang === 'eng' || detected_lang == "und" ? 'English' : 'Azerbaijani';
  const lang = detected_lang === 'azj' ? 'Azerbaijani' : 'English';
  console.log(`Detected language: ${franc(query)}`);
  const noAnswerMsg =
    lang === 'English' ? 'Please contact a professional' : 'Zəhmət olmasa, peşəkarla əlaqə saxlayın';

  let systemPrompt = basePrompt.replace('{}', lang)
    .replace('{}', resultsRule.join(', '))
    .replace('{}', resultsLaw.join(', '))
    .replace('{}', resultsPost.join(', '))
    .replace('{}', resultsManual.join(', '))
    .replace('{}', noAnswerMsg);
  let fullInput = systemPrompt + '\n' + query;
  let tokenCount = await getTokenCount(fullInput);

  if (tokenCount !== null && tokenCount <= tpmLimit) return systemPrompt;

  let adjustedLaw = [...resultsLaw];
  let adjustedPost = [...resultsPost];
  let adjustedRule = [...resultsRule];
  let adjustedManual = [...resultsManual]

  while (adjustedPost.length && tokenCount !== null && tokenCount > tpmLimit) {
    adjustedPost.shift();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjustedRule.join(', '))
      .replace('{}', adjustedLaw.join(', '))
      .replace('{}', adjustedPost.join(', '))
      .replace('{}', adjustedManual.join(', '))
      .replace('{}', noAnswerMsg);
    fullInput = systemPrompt + '\n' + query;
    tokenCount = await getTokenCount(fullInput);
  }

  while (adjustedRule.length && tokenCount !== null && tokenCount > tpmLimit) {
    adjustedRule.shift();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjustedRule.join(', '))
      .replace('{}', adjustedLaw.join(', '))
      .replace('{}', adjustedPost.join(', '))
      .replace('{}', adjustedManual.join(', '))
      .replace('{}', noAnswerMsg);
    fullInput = systemPrompt + '\n' + query;
    tokenCount = await getTokenCount(fullInput);
  }

  while (adjustedLaw.length && tokenCount !== null && tokenCount > tpmLimit) {
    adjustedLaw.shift();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjustedRule.join(', '))
      .replace('{}', adjustedLaw.join(', '))
      .replace('{}', adjustedPost.join(', '))
      .replace('{}', adjustedManual.join(', '))
      .replace('{}', noAnswerMsg);
    fullInput = systemPrompt + '\n' + query;
    tokenCount = await getTokenCount(fullInput);
  }

  while (adjustedManual.length && tokenCount !== null && tokenCount > tpmLimit) {
    adjustedManual.shift();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjustedRule.join(', '))
      .replace('{}', adjustedLaw.join(', '))
      .replace('{}', adjustedPost.join(', '))
      .replace('{}', adjustedManual.join(', '))
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

  let resultsLaw = []
  let resultsManual = []
  let resultsPost = []
  let resultsRule = []

  if (settings.includeScraping) {
    resultsLaw = await fetchResults(lawIndex, queryEmbedding, 'law');
    resultsPost = await fetchResults(postIndex, queryEmbedding, 'post');
    resultsRule = await fetchResults(ruleIndex, queryEmbedding, 'rule');
  }
  if(settings.includeManual){
    resultsManual = await fetchResults(manualIndex, queryEmbedding, 'manual');
  }
  
  console.log("started prompt adjustion")

  const systemPrompt = await adjustPromptTokens(
    basePrompt,
    resultsLaw,
    resultsRule,
    resultsPost,
    resultsManual,
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