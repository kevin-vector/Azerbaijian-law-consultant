// lib/embeddings.ts
export async function getEmbedding(text: string, type: 'query' | 'passage' = 'query'): Promise<number[]> {
  const prefixedText = `${type}: ${text}`; // Add prefix as required by E5
  const response = await fetch('https://api.deepinfra.com/v1/openai/embeddings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.DEEPINFRA_API_KEY}`,
    },
    body: JSON.stringify({
      input: prefixedText,
      model: 'intfloat/multilingual-e5-large',
      encoding_format: 'float',
    }),
  });

  if (!response.ok) {
    throw new Error(`DeepInfra API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data[0].embedding; // Extract the embedding array
}