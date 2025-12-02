import { NextResponse } from 'next/server';
import { openai } from '@ai-sdk/openai';
import { embed } from 'ai';
import { getAllChunks, insertChunk } from '@/lib/db/rag';

export async function GET() {
  try {
    const chunks = await getAllChunks();
    return NextResponse.json({ documents: chunks });
  } catch (error) {
    console.error('Failed to fetch documents:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch documents',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { content, metadata } = await req.json();

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Content is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Generate embedding for the document content
    const { embedding } = await embed({
      model: openai.embedding('text-embedding-3-small'),
      value: content,
    });

    // Insert the document chunk with its embedding
    const chunk = await insertChunk(content, embedding, metadata || {});

    return NextResponse.json({
      message: 'Document added successfully',
      document: chunk
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to add document:', error);
    return NextResponse.json(
      {
        error: 'Failed to add document',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
