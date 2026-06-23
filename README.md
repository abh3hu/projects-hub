# Projects Hub

Projects Hub is Allen's dashboard for tracking open projects, unresolved loops, recent conversations, weekly progress recaps, and the links between them.

## Sprint 1 Deliverable
A live, mobile-friendly dashboard at `https://projects.awrenchbot.com` backed by a locally generated snapshot of:
- workspace `PROJECTS.md`
- Hermes session history in `~/.hermes/state.db`
- Discord channel metadata in `~/.hermes/channel_directory.json`

## Three-Step Workflow
1. **Plan** — define scope, contract, and deploy target first.
2. **Build** — implement the smallest complete vertical slice.
3. **Verify + Ship** — run tests, deploy, verify the live URL.

## Architecture
- **Backend:** Node.js 22 + Express
- **Storage:** derived SQLite + generated JSON snapshot
- **Frontend:** static responsive dashboard with vanilla JS/CSS
- **Deploy:** public EC2 via AWS SSM + PM2 + Cloudflare tunnel

## Local Development
```bash
npm install
npm run build:snapshot
npm run dev
```

Then open <http://localhost:3851>.

## Test Commands
```bash
npm run test:unit
npm run test:api
npm run test:e2e
npm run test
```

## Snapshot Build
```bash
npm run build:snapshot
```

By default this reads:
- `PROJECTS.md` from `~/.openclaw/workspace`
- Hermes session DB from `~/.hermes/state.db`
- channel directory from `~/.hermes/channel_directory.json`

The generated snapshot now also includes `summary.weeklyRecaps`, which groups recent work into week buckets with:
- projects touched
- inferred done items
- inferred next steps / remaining work

You can override paths with environment variables from `.env.example`.

## Deployment
```bash
npm run build:snapshot
aws s3 cp data/generated/snapshot.json s3://awrenchbot-artifacts/projects-hub/snapshot.json
node scripts/deploy-ssm.js
```

This workflow:
1. builds a fresh private snapshot locally,
2. writes the snapshot into `data/generated/snapshot.json`,
3. uploads the snapshot as an artifact to `s3://awrenchbot-artifacts/projects-hub/snapshot.json`,
4. updates the code on the public EC2 instance,
5. fetches the artifact onto the server,
6. restarts PM2 on port `3851`,
7. verifies the local health endpoint on the server.

Why the S3 hop: the snapshot is too large to safely inline inside a single SSM `send-command` payload.

## Privacy Model
- Real dashboard data is **not committed** to git.
- The public repo contains code, tests, and fixture data only.
- Deployments push a fresh snapshot from the local trusted machine to the public instance.
