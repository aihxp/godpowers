---
pillar: arch
status: active
always_load: false
covers: [architecture, runtime model, state model, workflows, agents]
triggers: [architecture, workflow, state, router, agent, runtime]
must_read_with: [context, repo]
see_also: [quality, deploy]
---

## Scope

- [DECISION] This pillar captures architectural context for Godpowers.

## Decisions

- [DECISION] Godpowers uses a pure-skill runtime where slash-command skills spawn specialist agents inside the host AI coding tool.
- [DECISION] The only CLI surface is installer-oriented through `npx godpowers`.
- [DECISION] Routing decisions are stored in `routing/*.yaml`.
- [DECISION] Workflow plans are stored in `workflows/*.yaml` and planned by `lib/workflow-runner.js`.
- [DECISION] `lib/state-lock.js` provides cooperative advisory locking through `.godpowers/state.json`.

## Watchouts

- [HYPOTHESIS] Runtime behavior depends on host AI tools exposing skill and agent capabilities consistently.
