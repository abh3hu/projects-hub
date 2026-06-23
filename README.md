# Projects Hub

Projects Hub is Allen's dashboard for tracking open projects, unresolved loops, recent conversations, and the links between them.

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

You can override paths with environment variables from `.env.example`.

## Deployment
```bash
node scripts/deploy-ssm.js
```

This script:
1. builds a fresh private snapshot locally,
2. writes the snapshot into `data/generated/snapshot.json`,
3. updates the code on the public EC2 instance,
4. restarts PM2,
5. verifies the local health endpoint on the server.

## Privacy Model
- Real dashboard data is **not committed** to git.
- The public repo contains code, tests, and fixture data only.
- Deployments push a fresh snapshot from the local trusted machine to the public instance.
