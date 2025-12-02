# TiDB RAG Chat Demo

A fully functional Retrieval-Augmented Generation (RAG) chat application built with:
- **TiDB Cloud Serverless** with native VECTOR type for embeddings
- **AI SDK** from Vercel for model integration
- **Next.js 16 App Router** with React Server Components
- **shadcn/ui** components for the UI
- **OpenAI** embeddings and chat models

## Features

✅ **Vector Search**: Native TiDB VECTOR column with 1536 dimensions (OpenAI text-embedding-3-small)
✅ **RAG Pipeline**: Semantic search retrieves relevant context before generating responses
✅ **Chat History**: Persistent conversation storage in TiDB
✅ **Streaming Responses**: Real-time AI responses using AI SDK's streaming API
✅ **Type-Safe Database**: Kysely query builder with TypeScript types
✅ **Clean UI**: Modern chat interface built with shadcn/ui components

## Architecture

### Database Schema

**rag_chunks table:**
```sql
CREATE TABLE rag_chunks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  content TEXT NOT NULL,
  metadata JSON DEFAULT NULL,
  embedding VECTOR(1536) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**chat_messages table:**
```sql
CREATE TABLE chat_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  session_id VARCHAR(255) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### RAG Workflow

1. **User sends a message** → Saved to `chat_messages`
2. **Generate embedding** → OpenAI text-embedding-3-small (1536 dimensions)
3. **Vector similarity search** → Query TiDB using `VEC_COSINE_DISTANCE()`
4. **Retrieve top-k chunks** → Get 3 most relevant documents from knowledge base
5. **Build context** → Combine retrieved chunks + conversation history
6. **Generate response** → OpenAI GPT-4o-mini with streaming
7. **Save response** → Store assistant message in database

## Project Structure

```
src/
├── app/
│   ├── api/chat/route.ts          # Chat API endpoint with RAG logic
│   ├── layout.tsx                  # Root layout
│   └── page.tsx                    # Chat interface page
├── components/
│   ├── chat-interface.tsx          # Client-side chat UI component
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── db/
│   │   ├── db.ts                   # Kysely database instance
│   │   ├── index.ts                # Database exports
│   │   ├── schema.d.ts             # TypeScript schema definitions
│   │   ├── rag.ts                  # RAG-specific database functions
│   │   ├── messages.ts             # Chat message database functions
│   │   ├── migrate.ts              # Migration runner
│   │   └── migrations/             # SQL migration files
│   ├── seed-data.ts                # Demo data seeding script
│   └── utils.ts                    # Utility functions
```

## Setup Instructions

### 1. Prerequisites

- Node.js 18+
- TiDB Cloud Serverless cluster
- OpenAI API key

### 2. Environment Variables

Create `.env.local` with:

```bash
DATABASE_URL=mysql://[user]:[password]@[host]/[database]
OPENAI_API_KEY=sk-...
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run Database Migrations

```bash
npm run migrate
```

This creates:
- `rag_chunks` table with VECTOR column
- `chat_messages` table for chat history
- Vector index on embeddings (if TiFlash is available)

### 5. Seed Demo Data

```bash
npm run seed
```

This populates the knowledge base with 8 demo documents about:
- TiDB overview
- TiDB Vector Search
- RAG concepts
- AI SDK
- Vector embeddings

### 6. Start Development Server

```bash
npm run dev
```

Visit http://localhost:3000

## Key Implementation Details

### Vector Search Query

The app uses TiDB's native vector similarity search:

```typescript
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
```

### AI SDK Integration

Streaming responses with context injection:

```typescript
const result = streamText({
  model: openai('gpt-4o-mini'),
  system: systemPrompt, // Includes retrieved context
  messages: [...chatHistory, { role: 'user', content: userMessage }],
  async onFinish({ text }) {
    await saveMessage(sessionId, 'assistant', text);
  },
});

return result.toDataStreamResponse();
```

### Client-Side Hook

Using `@ai-sdk/react` for seamless streaming:

```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
  api: '/api/chat',
  body: { sessionId },
});
```

## Available Scripts

- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Serve production build
- `npm run lint` - Run ESLint
- `npm run migrate` - Execute database migrations
- `npm run seed` - Seed demo documents with embeddings

## Demo Knowledge Base

The app includes 8 pre-seeded documents covering:

1. TiDB introduction and capabilities
2. TiDB Vector Search features
3. Creating VECTOR columns in TiDB
4. Vector similarity search queries
5. TiDB Cloud Serverless overview
6. RAG (Retrieval-Augmented Generation) concepts
7. AI SDK features and integration
8. Vector embeddings explained

## Try It Out

Example questions to ask:

- "What is TiDB Vector Search?"
- "How do I create a vector column in TiDB?"
- "Explain how RAG works"
- "What distance functions does TiDB support?"
- "How do I perform vector similarity search?"

## Technical Highlights

### TiDB VECTOR Type

- Native support for vector data
- Fixed dimensions (1536 for text-embedding-3-small)
- Efficient storage format
- HNSW index support for fast approximate nearest neighbor search

### Type Safety

- Kysely for type-safe SQL queries
- TypeScript interfaces for all database tables
- Generated types stay in sync with schema

### Performance

- Vector index enables fast similarity search
- Streaming responses for better UX
- Server Components for optimal loading
- Client Components only where needed (chat UI)

## Troubleshooting

**Tables not created:**
- Run `npm run migrate` explicitly
- Check DATABASE_URL is correct
- Verify TiDB Cloud cluster is accessible

**Seeding fails:**
- Ensure OPENAI_API_KEY is set
- Check tables exist first
- Verify TiDB cluster supports VECTOR type

**Chat not working:**
- Check browser console for errors
- Verify API route at /api/chat
- Ensure both env vars are set

## Next Steps

To extend this demo:

1. **Add file upload** for custom knowledge base
2. **Implement chunk management UI** to view/edit documents
3. **Add metadata filtering** to RAG queries
4. **Support multiple sessions** with user authentication
5. **Add citations** showing which chunks were used
6. **Implement caching** for embeddings
7. **Add analytics** for query performance

## Resources

- [TiDB Vector Search Docs](https://docs.pingcap.com/tidbcloud/vector-search-overview)
- [AI SDK Documentation](https://ai-sdk.dev)
- [Next.js App Router](https://nextjs.org/docs/app)
- [shadcn/ui Components](https://ui.shadcn.com)

## License

This is a demo application for learning purposes.
