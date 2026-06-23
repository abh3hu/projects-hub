async function loadDashboard() {
  const response = await fetch('/api/dashboard');
  if (!response.ok) throw new Error('Failed to load dashboard');
  return response.json();
}

function byId(id) {
  return document.getElementById(id);
}

function formatDate(input) {
  if (!input) return 'Unknown';
  const date = new Date(typeof input === 'number' ? input * 1000 : input);
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(date);
}

function summaryCards(summary) {
  const cards = [
    ['Active projects', summary.projectCounts.active],
    ['Backlog ideas', summary.projectCounts.backlog],
    ['Open loops', summary.openLoopCount],
    ['Recent conversations', summary.conversationCount]
  ];
  byId('summaryCards').innerHTML = cards.map(([label, value]) => `
    <article class="card">
      <div class="card-value">${value}</div>
      <div class="card-label">${label}</div>
    </article>
  `).join('');
}

function renderWeeklyRecaps(recaps) {
  byId('weeklyRecaps').innerHTML = recaps.length ? `<div class="recap-grid">${recaps.map(recap => `
    <article class="item">
      <div class="meta"><span class="badge">${recap.weekLabel}</span><span>${recap.conversationCount} conversations</span></div>
      <h3>${recap.projectsTouched.length ? recap.projectsTouched.join(', ') : 'General system work'}</h3>
      <div class="recap-meta">
        <span>${recap.done.length} done</span>
        <span>${recap.next.length} next</span>
      </div>
      <div class="recap-columns">
        <div class="recap-column">
          <h3>Done</h3>
          ${recap.done.length ? `<ul class="list">${recap.done.map(item => `<li>${item.text}</li>`).join('')}</ul>` : '<p class="muted">No completions captured.</p>'}
        </div>
        <div class="recap-column">
          <h3>Next</h3>
          ${recap.next.length ? `<ul class="list">${recap.next.map(item => `<li>${item.text}</li>`).join('')}</ul>` : '<p class="muted">No next steps captured.</p>'}
        </div>
      </div>
    </article>
  `).join('')}</div>` : '<article class="item"><p>No weekly recaps available yet.</p></article>';
}

function renderProjects(projects) {
  byId('activeProjects').innerHTML = projects.active.map(project => `
    <article class="item">
      <div class="meta"><span class="badge">${project.status || 'Active'}</span><span>${project.started || 'Unknown start'}</span></div>
      <h3>${project.name}</h3>
      <p>${project.description || 'No description yet.'}</p>
      <div class="meta"><span>${project.location || 'No location'}</span>${project.liveUrl ? `<a href="${project.liveUrl}" target="_blank" rel="noreferrer">Live ↗</a>` : ''}</div>
      ${project.remaining.length ? `<ul class="list">${project.remaining.map(item => `<li>${item.text}</li>`).join('')}</ul>` : '<p class="muted">No recorded remaining steps.</p>'}
      ${project.blockedOn ? `<p><strong>Blocked on:</strong> ${project.blockedOn}</p>` : ''}
    </article>
  `).join('');

  byId('backlogProjects').innerHTML = projects.backlog.map(project => `
    <article class="item"><h4>${project.name}</h4><p class="muted">${project.description || 'Idea backlog item'}</p></article>
  `).join('');

  byId('completedProjects').innerHTML = projects.completed.slice(0, 8).map(project => `
    <article class="item"><h4>${project.name}</h4><p class="muted">${project.liveUrl || project.location || 'Completed'}</p></article>
  `).join('');
}

function renderLoops(loops) {
  byId('openLoops').innerHTML = loops.length ? loops.map(loop => `
    <article class="item">
      <div class="meta"><span class="badge">${loop.projectName || 'Unassigned'}</span><span>${formatDate(loop.timestamp)}</span></div>
      <h3>${loop.text}</h3>
      <p class="muted">${loop.conversationTitle}</p>
    </article>
  `).join('') : '<article class="item"><p>No open loops found.</p></article>';
}

function renderConversations(conversations) {
  byId('conversations').innerHTML = conversations.map(conversation => `
    <article class="item">
      <div class="meta"><span class="badge">${conversation.projectId || 'No project link yet'}</span><span>${conversation.source}</span><span>${formatDate(conversation.lastMessageAt)}</span></div>
      <h3>${conversation.title}</h3>
      <p>${conversation.summary || 'No recent summary available.'}</p>
      ${conversation.loops.length ? `<ul class="list">${conversation.loops.map(loop => `<li>${loop.text}</li>`).join('')}</ul>` : '<p class="muted">No inferred loops from recent messages.</p>'}
    </article>
  `).join('');
}

function renderGraph(graph) {
  const projectNodes = graph.nodes.filter(node => node.type === 'project');
  const conversationNodes = graph.nodes.filter(node => node.type === 'conversation');
  const width = 900;
  const height = 540;
  const projectX = 180;
  const conversationX = 720;
  const projectGap = height / Math.max(projectNodes.length + 1, 2);
  const conversationGap = height / Math.max(conversationNodes.length + 1, 2);
  const positions = new Map();

  projectNodes.forEach((node, index) => positions.set(node.id, { x: projectX, y: projectGap * (index + 1) }));
  conversationNodes.forEach((node, index) => positions.set(node.id, { x: conversationX, y: conversationGap * (index + 1) }));

  const lines = graph.edges.map(edge => {
    const source = positions.get(edge.source);
    const target = positions.get(edge.target);
    if (!source || !target) return '';
    return `<line class="graph-line" x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" />`;
  }).join('');

  const circles = graph.nodes.map(node => {
    const pos = positions.get(node.id) || { x: width / 2, y: height / 2 };
    const klass = node.type === 'project' ? 'graph-project' : 'graph-conversation';
    return `
      <circle class="${klass}" cx="${pos.x}" cy="${pos.y}" r="10"></circle>
      <text class="graph-label" x="${pos.x + 16}" y="${pos.y + 4}">${node.label.slice(0, 40)}</text>
    `;
  }).join('');

  byId('graphCanvas').innerHTML = `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Project and conversation graph">${lines}${circles}</svg>`;
}

function activateTabs() {
  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => {
      const view = button.dataset.view;
      document.querySelectorAll('.tab').forEach(item => item.classList.toggle('is-active', item === button));
      document.querySelectorAll('.view').forEach(section => section.classList.toggle('is-active', section.id === `view-${view}`));
    });
  });
}

(async () => {
  activateTabs();
  try {
    const dashboard = await loadDashboard();
    byId('heroMeta').textContent = `Snapshot generated ${formatDate(dashboard.generatedAt)} • ${dashboard.summary.linkedConversationCount} conversations linked to projects`;
    summaryCards(dashboard.summary);
    renderWeeklyRecaps(dashboard.summary.weeklyRecaps || dashboard.weeklyRecaps || []);
    renderProjects(dashboard.projects);
    renderLoops(dashboard.openLoops);
    renderConversations(dashboard.conversations);
    renderGraph(dashboard.graph);
  } catch (error) {
    byId('heroMeta').textContent = error.message;
  }
})();
