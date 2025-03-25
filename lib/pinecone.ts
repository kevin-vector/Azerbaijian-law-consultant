import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
export const lawIndex = pinecone.Index('law');
export const ruleIndex = pinecone.Index('rule');
export const postIndex = pinecone.Index('post');

async function listIndexes() {
const indexes = await pinecone.listIndexes();
console.log('Available indexes:', indexes);
}
  
// listIndexes();