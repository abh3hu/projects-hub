# Handoff for Agents

## What this service does
- Shows Allen's tracked projects, open loops, recent conversations, and their relationships.
- Builds a private snapshot from local Hermes/session/project data.
- Serves a mobile-friendly public dashboard from that snapshot.

## Interface
- `GET /health`
- `GET /api/dashboard`
- `GET /api/summary`
- `GET /api/projects`
- `GET /api/loops`
- `GET /api/conversations`
- `GET /api/graph`

## Run
- install: `npm install`
- build snapshot: `npm run build:snapshot`
- start: `npm run dev` or `npm start`
- test: `npm test`
- deploy: `node scripts/deploy-ssm.js`

## Key files
- `src/lib/buildSnapshot.js`: main snapshot orchestrator
- `src/lib/parseProjects.js`: `PROJECTS.md` parser
- `src/lib/hermesSessions.js`: Hermes DB reader
- `src/lib/openLoops.js`: loop inference heuristics
- `public/`: phone-facing dashboard UI
- `scripts/deploy-ssm.js`: public EC2 deploy path

## Known constraints
- Open-loop inference is heuristic, not semantic truth.
- Production data is injected during deploy and intentionally not committed.
- Public deployment depends on AWS SSM access and the existing PM2 process name `projects-hub`.

## Next likely tasks
- Add manual pin/unpin controls for conversations.
- Add richer graph filtering.
- Add automated recurring snapshot sync.
- Add auth if the dashboard should become private.
