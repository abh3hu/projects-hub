const fs = require('fs');

function locationAlias(project) {
  const location = project.location || '';
  const trimmed = location.replace(/^\/+|\/+$/g, '');
  const base = trimmed.split('/').pop();
  return base ? [base.toLowerCase(), base.toLowerCase().replace(/-/g, ' ')] : [];
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildAliasMap(projects, aliasesFile) {
  const aliasMap = new Map();
  let customAliases = {};
  if (aliasesFile && fs.existsSync(aliasesFile)) {
    customAliases = JSON.parse(fs.readFileSync(aliasesFile, 'utf8'));
  }
  for (const project of projects) {
    const aliases = new Set([
      project.name.toLowerCase(),
      project.id,
      project.name.toLowerCase().replace(/[^a-z0-9]+/g, ' '),
      ...locationAlias(project),
      ...(customAliases[project.id] || [])
    ]);
    for (const alias of aliases) {
      if (alias) aliasMap.set(alias.toLowerCase(), project.id);
    }
  }
  return aliasMap;
}

function linkProject(projects, conversation, aliasesFile) {
  const aliasMap = buildAliasMap(projects, aliasesFile);
  const haystack = `${conversation.title || ''}\n${conversation.summary || ''}\n${(conversation.messages || []).map(message => message.content || '').join('\n')}`.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [alias, projectId] of aliasMap.entries()) {
    if (alias.length < 3) continue;
    const matches = haystack.match(new RegExp(`(^|[^a-z0-9])${escapeRegex(alias)}([^a-z0-9]|$)`, 'g'));
    const score = matches ? matches.length : 0;
    if (score > bestScore) {
      best = projectId;
      bestScore = score;
    }
  }
  return best ? { projectId: best, confidence: Math.min(1, 0.45 + bestScore * 0.15) } : { projectId: null, confidence: 0 };
}

module.exports = { buildAliasMap, linkProject };
