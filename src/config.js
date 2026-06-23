const os = require('os');
const path = require('path');

function getConfig() {
  const home = os.homedir();
  const workspaceRoot = process.env.WORKSPACE_ROOT || path.join(home, '.openclaw', 'workspace');
  const hermesHome = process.env.HERMES_HOME || path.join(home, '.hermes');
  return {
    port: Number(process.env.PORT || 3851),
    workspaceRoot,
    hermesHome,
    projectsFile: process.env.PROJECTS_FILE || path.join(workspaceRoot, 'PROJECTS.md'),
    channelDirectoryFile: process.env.CHANNEL_DIRECTORY_FILE || path.join(hermesHome, 'channel_directory.json'),
    snapshotFile: process.env.SNAPSHOT_FILE || path.join(__dirname, '..', 'data', 'generated', 'snapshot.json'),
    derivedDbFile: process.env.DERIVED_DB_FILE || path.join(__dirname, '..', 'data', 'generated', 'projects-hub.db'),
    stateDbFile: process.env.STATE_DB_FILE || path.join(hermesHome, 'state.db'),
    aliasesFile: process.env.ALIASES_FILE || path.join(__dirname, '..', 'config', 'project-aliases.json'),
    conversationLimit: Number(process.env.CONVERSATION_LIMIT || 20),
    weeklyConversationLimit: Number(process.env.WEEKLY_CONVERSATION_LIMIT || 120),
    weeklyRecapWeeks: Number(process.env.WEEKLY_RECAP_WEEKS || 4)
  };
}

module.exports = { getConfig };
