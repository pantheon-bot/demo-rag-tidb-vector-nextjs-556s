-- Create vector search index on rag_chunks.embedding column
-- Using HNSW index with cosine distance for similarity search
-- Note: Requires TiFlash replica to be set up

-- First, ensure TiFlash replica exists for the table
ALTER TABLE rag_chunks SET TIFLASH REPLICA 1;

-- Create vector index using cosine distance
-- This enables fast approximate nearest neighbor search
CREATE VECTOR INDEX idx_embedding
ON rag_chunks ((VEC_COSINE_DISTANCE(embedding)))
USING HNSW;
