import { encoding_for_model } from 'tiktoken';

import { TiktokenModel } from 'tiktoken';

export async function getTokenCount(text: string, modelName: TiktokenModel = 'gpt-4o' as TiktokenModel) {
    try {
      const encoder = encoding_for_model(modelName);
      const encoded = encoder.encode(text);
      const tokenCount = encoded.length;
      encoder.free(); // Release resources
      return tokenCount;
    } catch (error) {
      console.error('Error counting tokens:', error);
      return null;
    }
  }

export function truncateText(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    return text.slice(0, maxChars);
}