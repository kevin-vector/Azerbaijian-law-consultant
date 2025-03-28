import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase';
import { lawIndex, ruleIndex, postIndex } from '../../../lib/pinecone';
import { getEmbedding } from '../../../lib/embeddings';
import { getTokenCount, truncateText } from '../../../lib/tokenizer';
import OpenAI from 'openai';
import {franc} from 'franc';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const TPM_LIMIT = 30000;

const basePrompt = `You are an advanced legal analysis AI built to assist users in understanding and interpreting legal documents, laws, and related social media posts. Your primary focus is on legal documents ('rules' and 'laws'), which include detailed legal texts ('rules') and formal announcements of law changes ('laws'). You also have access to social media posts ('posts') discussing law-related topics, but these are secondary to the legal documents unless otherwise specified. Your task is to analyze the provided data and generate responses based on user queries.

Respond in the following language: {}.

The user has provided a dataset containing the following retrieved entries:
- 'Azerbaijian Tax Code': {}
- 'Azerbaijian Law': {}
- 'Social Posts': {}
These data are written in the Azerbaijani language, so you should interpret them very carefully. You need not to make any errors when understanding these in English because it could be changed when you try to translate these.

Follow these instructions for every response:
1. Analyze the provided data and generate structured responses in bullet-point format. When generating response, please include all available information from the data, especially law articles, if the data is regarded with user's query even slightly.
2. Ensure responses are:
   - Logically coherent and legally accurate based on the data.
   - Specificity to the query, citing exact provisions (e.g., 'Law: Tax Code, Article 13.2.1') with translated text when applicable, avoiding vague or generic answers.
   - Mandatory citations to source material (e.g., 'Azerbaijian Tax Code: [title/section]', 'Azerbaijian Law: [title/date]', 'Social Posts: [title]') when answering queries about legal governance or provisions.
3. For every query, provide two response sections in the following order:
   - '[Detailed Response]': Comprehensive answers with in-depth analysis, explanations, and examples from the data. This part must be very specific and highly detailed.
   - '[Summarized Response]': Concise answers focusing on key points without excessive elaboration.
4. Must explain every legal concept, providing clear, accurate explanations grounded in the data, with examples.
5. If the query cannot be fully answered with the provided data due to insufficient or irrelevant content, do not speculate or provide incomplete answers. Instead, respond with: '{}' (translated to the appropriate language) in both sections.
6. Do not include disclaimers like "consult a legal professional" unless explicitly requested.

For this task, the user’s query is provided separately. Analyze the provided dataset and respond with both a Detailed and a Summarized response, clearly separated by their respective headers '[Detailed Response]' and '[Summarized Response]'`;

async function fetchContentFromSupabase(id: number, tableName: string) {
  const table = `Ajerbaijian_${tableName}`;
  try {
    const { data, error } = await supabase
      .from(table)
      .select('content')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data?.content ?? 'No content found';
  } catch (e) {
    console.error(`Supabase error for ${tableName} ID ${id}:`, e);
    return 'No content found';
  }
}

async function fetchResults(index: any, queryEmbedding: number[], indexName: string) {
  try {
    const results = await index.query({
      vector: queryEmbedding,
      topK: 3,
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
    .replace('{}', noAnswerMsg);
  let fullInput = systemPrompt + '\n' + query;
  let tokenCount = await getTokenCount(fullInput);

  if (tokenCount !== null && tokenCount <= tpmLimit) return systemPrompt;

  let adjustedLaw = [...resultsLaw];
  let adjustedPost = [...resultsPost];
  let adjustedRule = [...resultsRule];

  while (adjustedPost.length && tokenCount !== null && tokenCount > tpmLimit) {
    adjustedPost.shift();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjustedRule.join(', '))
      .replace('{}', adjustedLaw.join(', '))
      .replace('{}', adjustedPost.join(', '))
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
      .replace('{}', noAnswerMsg);
    fullInput = systemPrompt + '\n' + query;
    tokenCount = await getTokenCount(fullInput);
  }

  return systemPrompt;
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

  const queryEmbedding = await getEmbedding(query);

  const resultsLaw = await fetchResults(lawIndex, queryEmbedding, 'law');
  const resultsPost = await fetchResults(postIndex, queryEmbedding, 'post');
  const resultsRule = await fetchResults(ruleIndex, queryEmbedding, 'rule');
  
  console.log("started prompt adjustion")

  const systemPrompt = await adjustPromptTokens(
    basePrompt,
    resultsRule,
    resultsLaw,
    resultsPost,
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
      // temperature: 0.7,
      max_tokens: 10000,
    });
    const aiResponse = response.choices[0].message.content;
    return NextResponse.json({ response: aiResponse });
  } catch (e) {
    console.error('OpenAI error:', e);
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 });
  }
}