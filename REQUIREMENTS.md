# Projects Hub Requirements

## Overview
Projects Hub is a web dashboard that helps Allen track open projects, unresolved open loops, and recent conversation context from Hermes.

## Functional Requirements
- **FR-1.1** The dashboard must list active, backlog, and completed projects from `PROJECTS.md`.
- **FR-1.2** The dashboard must surface unresolved open loops inferred from recent Hermes conversations.
- **FR-1.3** The dashboard must show recent conversations with summaries and linked projects.
- **FR-1.4** The dashboard must render a relationship graph between projects and conversations.
- **FR-1.5** The backend must provide read-only JSON APIs for dashboard, summary, projects, loops, conversations, and graph data.
- **FR-1.6** The application must expose `/health` for deployment verification.
- **FR-1.7** The dashboard must be usable on a phone viewport.
- **FR-1.8** A repeatable deployment script must update the public EC2 instance without SSH.

## Technical Requirements
- **Runtime:** Node.js 22+
- **Backend:** Express
- **Storage:** derived JSON snapshot and SQLite cache
- **Port:** 3851
- **Domain:** https://projects.awrenchbot.com
- **Deployment:** AWS SSM + PM2 + Cloudflare tunnel

## Security Requirements
- **SEC-1** No secrets may be committed to git.
- **SEC-2** The repo must only include fixture data, not private production snapshots.
- **SEC-3** The public service must be read-only.

## Testing Requirements
- **TEST-1** Unit tests must cover project parsing, loop inference, and project linking.
- **TEST-2** API tests must cover `/health`, `/api/dashboard`, and `/api/projects`.
- **TEST-3** E2E tests must confirm the homepage renders key dashboard content.

## Success Criteria
- Public URL loads successfully.
- Tests pass locally.
- Deployment is repeatable.
- Documentation is sufficient for future agent handoff.
