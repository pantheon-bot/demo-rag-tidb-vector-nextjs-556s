-- Create rag_chunks table with VECTOR column for embeddings
-- Using OpenAI text-embedding-3-small which has 1536 dimensions

CREATE TABLE IF NOT EXISTS rag_chunks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSON DEFAULT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
