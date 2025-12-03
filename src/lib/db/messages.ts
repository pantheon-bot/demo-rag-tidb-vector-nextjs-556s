import db from './index';

export interface ChatMessage {
  id: number;
  session_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: Date;
}

/**
 * Save a new chat message to the database
 */
export async function saveMessage(
  sessionId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ChatMessage> {
  const result = await db
    .insertInto('chat_messages')
    .values({
      session_id: sessionId,
      role,
      content,
    })
    .executeTakeFirstOrThrow();

  // TiDB doesn't support RETURNING in MySQL mode, so fetch the last inserted row
  const insertId = Number(result.insertId);
  const inserted = await db
    .selectFrom('chat_messages')
    .selectAll()
    .where('id', '=', insertId)
    .executeTakeFirstOrThrow();

  return inserted;
}

/**
 * Get recent chat history for a session
 * Returns messages in chronological order (oldest first)
 */
export async function getSessionHistory(
  sessionId: string,
  limit: number = 20
): Promise<ChatMessage[]> {
  const results = await db
    .selectFrom('chat_messages')
    .selectAll()
    .where('session_id', '=', sessionId)
    .orderBy('created_at', 'desc')
    .limit(limit)
    .execute();

  // Reverse to get chronological order
  return results.reverse();
}

/**
 * Get all messages for a session (for debugging)
 */
export async function getAllSessionMessages(
  sessionId: string
): Promise<ChatMessage[]> {
  return await db
    .selectFrom('chat_messages')
    .selectAll()
    .where('session_id', '=', sessionId)
    .orderBy('created_at', 'asc')
    .execute();
}

/**
 * Delete all messages for a session
 */
export async function deleteSessionMessages(
  sessionId: string
): Promise<void> {
  await db
    .deleteFrom('chat_messages')
    .where('session_id', '=', sessionId)
    .execute();
}

export interface SessionSummary {
  session_id: string;
  message_count: number;
  last_message_at: Date;
  first_message_at: Date;
  preview: string;
}

/**
 * Get all chat sessions with summary information
 */
export async function getAllSessions(): Promise<SessionSummary[]> {
  const results = await db
    .selectFrom('chat_messages')
    .select([
      'session_id',
      (eb) => eb.fn.count('id').as('message_count'),
      (eb) => eb.fn.max('created_at').as('last_message_at'),
      (eb) => eb.fn.min('created_at').as('first_message_at'),
    ])
    .groupBy('session_id')
    .orderBy('last_message_at', 'desc')
    .execute();

  // Get preview (first user message) for each session
  const sessionsWithPreview = await Promise.all(
    results.map(async (session) => {
      const firstUserMessage = await db
        .selectFrom('chat_messages')
        .select('content')
        .where('session_id', '=', session.session_id)
        .where('role', '=', 'user')
        .orderBy('created_at', 'asc')
        .limit(1)
        .executeTakeFirst();

      return {
        session_id: session.session_id,
        message_count: Number(session.message_count),
        last_message_at: new Date(session.last_message_at as unknown as string),
        first_message_at: new Date(session.first_message_at as unknown as string),
        preview: firstUserMessage?.content.substring(0, 100) || 'No messages',
      };
    })
  );

  return sessionsWithPreview;
}
