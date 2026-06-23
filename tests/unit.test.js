const test = require('node:test');
const assert = require('node:assert/strict');
const { parseProjectsMarkdown } = require('../src/lib/parseProjects');
const { extractOpenLoops } = require('../src/lib/openLoops');
const { linkProject } = require('../src/lib/linkProjects');
const { generateWeeklyRecaps } = require('../src/lib/weeklyRecaps');

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

test('generateWeeklyRecaps groups work into weekly done and next lists', () => {
  const recaps = generateWeeklyRecaps({
    projects: [
      { id: 'projects-hub', name: 'Projects Hub', remaining: [{ text: 'Ship mobile dashboard', done: false }] }
    ],
    conversations: [
      {
        id: 'conv-2',
        title: 'Projects Hub ship week',
        startedAt: '2026-06-17T14:00:00.000Z',
        lastMessageAt: '2026-06-17T15:00:00.000Z',
        projectId: 'projects-hub',
        projectName: 'Projects Hub',
        messages: [
          { role: 'assistant', content: 'I deployed the dashboard and fixed the mobile layout.', timestamp: '2026-06-17T14:10:00.000Z' },
          { role: 'user', content: 'Next step: add weekly recaps and keep track of what needs to be done next.', timestamp: '2026-06-17T14:20:00.000Z' }
        ]
      },
      {
        id: 'conv-1',
        title: 'Projects Hub planning',
        startedAt: '2026-06-10T14:00:00.000Z',
        lastMessageAt: '2026-06-10T15:00:00.000Z',
        projectId: 'projects-hub',
        projectName: 'Projects Hub',
        messages: [
          { role: 'assistant', content: 'I built the dashboard and created the deploy workflow.', timestamp: '2026-06-10T14:10:00.000Z' },
          { role: 'user', content: 'Tell me if there are any implementations that could be added into the system.', timestamp: '2026-06-10T14:12:00.000Z' },
          { role: 'user', content: 'We need to connect project summaries next.', timestamp: '2026-06-10T14:20:00.000Z' }
        ]
      }
    ],
    maxWeeks: 4
  });

  assert.equal(recaps.length, 2);
  assert.match(recaps[0].weekLabel, /Jun 16|Jun 17|Jun 15/i);
  assert.equal(recaps[0].projectsTouched[0], 'Projects Hub');
  assert.ok(recaps[0].done.some(item => /deployed the dashboard/i.test(item.text)));
  assert.ok(recaps[0].next.some(item => /weekly recaps/i.test(item.text)));
  assert.ok(recaps[0].next.some(item => /Ship mobile dashboard/i.test(item.text)));
  assert.ok(recaps[1].done.every(item => !/added into the system/i.test(item.text)));
});
