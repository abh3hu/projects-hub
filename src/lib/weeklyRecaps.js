const { extractOpenLoops } = require('./openLoops');

const DONE_PATTERNS = [
  /\bcompleted\b/i,
  /\bfinished\b/i,
  /\bdone\b/i,
  /\bshipped\b/i,
  /\blaunched\b/i,
  /\bdeployed\b/i,
  /\bfixed\b/i,
  /\bverified\b/i,
  /\bimplemented\b/i,
  /\bcreated\b/i,
  /\bbuilt\b/i,
  /\badded\b/i,
  /\bpublished\b/i,
  /\bupdated\b/i,
  /\bmerged\b/i
];

const USER_DONE_PATTERNS = [
  /\bi\s+(?:just\s+)?(?:completed|finished|shipped|launched|deployed|fixed|verified|implemented|created|built|added|published|updated|merged)\b/i,
  /\bwe\s+(?:just\s+)?(?:completed|finished|shipped|launched|deployed|fixed|verified|implemented|created|built|added|published|updated|merged)\b/i
];

const ASSISTANT_DONE_PATTERNS = [
  /^(?:i|we)\s+/i,
  /^(?:completed|finished|shipped|launched|deployed|fixed|verified|implemented|created|built|added|updated|merged)\b/i
];

const NOT_DONE_PATTERNS = [
  /^#{1,6}\s/,
  /^if you want/i,
  /^what do you need/i,
  /^respond only/i,
  /^user asked:/i,
  /^critical context/i,
  /^remaining work/i,
  /^pending user asks/i,
  /^resolved questions/i,
  /^\[context compaction/i,
  /^called tool\(s\):/i,
  /^i can\b/i,
  /^i could\b/i,
  /^i will\b/i,
  /^we can\b/i,
  /^let me\b/i,
  /\bneed to\b/i,
  /\bnext step\b/i,
  /\bshould\b/i,
  /\bwould\b/i,
  /\bplan to\b/i
];

function toDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === 'number') return new Date(value * 1000);
  if (typeof value === 'string' && /^\d+$/.test(value)) return new Date(Number(value) * 1000);
  return new Date(value);
}

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function startOfIsoWeek(dateLike) {
  const date = toDate(dateLike);
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - day + 1);
  utc.setUTCHours(0, 0, 0, 0);
  return utc;
}

function endOfIsoWeek(dateLike) {
  const start = startOfIsoWeek(dateLike);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);
  end.setUTCHours(23, 59, 59, 999);
  return end;
}

function formatWeekLabel(start, end) {
  const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
  return `${formatter.format(start)} – ${formatter.format(end)}`;
}

