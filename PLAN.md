# Projects Hub Sprint 1 Plan

## Goal
Ship a live, phone-friendly web dashboard for Allen that tracks:
- open projects
- open loops / unresolved next steps
- active conversation threads
- lightweight relationship graph between threads and projects

The sprint is complete only when a public URL loads on a phone and the app has passing tests plus a verified deployment.

## Three-Step Delivery Loop
We will use this loop for every phase of the project:
1. **Plan** — define the contract, acceptance criteria, and deployment target before coding.
2. **Build** — implement the smallest complete vertical slice that advances the product.
3. **Verify + Ship** — run tests, manually check behavior, deploy, and verify the live URL.

## Sprint 1 Scope
### In scope
- New standalone GitHub repo for the upgraded Projects Hub
- Read-only dashboard backed by local derived data
- Snapshot generator using local Hermes history + `PROJECTS.md`
- Responsive frontend for phone access
- API endpoints for projects, open loops, conversations, graph, health
- Test suite: unit, API, E2E
- Public deployment to existing `projects.awrenchbot.com`
- Documentation: README, REQUIREMENTS, architecture, handoff, changelog
- Deployment automation script for repeatable future pushes

### Out of scope for sprint 1
- Real-time bidirectional editing in the browser
- Full auth wall
- Continuous sync daemon from Mac to public instance
- Rich graph editing or drag-and-drop

## Load-Bearing Decisions
- **Repo name:** `projects-hub`
- **Runtime:** Node.js 22
- **Backend:** Express REST API
- **Frontend:** server-rendered static SPA with vanilla JS/CSS for low deployment complexity
- **Storage:** SQLite for derived state + JSON export snapshots
- **Data sources:** `~/.hermes/state.db`, `~/.hermes/channel_directory.json`, workspace `PROJECTS.md`
- **Deployment target:** existing public EC2 instance `98.88.163.172`
- **Public URL:** existing `https://projects.awrenchbot.com`
- **Process manager:** PM2 with process name `projects-hub`
- **Remote control path:** AWS SSM (verified), not SSH

## Acceptance Criteria
- Homepage loads at `https://projects.awrenchbot.com`
- Dashboard is usable on a phone viewport
- `/health` returns healthy JSON
- `/api/projects`, `/api/loops`, `/api/conversations`, `/api/graph`, `/api/summary` return valid JSON
- At least one active project and one open loop render in the UI
- Unit, API, and E2E tests pass locally
- Deployment to public EC2 completes through a repeatable script
- Repo contains clear setup + maintenance docs

## Definition of Done
The app is live, tested, documented, and reachable from Allen’s phone at `https://projects.awrenchbot.com`.
