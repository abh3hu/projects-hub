# Architecture Decision

## Decision
Use a **REST API with a generated snapshot** instead of direct live database access from the public server.

## Why REST won
- The dashboard is mostly read-only.
- The shapes are stable and resource-oriented.
- The app has one primary client: its own frontend.
- Debugging and deployment stay simple.
- Future agents can inspect JSON endpoints without learning a query language.

## Storage decision
- Local trusted machine builds a derived snapshot from private data sources.
- The app serves generated JSON and caches the same payload in SQLite.
- The public instance never needs direct access to the private Hermes database.

## Deployment decision
- Use AWS SSM because SSH to the public instance is currently unavailable from this environment.
- Keep PM2 + Cloudflare because that infrastructure already exists and is verified live.
