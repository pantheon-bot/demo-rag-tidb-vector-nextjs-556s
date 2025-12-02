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
