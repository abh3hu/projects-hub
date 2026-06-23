const fs = require('fs');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseChecklistLine(line) {
  const match = line.match(/^- \[( |x)\]\s+(.+)$/i);
  if (!match) return null;
  return { text: match[2].trim(), done: match[1].toLowerCase() === 'x' };
}

function parseProjectsMarkdown(markdown) {
  const sections = { active: [], backlog: [], completed: [] };
  let currentSection = null;
  let currentProject = null;
  let inRemaining = false;

  const lines = markdown.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trimEnd();

    if (line.includes('## 🔥 Active')) {
      if (currentProject && currentSection) sections[currentSection].push(currentProject);
      currentSection = 'active';
      currentProject = null;
      inRemaining = false;
      continue;
    }
    if (line.includes('## 💡 Ideas') || line.includes('## 💡 Backlog')) {
      if (currentProject && currentSection) sections[currentSection].push(currentProject);
      currentSection = 'backlog';
      currentProject = null;
      inRemaining = false;
      continue;
    }
    if (line.includes('## ✅ Completed')) {
      if (currentProject && currentSection) sections[currentSection].push(currentProject);
      currentSection = 'completed';
      currentProject = null;
      inRemaining = false;
      continue;
    }
    if (line.includes('## 📋 Quick Add')) {
      if (currentProject && currentSection) sections[currentSection].push(currentProject);
      currentProject = null;
      currentSection = null;
      inRemaining = false;
      continue;
    }

    if (!currentSection) continue;

    if (line.startsWith('### ')) {
      if (currentProject) sections[currentSection].push(currentProject);
      const name = line.slice(4).trim();
      currentProject = {
        id: slugify(name),
        name,
        section: currentSection,
        status: '',
        started: '',
        description: '',
        location: '',
        liveUrl: '',
        schedule: '',
        blockedOn: '',
        remaining: []
      };
      inRemaining = false;
      continue;
    }

    if (!currentProject) continue;

    if (line.startsWith('**Status:**')) currentProject.status = line.replace('**Status:**', '').split('|')[0].trim();
    const startedMatch = line.match(/\*\*Started:\*\*\s*(\d{4}-\d{2}(?:-\d{2})?)/);
    if (startedMatch) currentProject.started = startedMatch[1];
    if (line.startsWith('**What:**')) currentProject.description = line.replace('**What:**', '').trim();
    if (line.startsWith('**Idea:**')) currentProject.description = line.replace('**Idea:**', '').trim();
    if (line.startsWith('**Location:**')) currentProject.location = line.replace('**Location:**', '').trim().replace(/`/g, '');
    if (line.startsWith('**Live URL:**')) currentProject.liveUrl = line.replace('**Live URL:**', '').trim();
    if (line.startsWith('**Schedule:**')) currentProject.schedule = line.replace('**Schedule:**', '').trim();
    if (line.startsWith('**Blocked on:**')) {
      currentProject.blockedOn = line.replace('**Blocked on:**', '').trim();
      inRemaining = false;
    }
    if (line.startsWith('**Remaining:**')) {
      inRemaining = true;
      continue;
    }
    if (inRemaining) {
      const item = parseChecklistLine(line.trim());
      if (item) currentProject.remaining.push(item);
      if (!line.startsWith('- [')) inRemaining = false;
    }
  }

  if (currentProject && currentSection) sections[currentSection].push(currentProject);
  return sections;
}

function loadProjects(projectsFile) {
  const markdown = fs.readFileSync(projectsFile, 'utf8');
  const sections = parseProjectsMarkdown(markdown);
  const all = [...sections.active, ...sections.backlog, ...sections.completed];
  return { sections, all };
}

module.exports = { loadProjects, parseProjectsMarkdown, slugify };
