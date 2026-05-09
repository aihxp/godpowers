# Godpowers Implementation Roadmap

> Status: PROPOSED
> Last updated: 2026-05-09

This is the v0.4 -> v1.0 path. Each release is independently shippable.

---

## v0.3.0 (current) - Skeleton

What works today:
- 26 slash commands as thin orchestrators
- 18 specialist agents in fresh contexts
- 115 named have-nots
- 6 templates
- 15 runtime installer
- Mode A/B/C
- TDD enforcement, two-stage review
- Critical-finding gate with --yolo carve-out
- 288 structural tests

Limitations (target for v0.4 onwards):
- Markdown-only state
- Implicit workflow definition
- No event log
- No plan/apply
- No reflog/undo
- No plugin system
- No npm publish
- Tests are structural only

---

## v0.4.0 - Foundation: Three Load-Bearing Artifacts

**Theme**: introduce the three pillars without breaking v0.3.

### Deliverables
- `schema/godpowers.v1.yaml.json` (JSON Schema for godpowers.yaml)
- `schema/godpowers.v1.lock.json` (JSON Schema for godpowers.lock)
- `schema/events.v1.json` (event vocabulary)
- `lib/state.js` reads/writes both files
- `lib/events.js` appends to events.jsonl with OTel-shape spans
- `godpowers init` magic command (Fly.io pattern)
- `godpowers status` reads structured state
- `godpowers doctor` validates schemas + suggests fixes
- `godpowers help` and `godpowers help <command>`
- `godpowers migrate` (v0.3 PROGRESS.md -> v0.4 yaml+lock)
- Schema validation in CI

### Backward compat
- v0.3 `.godpowers/PROGRESS.md` still works
- New files generated alongside, not replacing

### Acceptance
- New project: `godpowers init` writes valid yaml + lock + events
- Existing v0.3 project: `godpowers migrate` produces equivalent v0.4 state
- All v0.3 slash commands still work
- 288 v0.3 tests still pass + new schema tests

---

## v0.5.0 - Workflow Runtime

**Theme**: workflows are declarative, runnable, testable.

### Deliverables
- `schema/workflow.v1.json` (JSON Schema)
- `lib/workflow-runtime.js` (parser, DAG builder, executor)
- `workflows/full-arc.yaml` (canonical default)
- `workflows/audit-only.yaml`, `workflows/build-only.yaml`
- Buildkite-style dynamic upload (planner agents emit jobs)
- `godpowers plan <workflow>` (preview without executing)
- `godpowers run <workflow>` (execute)
- `godpowers workflow {list, info, validate}`
- Workflow simulator for tests (mock execution)

### Migration of internals
- `god-orchestrator` becomes a thin wrapper around the workflow runtime
- Existing prose orchestration logic moves to `workflows/full-arc.yaml`
- Five workflow primitives (chaining, routing, parallelization,
  orchestrator-workers, evaluator-optimizer) supported

### Acceptance
- `godpowers plan full-arc` shows the complete DAG with cost estimates
- `godpowers run full-arc` executes equivalent to current `/god-mode`
- Custom workflows authorable in user's repo at `.godpowers/workflows/`

---

## v0.6.0 - Recovery: Forward-Only with Compensation

**Theme**: never lose work. Always recoverable.

### Deliverables
- `.godpowers/log` (operation reflog)
- `.godpowers/.trash/` (recoverable deletion)
- `godpowers log` (show recent operations)
- `godpowers undo` (revert to previous state)
- `godpowers redo <stage>`
- `godpowers skip <stage> --reason "..."`
- `godpowers repair` (fix drift)
- `godpowers restore` (recover from trash)
- `godpowers gc` (clean trash older than 30d)
- Drift detection: rehash artifacts, compare to lock

### Acceptance
- After any failed run, `godpowers log` shows the chain
- `godpowers undo` reverses the last operation safely
- `godpowers repair` detects and fixes any state/disk drift
- Rollback never destroys data without confirmation

---

## v0.7.0 - Observability

**Theme**: see what happened, performant or not.

### Deliverables
- `godpowers logs <run-id>` (OTel-style span tree)
- `godpowers metrics` (per-stage stats)
- `godpowers trace <stage>` (deep dive on one stage)
- `godpowers events --follow` (live stream)
- OTel exporter (Honeycomb, Datadog, Jaeger, OTLP)
- Cost tracking per run (model tokens used)

