import { Generated, ColumnType } from 'kysely';

export interface DB {
  rag_chunks: {
    id: Generated<number>;
    content: string;
    metadata: ColumnType<Record<string, any> | null, string | null, string | null>;
    embedding: string; // VECTOR(1536) stored as string representation
    created_at: Generated<Date>;
  };
  chat_messages: {
    id: Generated<number>;
    session_id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    created_at: Generated<Date>;
  };
}