function sentenceCandidates(content) {
  return String(content || '')
    .split(/\n|(?<=[.!?])\s+/)
    .map(text => text.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter(line => line.length >= 8)
    .filter(line => line.length <= 180)
    .filter(line => !/[`|]/.test(line))
    .filter(line => !/[{}]/.test(line))
    .filter(line => !/^https?:\/\//i.test(line))
    .filter(line => !/^\s*(LINE_NUM\||\d+\|)/.test(line));
}

function normalizeSentence(text) {
  const trimmed = text.replace(/^[-*]\s*/, '').trim().replace(/[.]+$/g, '');
  return trimmed ? trimmed[0].toUpperCase() + trimmed.slice(1) : trimmed;
}

function extractDoneItems(messages, maxItems = 5) {
  const done = [];
  const seen = new Set();
  for (const message of messages || []) {
    if (!message?.content) continue;
    if (/\[CONTEXT COMPACTION|## Active Task|## Completed Actions|## Remaining Work/i.test(message.content)) continue;
    for (const candidate of sentenceCandidates(message.content)) {
      if (NOT_DONE_PATTERNS.some(pattern => pattern.test(candidate))) continue;
      if (!DONE_PATTERNS.some(pattern => pattern.test(candidate))) continue;
      const allowedRole = message.role === 'assistant'
        ? ASSISTANT_DONE_PATTERNS.some(pattern => pattern.test(candidate))
        : USER_DONE_PATTERNS.some(pattern => pattern.test(candidate));
      if (!allowedRole) continue;
      const text = normalizeSentence(candidate);
      if (text.split(/\s+/).length < 3) continue;
      if (text.endsWith(':')) continue;
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      done.push({ text, role: message.role, timestamp: message.timestamp || null });
      if (done.length >= maxItems) return done;
    }
  }
  return done;
}

function projectNameMap(projects) {
  return new Map((projects || []).map(project => [project.id, project.name]));
}

function appendUnique(target, items, seen, mapper = item => item.text.toLowerCase()) {
  for (const item of items) {
    const key = mapper(item);
    if (seen.has(key)) continue;
    seen.add(key);
    target.push(item);
  }
}

function generateWeeklyRecaps({ projects = [], conversations = [], maxWeeks = 4 } = {}) {
  const projectsById = new Map((projects || []).map(project => [project.id, project]));
  const projectNames = projectNameMap(projects);
  const grouped = new Map();

  for (const conversation of conversations || []) {
    const anchor = conversation.lastMessageAt || conversation.startedAt;
    const date = toDate(anchor);
    if (!isValidDate(date)) continue;
    const weekStart = startOfIsoWeek(date);
    const weekEnd = endOfIsoWeek(date);
    const weekKey = weekStart.toISOString();
    if (!grouped.has(weekKey)) {
      grouped.set(weekKey, {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        weekLabel: formatWeekLabel(weekStart, weekEnd),
        conversationCount: 0,
        projectIds: new Set(),
        done: [],
        next: [],
        touchedConversationIds: []
      });
    }

    const bucket = grouped.get(weekKey);
    bucket.conversationCount += 1;
    bucket.touchedConversationIds.push(conversation.id);
    if (conversation.projectId) bucket.projectIds.add(conversation.projectId);

    const doneSeen = new Set(bucket.done.map(item => item.text.toLowerCase()));
    appendUnique(
      bucket.done,
      extractDoneItems(conversation.messages).map(item => ({
        ...item,
        conversationId: conversation.id,
        projectId: conversation.projectId || null,
        projectName: conversation.projectId ? projectNames.get(conversation.projectId) || null : null
      })),
      doneSeen
    );

    const nextSeen = new Set(bucket.next.map(item => item.text.toLowerCase()));
    appendUnique(
      bucket.next,
      extractOpenLoops(conversation.messages, 5).map(item => ({
        ...item,
        conversationId: conversation.id,
        projectId: conversation.projectId || null,
        projectName: conversation.projectId ? projectNames.get(conversation.projectId) || null : null
      })),
      nextSeen
    );
  }

  const recaps = [...grouped.values()]
    .sort((a, b) => new Date(b.weekStart).getTime() - new Date(a.weekStart).getTime())
    .slice(0, maxWeeks)
    .map((bucket, index) => {
      const nextSeen = new Set(bucket.next.map(item => item.text.toLowerCase()));
      for (const projectId of bucket.projectIds) {
        const project = projectsById.get(projectId);
        if (!project) continue;
        for (const item of project.remaining || []) {
          if (item.done) continue;
          const text = normalizeSentence(item.text);
          if (!text) continue;
          const key = text.toLowerCase();
          if (nextSeen.has(key)) continue;
          nextSeen.add(key);
          bucket.next.push({
            text,
            role: 'project',
            timestamp: null,
            conversationId: null,
            projectId: project.id,
            projectName: project.name
          });
        }
        if (project.blockedOn) {
          const text = normalizeSentence(`Blocked on: ${project.blockedOn}`);
          const key = text.toLowerCase();
          if (!nextSeen.has(key)) {
            nextSeen.add(key);
            bucket.next.push({
              text,
              role: 'project',
              timestamp: null,
              conversationId: null,
              projectId: project.id,
              projectName: project.name
            });
          }
        }
      }

      return {
        id: `week-${bucket.weekStart}`,
        order: index,
        weekStart: bucket.weekStart,
        weekEnd: bucket.weekEnd,
        weekLabel: bucket.weekLabel,
        conversationCount: bucket.conversationCount,
        projectsTouched: [...bucket.projectIds].map(projectId => projectNames.get(projectId) || projectId),
        done: bucket.done.slice(0, 5),
        next: bucket.next.slice(0, 5)
      };
    });

  return recaps;
}

module.exports = { generateWeeklyRecaps, extractDoneItems, startOfIsoWeek };
