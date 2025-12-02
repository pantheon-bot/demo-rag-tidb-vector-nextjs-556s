import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { insertChunk, deleteAllChunks, getAllChunks } from './db/rag';

// Demo documents about TiDB and vector search
const demoDocuments = [
  {
    content: 'TiDB is an open-source, cloud-native, distributed SQL database for elastic scale and real-time analytics. It supports both OLTP and OLAP workloads and is MySQL compatible.',
    metadata: { category: 'tidb-intro', source: 'docs' }
  },
  {
    content: 'TiDB Vector Search enables you to store vector embeddings alongside your relational data. It uses the native VECTOR data type and supports HNSW indexes for fast approximate nearest neighbor search.',
    metadata: { category: 'vector-search', source: 'docs' }
  },
  {
    content: 'To create a vector column in TiDB, use the VECTOR(dimension) data type. For example: CREATE TABLE documents (id INT PRIMARY KEY, embedding VECTOR(1536)). The dimension must match your embedding model.',
    metadata: { category: 'vector-search', source: 'docs' }
  },
  {
    content: 'Vector similarity search in TiDB uses distance functions like VEC_COSINE_DISTANCE. Query with: SELECT * FROM table ORDER BY VEC_COSINE_DISTANCE(embedding, query_vector) LIMIT k to find the k most similar vectors.',
    metadata: { category: 'vector-search', source: 'docs' }
  },
  {
    content: 'TiDB Cloud Serverless is a fully managed database service that scales automatically. It provides a MySQL-compatible interface and includes built-in vector search capabilities for AI applications.',
    metadata: { category: 'tidb-cloud', source: 'docs' }
  },
  {
    content: 'RAG (Retrieval-Augmented Generation) combines vector search with language models. First, retrieve relevant context from your knowledge base using vector similarity, then pass it to the LLM for grounded responses.',
    metadata: { category: 'rag', source: 'docs' }
  },
  {
    content: 'The AI SDK from Vercel provides a unified interface for working with different AI models. It supports streaming responses, tool calling, and integrates seamlessly with Next.js applications.',
    metadata: { category: 'ai-sdk', source: 'docs' }
  },
  {
    content: 'Vector embeddings are dense numerical representations of text that capture semantic meaning. Similar concepts have embeddings that are close together in vector space, enabling semantic search.',
    metadata: { category: 'embeddings', source: 'docs' }
  },
];

/**
 * Seed the database with demo documents and their embeddings
 */
export async function seedDemoData() {
  console.log('Starting data seeding...');

  try {
    // Check if data already exists
    const existing = await getAllChunks();
    if (existing.length > 0) {
      console.log(`Found ${existing.length} existing chunks. Clearing...`);
      await deleteAllChunks();
    }

    console.log(`Seeding ${demoDocuments.length} demo documents...`);

    for (let i = 0; i < demoDocuments.length; i++) {
      const doc = demoDocuments[i];
      console.log(`  [${i + 1}/${demoDocuments.length}] Embedding: "${doc.content.substring(0, 50)}..."`);

      // Generate embedding using OpenAI
      const { embedding } = await embed({
        model: openai.embedding('text-embedding-3-small'),
        value: doc.content,
      });

      // Insert into database
      await insertChunk(doc.content, embedding, doc.metadata);
      console.log(`    ✓ Inserted chunk with ${embedding.length} dimensions`);
    }

    console.log('✓ Seeding completed successfully!');
    console.log(`Total chunks: ${demoDocuments.length}`);

  } catch (error) {
    console.error('Seeding failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
