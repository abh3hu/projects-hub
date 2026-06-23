function buildGraph(projects, conversations) {
  const nodes = [];
  const edges = [];

  for (const project of projects) {
    nodes.push({ id: `project:${project.id}`, label: project.name, type: 'project', section: project.section });
  }

  for (const conversation of conversations) {
    nodes.push({ id: `conversation:${conversation.id}`, label: conversation.title, type: 'conversation' });
    if (conversation.projectId) {
      edges.push({
        id: `edge:${conversation.id}:${conversation.projectId}`,
        source: `conversation:${conversation.id}`,
        target: `project:${conversation.projectId}`,
        type: 'about_project'
      });
    }
    if (conversation.parentSessionId) {
      edges.push({
        id: `parent:${conversation.id}`,
        source: `conversation:${conversation.id}`,
        target: `conversation:${conversation.parentSessionId}`,
        type: 'continues'
      });
    }
  }

  return { nodes, edges };
}

module.exports = { buildGraph };
