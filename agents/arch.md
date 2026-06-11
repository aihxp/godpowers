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
- [DECISION] The CLI surface stays narrow: installer and uninstall flows, read-only status and next-route helpers, automation status and setup planning, dogfood fixtures, and extension scaffolding.
- [DECISION] Routing decisions are stored in `routing/*.yaml`.
- [DECISION] Workflow plans are stored in `workflows/*.yaml` and planned by `lib/workflow-runner.js`.
- [DECISION] Workflow plans can expose visible local helpers such as `repo-doc-sync`, `repo-surface-sync`, `host-capabilities`, `source-sync-back`, and `checkpoint-sync`.
- [DECISION] `lib/state-lock.js` provides cooperative advisory locking through `.godpowers/state.json`.
- [DECISION] Existing `.godpowers` projects refresh runtime feature awareness through `lib/feature-awareness.js`.
- [DECISION] `ARCHITECTURE.md` owns the architecture audit playbook for disconnected commands, actions, and workflows.
- [DECISION] `ARCHITECTURE-MAP.md` renders the same audit as a graph from skills to routes, agents, workflows, recipes, docs, and package checks.
- [DECISION] `ARCHITECTURE-MAP.md` keeps a complete core command supplement so all 120 shipped skills appear in the human-readable map.
- [DECISION] Workflow plans use canonical helper IDs such as `source-sync-back` and `pillars-sync-plan`, while `/god-sync` output may show the shorter aliases `source-sync` and `pillars-sync`.
- [DECISION] The current executable audit status is fresh for repo surface, route quality, recipe coverage, and workflow planning.

## Watchouts

- [HYPOTHESIS] Runtime behavior depends on host AI tools exposing skill and agent capabilities consistently.
- [HYPOTHESIS] Local helper work must stay visible in closeouts so automatic work does not become hidden orchestration.
