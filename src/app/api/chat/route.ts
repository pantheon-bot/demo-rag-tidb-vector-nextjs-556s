import { openai } from '@ai-sdk/openai';
import { streamText, embed } from 'ai';
import { searchSimilarChunks } from '@/lib/db/rag';
import { saveMessage, getSessionHistory } from '@/lib/db/messages';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, sessionId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Invalid messages format', { status: 400 });
    }

    // Get the latest user message
    const userMessage = messages[messages.length - 1];
    if (userMessage.role !== 'user') {
      return new Response('Last message must be from user', { status: 400 });
    }

    // Use sessionId or generate a default one
    const activeSessionId = sessionId || 'default';

    // Save user message to database
    await saveMessage(activeSessionId, 'user', userMessage.content);

    // Generate embedding for the user query
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: userMessage.content,
    });

    // Perform vector similarity search to find relevant context
    const relevantChunks = await searchSimilarChunks(embedding, 3);

    // Build context from retrieved chunks
    const context = relevantChunks
      .map((chunk, idx) =>
        `[${idx + 1}] ${chunk.content} (relevance: ${(1 - chunk.distance).toFixed(3)})`
      )
      .join('\n\n');

    // Get recent conversation history
    const history = await getSessionHistory(activeSessionId, 10);

    // Build messages for the LLM
    const systemPrompt = `You are a helpful AI assistant with knowledge about TiDB, vector search, and RAG systems.

Use the following context from the knowledge base to answer questions. If the context doesn't contain relevant information, say so and provide a general answer based on your knowledge.

CONTEXT:
${context}

Guidelines:
- Provide accurate, helpful responses
- Reference the context when applicable
- Be concise but thorough
- If you're unsure, admit it`;

    // Prepare chat history for the model
    const chatHistory = history
      .slice(-10) // Last 10 messages
      .map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

    // Stream the AI response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: [...chatHistory, { role: 'user', content: userMessage.content }],
      temperature: 0.7,
      maxTokens: 1000,
      async onFinish({ text }) {
        // Save assistant response to database
        await saveMessage(activeSessionId, 'assistant', text);
      },
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to process chat request',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
