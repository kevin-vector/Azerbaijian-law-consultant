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
- 'Rules': {}
- 'Laws': {}
- 'Posts': {}

Follow these instructions for every response:
1. Analyze the provided data and generate structured responses in bullet-point format.
2. Ensure responses are:
   - Logically coherent and legally accurate based on the data.
   - Specific to the provided data, avoiding vague or generic answers.
   - Optionally include citations to the source material (e.g., 'Rule: [title/section]', 'Law: [title/date]', 'Post: [summary/ID]') if relevant to support your reasoning—include them only when they add value or clarity.
3. For every query, provide two response sections in the following order:
   - '[Detailed Response]': Comprehensive answers with in-depth analysis, explanations, and examples from the data.
   - '[Summarized Response]': Concise answers focusing on key points without excessive elaboration.
4. If the user asks for an explanation of a legal concept, provide a clear and accurate explanation grounded in the data, using examples where applicable, in both sections.
5. If the query cannot be fully answered with the provided data due to insufficient or irrelevant content, do not speculate or provide incomplete answers. Instead, respond with: '{}' (translated to the appropriate language) in both sections.

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

function adjustPromptTokens(
  basePrompt: string,
  resultsRule: string[],
  resultsLaw: string[],
  resultsPost: string[],
  query: string,
  tpmLimit: number
) {
  const detected_lang = franc(query);
  const lang = detected_lang === 'eng' || detected_lang == "und" ? 'English' : 'Azerbaijani';
  console.log(`Detected language: ${franc(query)}`);
  const noAnswerMsg =
    lang === 'English' ? 'Please contact a professional' : 'Zəhmət olmasa, peşəkarla əlaqə saxlayın';

  let systemPrompt = basePrompt.replace('{}', lang)
    .replace('{}', resultsRule.join(', '))
    .replace('{}', resultsLaw.join(', '))
    .replace('{}', resultsPost.join(', '))
    .replace('{}', noAnswerMsg);
  let fullInput = systemPrompt + '\n' + query;
  let tokenCount = getTokenCount(fullInput);

  if (tokenCount <= tpmLimit) return systemPrompt;

  let adjustedLaw = [...resultsLaw];
  let adjustedPost = [...resultsPost];
  let adjustedRule = [...resultsRule];

  while (adjustedPost.length && tokenCount > tpmLimit) {
    adjustedPost.shift();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjustedRule.join(', '))
      .replace('{}', adjustedLaw.join(', '))
      .replace('{}', adjustedPost.join(', '))
      .replace('{}', noAnswerMsg);
    fullInput = systemPrompt + '\n' + query;
    tokenCount = getTokenCount(fullInput);
  }

  while (adjustedLaw.length && tokenCount > tpmLimit) {
    adjustedLaw.shift();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjustedRule.join(', '))
      .replace('{}', adjustedLaw.join(', '))
      .replace('{}', adjustedPost.join(', '))
      .replace('{}', noAnswerMsg);
    fullInput = systemPrompt + '\n' + query;
    tokenCount = getTokenCount(fullInput);
  }

  while (adjustedRule.length && tokenCount > tpmLimit) {
    adjustedRule.shift();
    systemPrompt = basePrompt.replace('{}', lang)
      .replace('{}', adjustedRule.join(', '))
      .replace('{}', adjustedLaw.join(', '))
      .replace('{}', adjustedPost.join(', '))
      .replace('{}', noAnswerMsg);
    fullInput = systemPrompt + '\n' + query;
    tokenCount = getTokenCount(fullInput);
  }

  return systemPrompt;
}

export async function POST(req: NextRequest) {
  const { query } = await req.json();
  if (!query) return NextResponse.json({ error: 'Query is required' }, { status: 400 });

  const mode = query.toLowerCase().startsWith('summarized:') ? 'Summarized' : 'Detailed';
  const cleanQuery = mode === 'Summarized' ? query.slice(11) : query;

  const queryEmbedding = await getEmbedding(cleanQuery);

  const resultsLaw = await fetchResults(lawIndex, queryEmbedding, 'law');
  const resultsPost = await fetchResults(postIndex, queryEmbedding, 'post');
  const resultsRule = await fetchResults(ruleIndex, queryEmbedding, 'rule');
  
  console.log("started prompt adjustion")

  const systemPrompt = adjustPromptTokens(
    basePrompt,
    resultsRule,
    resultsLaw,
    resultsPost,
    cleanQuery,
    TPM_LIMIT
  );

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: cleanQuery },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });
    const aiResponse = response.choices[0].message.content;
    return NextResponse.json({ response: aiResponse });
  } catch (e) {
    console.error('OpenAI error:', e);
    return NextResponse.json({ error: 'Failed to process query' }, { status: 500 });
  }
}