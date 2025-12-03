import { NextResponse } from 'next/server';
import { getAllSessions } from '@/lib/db/messages';

export async function GET() {
  try {
    const sessions = await getAllSessions();
    return NextResponse.json({ sessions });
  } catch (error) {
    console.error('Failed to fetch sessions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
