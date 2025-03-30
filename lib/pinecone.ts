import { Pinecone } from '@pinecone-database/pinecone';

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
export const lawIndex = pinecone.Index('law');
export const ruleIndex = pinecone.Index('rule');
export const postIndex = pinecone.Index('post');
export const manualIndex = pinecone.Index('manual');

async function ensureIndexes() {
    const requiredIndexes = ['law', 'rule', 'post', 'manual'];

    try {
        const existingIndexes = await pinecone.listIndexes(); // Returns an array of index names

        for (const indexName of requiredIndexes) {
            if (!existingIndexes.indexes?.findIndex((index) => index.name === indexName)) {
                console.log(`Index "${indexName}" does not exist. Creating...`);
                await pinecone.createIndex({
                    name: indexName,
                    dimension: 1024,
                    metric: 'cosine',
                    spec: {
                        serverless: { cloud: 'aws', region: 'us-east-1' },
                    },
                });
                console.log(`Index "${indexName}" created successfully.`);
            } else {
                console.log(`Index "${indexName}" already exists.`);
            }
        }
    } catch (error) {
        console.error('Error ensuring indexes:', error);
    }
}

ensureIndexes();
