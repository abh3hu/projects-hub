const OPEN_LOOP_PATTERNS = [
  /\bneed to\b/i,
  /\bneeds?\b/i,
  /\bnext step\b/i,
  /\bfollow up\b/i,
  /\bblocked\b/i,
  /\btodo\b/i,
  /\bto do\b/i,
  /\bfigure out\b/i,
  /\bset up\b/i,
  /\bdeploy\b/i,
  /\bbuild\b/i,
  /\bfix\b/i,
  /\bship\b/i,
  /\bcreate\b/i,
  /\bmake\b/i
];

const NEGATIVE_PATTERNS = [
  /^#{1,6}\s/,
  /^if you want/i,
  /^what do you need/i,
  /^respond only/i,
  /^updated task tracker/i,
  /^\*+audit/i,
  /^\*+set up/i,
  /^good if you want/i,
  /^what i would/i,
  /^anything you don't want/i,
  /^user asked:/i,
  /^critical context/i,
  /^remaining work/i,
  /^pending user asks/i,
  /^resolved questions/i,
  /^\[context compaction/i,
  /^\(in_progress\)/i,
  /^\[x\]/i,
  /^tool:/i,
  /^called tool\(s\):/i
];

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function sentenceCandidates(content) {
  return content
    .split(/\n|(?<=[.!?])\s+/)
    .map(normalize)
    .filter(Boolean)
    .filter(line => line.length >= 12)
    .filter(line => line.length <= 180)
    .filter(line => !/[`|]/.test(line))
    .filter(line => !/[{}]/.test(line))
    .filter(line => !/^https?:\/\//i.test(line))
    .filter(line => !/^\s*(LINE_NUM\||\d+\|)/.test(line));
}

function extractOpenLoops(messages, maxItems = 3) {
  const seen = new Set();
  const loops = [];
  for (const message of messages) {
    if (!message || !message.content || message.role !== 'user') continue;
    if (/\[CONTEXT COMPACTION|## Active Task|## Completed Actions|## Remaining Work/i.test(message.content)) continue;
    for (const candidate of sentenceCandidates(message.content)) {
      if (NEGATIVE_PATTERNS.some(pattern => pattern.test(candidate))) continue;
      if (!OPEN_LOOP_PATTERNS.some(pattern => pattern.test(candidate))) continue;
      const cleaned = candidate.replace(/^[-*]\s*/, '').trim();
      const key = cleaned.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      loops.push({
        text: cleaned.length > 180 ? `${cleaned.slice(0, 177)}...` : cleaned,
        role: message.role,
        timestamp: message.timestamp
      });
      if (loops.length >= maxItems) return loops;
    }
  }
  return loops;
}

module.exports = { extractOpenLoops };
