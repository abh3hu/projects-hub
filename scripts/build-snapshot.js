const { getConfig } = require('../src/config');
const { buildSnapshot, writeSnapshot } = require('../src/lib/buildSnapshot');

const config = getConfig();
const snapshot = buildSnapshot(config);
writeSnapshot(config, snapshot);

console.log(JSON.stringify({
  generatedAt: snapshot.generatedAt,
  projectCounts: snapshot.summary.projectCounts,
  openLoopCount: snapshot.summary.openLoopCount,
  conversationCount: snapshot.summary.conversationCount
}, null, 2));