### Acceptance
- Every run writes a complete events.jsonl
- `godpowers metrics` shows duration, pause count, retry count per stage
- OTel export tested against Jaeger

---

## v0.8.0 - Plugin System

**Theme**: third-party extensions with strict contracts.

### Deliverables
- `schema/plugin-manifest.v1.json`
- `lib/plugin-loader.js` (lazy activation)
- `godpowers plugin {add, list, info, remove, update}`
- `godpowers plugin create <name>` (scaffold extension)
- `godpowers test-plugin <path>` (Nx-style contract tests)
- Plugin marketplace stub (initially: just npm tags)
- First-party plugins:
  - `@godpowers/security-pack` (SOC2, HIPAA harden agents)
  - `@godpowers/launch-pack` (PR/Show HN/Indie launch agents)

### Acceptance
- Plugin can declare new agents, skills, workflows, have-nots
- Lazy activation: plugin code doesn't load until needed
- Capability handshake: plugin install fails on godpowers version mismatch
- Plugin authors can run contract tests before publishing

---

## v0.9.0 - Distribution

**Theme**: shippable to real users on npm.

### Deliverables
- `npm publish godpowers` (core)
- `npm publish @godpowers/core-agents` etc.
- Conventional commits + semantic-release on main
- GitHub Release automation with auto-changelog
- npm install verification: `npm test --integration`
- Telemetry decision: opt-in, off-by-default
- Community marketplace docs

### Acceptance
- `npm install -g godpowers` works for any user
- Versions auto-published from main
- Capability handshake enforced at install

---

## v1.0.0 - Stable

**Theme**: freeze the public API.

### Deliverables
- All v0.x to v1.0 migrations work seamlessly
- All schemas frozen (`v1` is stable)
- Real integration test suite (record/replay layer)
- Documentation site at godpowers.dev
- Composability docs (GSD, Superpowers, BMAD, arc-ready)
- Examples directory with 5+ fixture projects
- 1.0 release notes

### Acceptance
- Migration from any v0.x project to v1.0 is one command
- Schemas have stability guarantees: no breaking changes within v1.x
- Plugin authors have stable APIs to build against
- Integration tests cover full-arc + audit-only + build-only against
  fixtures with mocked LLM responses

---

## Post-1.0

| Idea | Status |
|------|--------|
| Mode D: multi-repo orchestration | RFC needed; design first |
| Subprocess plugins (any language) | RFC-0008 |
| Workflow visualization (DAG renderer) | Nice to have |
| LLM cost optimization (model routing) | Research |
| Cross-organization plugin marketplace | Post-1.0 |
| TS/Python SDK that emits YAML | If users outgrow declarative |
| Native binary distribution (not just npm) | If demand exists |

---

## Sequencing Rationale

Why this order:

1. **v0.4 (Foundation)** before everything: structures need to exist before
   tools can read/write them
2. **v0.5 (Workflow)** before recovery: undo means undoing workflow runs
3. **v0.6 (Recovery)** before observability: can't observe what you can't
   recover from
4. **v0.7 (Observability)** before plugins: third parties need a stable
   event API
5. **v0.8 (Plugins)** before distribution: ecosystem matters for npm publish
6. **v0.9 (Distribution)** before 1.0: real users find real bugs
7. **v1.0 (Stable)**: freeze after burning in v0.4-v0.9

Total estimated effort: 8-12 weeks of focused work for a single experienced
developer, parallelizable across multiple. v0.4 alone is ~2 weeks; v1.0 is
~1 week if v0.9 went well.

---

## What Each Release Does NOT Do

To stay focused:

| Version | Explicit non-goals |
|---------|-------------------|
| v0.4 | No workflow YAML yet (still implicit in orchestrator prose) |
| v0.5 | No plugins yet (workflows are first-party only) |
| v0.6 | No observability tooling yet (logs exist; tools come in v0.7) |
| v0.7 | No plugin contract changes (events.jsonl format frozen at v0.4) |
| v0.8 | No npm publish yet (local install only) |
| v0.9 | No new features (release engineering only) |
| v1.0 | No new features (stabilization only) |

Discipline: a release that does too much is a release that ships late.
