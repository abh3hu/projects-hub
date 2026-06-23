const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProjectsMarkdown } = require('../src/lib/parseProjects');
const { extractOpenLoops } = require('../src/lib/openLoops');
const { linkProject } = require('../src/lib/linkProjects');

const markdown = `# Allen's Projects\n\n## 🔥 Active\n\n### Projects Hub\n**Status:** In Progress | **Started:** 2026-06-22\n**What:** Dashboard for open projects and open loops\n**Location:** /projects-hub/\n**Live URL:** https://projects.awrenchbot.com\n\n**Remaining:**\n- [ ] Ship mobile dashboard\n\n## 💡 Ideas / Backlog\n\n### Graph Polish\n**What:** Improve graph view\n\n## ✅ Completed\n\n### Status Page\n**What:** Existing monitor\n`;

test('parseProjectsMarkdown groups projects by section', () => {
  const sections = parseProjectsMarkdown(markdown);
  assert.equal(sections.active.length, 1);
  assert.equal(sections.backlog.length, 1);
  assert.equal(sections.completed.length, 1);
  assert.equal(sections.active[0].id, 'projects-hub');
});

test('extractOpenLoops finds likely unfinished statements', () => {
  const loops = extractOpenLoops([
    { role: 'user', content: 'We need to ship the mobile dashboard and figure out the next step.', timestamp: 1 },
    { role: 'assistant', content: 'Blocked on deployment.', timestamp: 2 }
  ]);
  assert.equal(loops.length, 1);
  assert.match(loops[0].text, /ship the mobile dashboard/i);
});

test('linkProject matches a conversation to the right project', () => {
  const project = { id: 'projects-hub', name: 'Projects Hub', location: '/projects-hub/' };
  const result = linkProject([project], {
    title: 'Projects Hub planning',
    summary: 'Need to deploy projects hub soon',
    messages: [{ content: 'projects hub needs a mobile design' }]
  });
  assert.equal(result.projectId, 'projects-hub');
});
