import { openai } from '@ai-sdk/openai';
import { streamText, embed, convertToModelMessages, type UIMessage } from 'ai';
import { searchSimilarChunks } from '@/lib/db/rag';
import { saveMessage } from '@/lib/db/messages';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, sessionId }: { messages: UIMessage[]; sessionId?: string } = await req.json();

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

    // Extract text content from the user message
    const userText = userMessage.parts
      .filter(part => part.type === 'text')
      .map(part => 'text' in part ? part.text : '')
      .join(' ');

    // Save user message to database
    await saveMessage(activeSessionId, 'user', userText);

    // Generate embedding for the user query
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: userText,
    });

    // Perform vector similarity search to find relevant context
    const relevantChunks = await searchSimilarChunks(embedding, 3);

    // Build context from retrieved chunks
    const context = relevantChunks
      .map((chunk, idx) =>
        `[${idx + 1}] ${chunk.content} (relevance: ${(1 - chunk.distance).toFixed(3)})`
      )
      .join('\n\n');

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

    // Convert UI messages to model messages format
    const modelMessages = convertToModelMessages(messages);

    // Stream the AI response
    const result = streamText({
      model: openai('gpt-4o-mini'),
      system: systemPrompt,
      messages: modelMessages,
      temperature: 0.7,
      maxOutputTokens: 1000,
      async onFinish({ text }) {
        // Save assistant response to database
        await saveMessage(activeSessionId, 'assistant', text);
      },
    });

    return result.toUIMessageStreamResponse();
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
