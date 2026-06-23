const fs = require('fs');
const Database = require('better-sqlite3');

function loadChannelDirectory(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

function loadRecentConversations({ stateDbFile, channelDirectoryFile, limit = 20 }) {
  const db = new Database(stateDbFile, { readonly: true });
  const sessions = db.prepare(`
    SELECT id, title, source, parent_session_id AS parentSessionId, started_at AS startedAt, message_count AS messageCount
    FROM sessions
    WHERE source != 'cron'
    ORDER BY started_at DESC
    LIMIT ?
  `).all(limit);

  const messageStmt = db.prepare(`
    SELECT role, content, timestamp
    FROM messages
    WHERE session_id = ?
      AND active = 1
      AND role IN ('user', 'assistant')
      AND content IS NOT NULL
      AND trim(content) != ''
    ORDER BY timestamp DESC
    LIMIT 10
  `);

  const channels = loadChannelDirectory(channelDirectoryFile);

  const conversations = sessions.map(session => {
    const recentMessages = messageStmt.all(session.id).reverse();
    const lastMessage = recentMessages[recentMessages.length - 1] || null;
    return {
      id: session.id,
      title: session.title || 'Untitled conversation',
      source: session.source,
      parentSessionId: session.parentSessionId,
      startedAt: session.startedAt,
      lastMessageAt: lastMessage?.timestamp || session.startedAt,
      messageCount: session.messageCount,
      messages: recentMessages,
      channelLabel: channels[session.id]?.name || null,
      summary: recentMessages.slice(-2).map(message => message.content).join(' ').slice(0, 280)
    };
  });

  db.close();
  return conversations;
}

module.exports = { loadRecentConversations };
