const { execFileSync } = require('child_process');
const { getConfig } = require('../src/config');
const { buildSnapshot, writeSnapshot } = require('../src/lib/buildSnapshot');

const config = getConfig();
const snapshot = buildSnapshot(config);
writeSnapshot(config, snapshot);

const instanceId = process.env.PUBLIC_INSTANCE_ID || 'i-05957ab2aa06f870e';
const repoUrl = process.env.REPO_URL || 'https://github.com/abh3hu/projects-hub.git';
const remoteDir = '/home/ubuntu/workspace/projects-hub';
const snapshotPayload = Buffer.from(JSON.stringify(snapshot, null, 2)).toString('base64');

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
  `python3 - <<'PY'\nimport base64, pathlib\npathlib.Path('data/generated').mkdir(parents=True, exist_ok=True)\npathlib.Path('data/generated/snapshot.json').write_bytes(base64.b64decode('${snapshotPayload}'))\nPY`,
  `sudo -u ubuntu -H bash -lc 'cd ${remoteDir} && HOME=/home/ubuntu pm2 restart projects-hub || (HOME=/home/ubuntu pm2 start server.js --name projects-hub && HOME=/home/ubuntu pm2 save)'`,
  'sleep 5',
  'curl -fsS http://localhost:3851/health'
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
