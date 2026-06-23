# Domain Model

## Project
Represents a tracked product or idea from `PROJECTS.md`.
Fields: id, name, section, status, started, description, location, liveUrl, remaining, blockedOn.

## Conversation
Represents a recent Hermes session with title, timestamps, recent messages, inferred summary, linked project, and open-loop list.

## Open Loop
Represents an unresolved task, blocker, or next-step statement inferred from recent messages.
Fields: text, timestamp, role, conversationId, projectId.

## Graph
A lightweight relationship model with:
- project nodes
- conversation nodes
- `about_project` edges
- `continues` edges when a session points at a parent session
