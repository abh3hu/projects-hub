const { execFileSync } = require('child_process');
const { getConfig } = require('../src/config');
const { buildSnapshot, writeSnapshot } = require('../src/lib/buildSnapshot');

const config = getConfig();
const snapshot = buildSnapshot(config);
writeSnapshot(config, snapshot);

const instanceId = process.env.PUBLIC_INSTANCE_ID || 'i-05957ab2aa06f870e';
const repoUrl = process.env.REPO_URL || 'https://github.com/abh3hu/projects-hub.git';
const remoteDir = '/home/ubuntu/workspace/projects-hub';
const bucket = process.env.DEPLOY_BUCKET || 'awrenchbot-artifacts';
const key = process.env.DEPLOY_KEY || 'projects-hub/snapshot.json';
const port = process.env.PORT || '3851';

execFileSync('aws', ['s3', 'cp', config.snapshotFile, `s3://${bucket}/${key}`], { stdio: 'inherit' });
const presignedUrl = execFileSync('aws', ['s3', 'presign', `s3://${bucket}/${key}`, '--expires-in', '3600'], {
  encoding: 'utf8'
}).trim();

const remoteCommand = [
  'set -e',
  'export HOME=/home/ubuntu',
  `if [ ! -d "${remoteDir}/.git" ]; then rm -rf ${remoteDir} && git clone ${repoUrl} ${remoteDir}; fi`,
  `cd ${remoteDir}`,
  'git fetch origin',
  'git checkout main',
  'git pull origin main',
  'npm ci --omit=dev',
  'mkdir -p data/generated',
  `curl -fsSL '${presignedUrl}' -o data/generated/snapshot.json`,
  `pm2 delete projects-hub || true`,
  `PORT=${port} SNAPSHOT_FILE=${remoteDir}/data/generated/snapshot.json pm2 start server.js --name projects-hub`,
  'pm2 save',
  `for i in 1 2 3 4 5 6 7 8 9 10; do curl -fsS http://127.0.0.1:${port}/health && break; sleep 2; done`
].join(' && ');

const commandId = execFileSync('aws', [
  'ssm', 'send-command',
  '--instance-ids', instanceId,
  '--document-name', 'AWS-RunShellScript',
  '--parameters', JSON.stringify({ commands: [remoteCommand] }),
  '--query', 'Command.CommandId',
  '--output', 'text'
], { encoding: 'utf8' }).trim();

console.log(commandId);
