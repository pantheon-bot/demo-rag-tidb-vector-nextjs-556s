import db from './index';
import { sql } from 'kysely';

export interface RAGChunk {
  id: number;
  content: string;
  metadata: Record<string, any> | null;
  embedding: string;
  created_at: Date;
}

export interface ChunkWithDistance extends RAGChunk {
  distance: number;
}

/**
 * Insert a new RAG chunk with its embedding
 */
export async function insertChunk(
  content: string,
  embedding: number[],
  metadata?: Record<string, any>
): Promise<RAGChunk> {
  // Convert embedding array to TiDB VECTOR string format
  const embeddingStr = `[${embedding.join(',')}]`;

  const result = await db
    .insertInto('rag_chunks')
    .values({
      content,
      embedding: embeddingStr,
      metadata: metadata ? JSON.stringify(metadata) : null,
    })
    .executeTakeFirstOrThrow();

  // TiDB doesn't support RETURNING in MySQL mode, so fetch the last inserted row
  const insertId = Number(result.insertId);
  const inserted = await db
    .selectFrom('rag_chunks')
    .selectAll()
    .where('id', '=', insertId)
    .executeTakeFirstOrThrow();

  return {
    ...inserted,
    metadata: typeof inserted.metadata === 'string'
      ? JSON.parse(inserted.metadata)
      : inserted.metadata,
  };
}

/**
 * Perform vector similarity search using cosine distance
 * Returns top-k most similar chunks to the query embedding
 */
export async function searchSimilarChunks(
  queryEmbedding: number[],
  limit: number = 5
): Promise<ChunkWithDistance[]> {
  // Convert query embedding to TiDB VECTOR string format
  const embeddingStr = `[${queryEmbedding.join(',')}]`;

  // Use raw SQL for vector similarity search with cosine distance
  // ORDER BY distance ASC returns most similar first (smallest distance)
  const results = await sql<ChunkWithDistance>`
    SELECT
      id,
      content,
      metadata,
      embedding,
      created_at,
      VEC_COSINE_DISTANCE(embedding, ${embeddingStr}) AS distance
    FROM rag_chunks
    ORDER BY distance
    LIMIT ${limit}
  `.execute(db);

  return results.rows.map(row => ({
    ...row,
    metadata: row.metadata
      ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata)
      : null,
  }));
}

/**
 * Get all RAG chunks (for admin/debugging)
 */
export async function getAllChunks(): Promise<RAGChunk[]> {
  const results = await db
    .selectFrom('rag_chunks')
    .selectAll()
    .orderBy('created_at', 'desc')
    .execute();

  return results.map(row => ({
    ...row,
    metadata: row.metadata
      ? (typeof row.metadata === 'string' ? JSON.parse(row.metadata) : row.metadata)
      : null,
  }));
}

/**
 * Delete all RAG chunks (for testing/reset)
 */
export async function deleteAllChunks(): Promise<void> {
  await db.deleteFrom('rag_chunks').execute();
}
