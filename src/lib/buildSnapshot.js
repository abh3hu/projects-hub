const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { loadProjects } = require('./parseProjects');
const { loadRecentConversations } = require('./hermesSessions');
const { extractOpenLoops } = require('./openLoops');
const { linkProject } = require('./linkProjects');
const { buildGraph } = require('./buildGraph');

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function buildSnapshot(config) {
  const { all: allProjects, sections } = loadProjects(config.projectsFile);
  const conversations = loadRecentConversations(config);

  const enrichedConversations = conversations.map(conversation => {
    const loops = extractOpenLoops(conversation.messages);
    const { projectId, confidence } = linkProject(allProjects, conversation, config.aliasesFile);
    return {
      id: conversation.id,
      title: conversation.title,
      source: conversation.source,
      parentSessionId: conversation.parentSessionId,
      startedAt: conversation.startedAt,
      lastMessageAt: conversation.lastMessageAt,
      messageCount: conversation.messageCount,
      channelLabel: conversation.channelLabel,
      summary: conversation.summary,
      loops,
      projectId,
      confidence,
      isOpen: loops.length > 0 || !!projectId
    };
  });

  const projectMap = new Map(allProjects.map(project => [project.id, project]));
  const openLoops = [];
  for (const conversation of enrichedConversations) {
    for (const loop of conversation.loops) {
      openLoops.push({
        id: `${conversation.id}:${openLoops.length}`,
        text: loop.text,
        role: loop.role,
        conversationId: conversation.id,
        conversationTitle: conversation.title,
        projectId: conversation.projectId,
        projectName: conversation.projectId ? projectMap.get(conversation.projectId)?.name || null : null,
        timestamp: loop.timestamp
      });
    }
  }

  const graph = buildGraph(allProjects, enrichedConversations);
  for (const project of sections.active) {
    for (const item of project.remaining) {
      openLoops.push({
        id: `project:${project.id}:${openLoops.length}`,
        text: item.text,
        role: 'project',
        conversationId: null,
        conversationTitle: 'Project tracker',
        projectId: project.id,
        projectName: project.name,
        timestamp: null
      });
    }
    if (project.blockedOn) {
      openLoops.push({
        id: `project-blocked:${project.id}:${openLoops.length}`,
        text: `Blocked on: ${project.blockedOn}`,
        role: 'project',
        conversationId: null,
        conversationTitle: 'Project tracker',
        projectId: project.id,
        projectName: project.name,
        timestamp: null
      });
    }
  }
  const dedupedLoops = [];
  const seenLoops = new Set();
  for (const loop of openLoops) {
    const key = `${loop.projectId || 'none'}:${loop.text.toLowerCase()}`;
    if (seenLoops.has(key)) continue;
    seenLoops.add(key);
    dedupedLoops.push(loop);
  }
  const generatedAt = new Date().toISOString();
  const summary = {
    projectCounts: {
      active: sections.active.length,
      backlog: sections.backlog.length,
      completed: sections.completed.length
    },
    openLoopCount: dedupedLoops.length,
    conversationCount: enrichedConversations.length,
    linkedConversationCount: enrichedConversations.filter(item => item.projectId).length,
    generatedAt
  };

  return {
    generatedAt,
    summary,
    projects: {
      active: sections.active,
      backlog: sections.backlog,
      completed: sections.completed,
      all: allProjects
    },
    conversations: enrichedConversations,
    openLoops: dedupedLoops,
    graph
  };
}

function writeSnapshot(config, snapshot) {
  ensureDir(config.snapshotFile);
  fs.writeFileSync(config.snapshotFile, JSON.stringify(snapshot, null, 2));
  ensureDir(config.derivedDbFile);
  const db = new Database(config.derivedDbFile);
  db.exec(`
    DROP TABLE IF EXISTS snapshots;
    CREATE TABLE snapshots (id INTEGER PRIMARY KEY, generated_at TEXT NOT NULL, payload_json TEXT NOT NULL);
  `);
  db.prepare('INSERT INTO snapshots (generated_at, payload_json) VALUES (?, ?)').run(snapshot.generatedAt, JSON.stringify(snapshot));
  db.close();
}

function loadSnapshot(snapshotFile) {
  return JSON.parse(fs.readFileSync(snapshotFile, 'utf8'));
}

module.exports = { buildSnapshot, writeSnapshot, loadSnapshot };
