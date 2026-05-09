# Godpowers Implementation Roadmap

> Status: PROPOSED
> Model: Pure-skill (like GSD). CLI is install-only.
> Last updated: 2026-05-09

This is the v0.4 -> v1.0 path. Each release is independently shippable.
Everything new is delivered as slash commands.

---

## v0.3.0 (current) - Skeleton

What works today:
- 26 slash commands as thin orchestrators
- 18 specialist agents in fresh contexts
- 115 named have-nots
- 6 templates
- 15 runtime installer (`npx godpowers --claude --global`)
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
- No skill pack ecosystem
- Not on npm
- Tests are structural only

---

## v0.4.0 - Foundation: Three Load-Bearing Artifacts

**Theme**: introduce intent + state + history without breaking v0.3 slash
commands.

### Deliverables
- `schema/intent.v1.yaml.json` (JSON Schema)
- `schema/state.v1.json`
- `schema/events.v1.json` (OTel-shape vocabulary)
- Schemas live at `references/schema/` so agents can reference them
- god-orchestrator updated to write `state.json` alongside `PROGRESS.md`
- Each agent updated to append events to `events.jsonl`
- New slash commands: `/god-doctor`, `/god-help` (already proposed),
  `/god-version`
- One-shot CLI: `npx godpowers --migrate` (v0.3 -> v0.4 upgrade)
- `/god-status` upgraded to read `state.json` (with PROGRESS.md fallback)
- Smoke tests: schema validation in CI

### Backward compat
- v0.3 `.godpowers/PROGRESS.md` still works
- New files generated alongside, not replacing

### Acceptance
- New project after `/god-init`: writes valid intent.yaml + state.json + events
- v0.3 project: `npx godpowers --migrate` produces equivalent v0.4 state
- All 26 v0.3 slash commands still work
- 288 v0.3 tests pass + new schema tests

---

## v0.5.0 - Workflow Runtime

**Theme**: workflows are declarative, runnable, testable, with plan-then-apply.

### Deliverables
- `schema/workflow.v1.json`
- Workflow YAML files at `workflows/` (full-arc.yaml, audit-only.yaml,
  build-only.yaml)
- god-orchestrator becomes thin wrapper: parses workflow YAML, executes DAG
- Buildkite-style dynamic upload (planner agents emit jobs)
- `--plan` flag on `/god-mode` and tier commands
  - `/god-mode --plan` shows what would happen, asks for confirm
  - `/god-prd --plan` shows the agent's plan before running
- Plan output written to `.godpowers/runs/<id>/plan.yaml`

### Migration of internals
- Existing prose orchestration logic moves to `workflows/full-arc.yaml`
- Five workflow primitives officially supported (chaining, routing,
  parallelization, orchestrator-workers, evaluator-optimizer)

### Acceptance
- `/god-mode --plan` shows the complete DAG with cost estimates
- `/god-mode` runs equivalent to v0.3 behavior
- Custom workflows authorable in user's repo at `.godpowers/workflows/`

---

## v0.6.0 - Recovery: Forward-Only with Compensation

**Theme**: never lose work, always recoverable, all via slash commands.

### Deliverables
- `.godpowers/log` (operation reflog, JSONL)
- `.godpowers/.trash/` (recoverable deletion)
- New slash commands:
  - `/god-undo` (revert last operation via reflog)
  - `/god-redo <tier>` (re-run tier and downstream)
  - `/god-skip <tier> --reason "..."` (explicit skip with audit)
  - `/god-repair` (fix detected drift)
  - `/god-rollback <tier>` (walk back state + move artifacts to .trash)
  - `/god-restore` (recover from .trash)
- Drift detection: rehash artifacts, compare to state.json hashes
- Auto-trash cleanup after 30 days (configurable)

### Acceptance
- After any failed run, `/god-status` shows recovery options
- `/god-undo` reverses the last operation safely
- `/god-repair` detects and fixes any state/disk drift
- Rollback never destroys data without confirmation

---

## v0.7.0 - Observability

**Theme**: see what happened, performant or not.

### Deliverables
- New slash commands:
  - `/god-logs [<run-id>]` (events.jsonl as readable timeline)
  - `/god-metrics` (per-tier stats: duration, pauses, retries)
  - `/god-trace <tier>` (deep dive on one tier's events)
- OTel-shape events fully populated (trace_id, span_id, parent, attrs)
- Optional OTel exporter: events can pipe to Honeycomb/Datadog/Jaeger
- Cost tracking per run (model tokens used, recorded in events)

### Acceptance
- Every run writes a complete events.jsonl
- `/god-metrics` shows realistic per-tier stats
- OTel export tested against Jaeger

---

## v0.8.0 - Skill Pack Ecosystem

**Theme**: third-party extensions with strict contracts.

### Deliverables
- `schema/extension-manifest.v1.json`
- New slash commands:
  - `/god-extension-add @x/y` (install pack from npm)
  - `/god-extension-list`
  - `/god-extension-info @x/y`
  - `/god-extension-remove @x/y`
- Lazy activation: pack files don't load until their skill is invoked
- Capability handshake: install fails on godpowers version mismatch
- `/god-test-extension <path>` (Nx-style contract tests)
- First-party packs:
  - `@godpowers/security-pack` (SOC2, HIPAA, PCI auditors)
  - `@godpowers/launch-pack` (Show HN, Product Hunt, Indie strategists)

### Acceptance
- Pack can declare new agents, skills, workflows, have-nots
- Lazy activation works
- Capability handshake enforced at install
- Pack authors can run contract tests before publishing

---

## v0.9.0 - Distribution

**Theme**: shippable to real users on npm.

### Deliverables
- `npm publish godpowers` (the installer + core)
- `npm publish @godpowers/core-agents`, `@godpowers/core-workflows`,
  `@godpowers/core-templates`
- Conventional commits + semantic-release on main
- GitHub Release automation with auto-changelog
- npm install verification: `npm test --integration`
- Telemetry: opt-in, off-by-default

### Acceptance
- `npx godpowers --claude --global` works for any user via npm
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
- npm publish marker tags

### Acceptance
- Migration from any v0.x project to v1.0 is one command
- Schemas have stability guarantees: no breaking changes within v1.x
- Pack authors have stable APIs to build against
- Integration tests cover full-arc + audit-only + build-only against
  fixtures with mocked LLM responses

---

## Post-1.0

| Idea | Status |
|------|--------|
| Mode D: multi-repo orchestration | RFC needed; design first |
| Subprocess plugins (any language) | RFC-0008 |
| Workflow visualization (DAG renderer) | Slash command renders ASCII |
| LLM cost optimization (model routing) | Research |
| Cross-organization pack marketplace | Post-1.0 |
| Native binary distribution (not just npm) | If demand exists |

---

## CLI Surface (Unchanged Throughout)

The CLI stays minimal. Throughout v0.4 -> v1.0, only these CLI commands exist:

```bash
npx godpowers                    # Interactive install (defaults to claude --global)
npx godpowers --claude --global  # Install for specific runtime
npx godpowers --all              # Install for all 15 runtimes
npx godpowers --uninstall        # Remove
npx godpowers --migrate          # One-shot v0.3 -> v0.4 upgrade
npx godpowers --help             # Show install help
```

All other operations are slash commands inside the AI tool. Same model as
GSD throughout the entire roadmap.

---

## Sequencing Rationale

Why this order:

1. **v0.4 (Foundation)** before everything: structures need to exist before
   tools can read/write them
2. **v0.5 (Workflow)** before recovery: undo means undoing workflow runs
3. **v0.6 (Recovery)** before observability: can't observe what you can't
   recover from
4. **v0.7 (Observability)** before extensions: third parties need a stable
   event API
5. **v0.8 (Extensions)** before distribution: ecosystem matters for npm publish
6. **v0.9 (Distribution)** before 1.0: real users find real bugs
7. **v1.0 (Stable)**: freeze after burning in v0.4-v0.9

Total estimated effort: 8-12 weeks of focused work for a single experienced
developer.

---

## What Each Release Does NOT Do

To stay focused:

| Version | Explicit non-goals |
|---------|-------------------|
| v0.4 | No workflow YAML yet (still implicit in orchestrator prose) |
| v0.5 | No extensions yet (workflows are first-party only) |
| v0.6 | No observability tooling yet (logs exist; tools come in v0.7) |
| v0.7 | No extension contract changes (events.jsonl format frozen at v0.4) |
| v0.8 | No npm publish yet (local install only) |
| v0.9 | No new features (release engineering only) |
| v1.0 | No new features (stabilization only) |
| All | NO `godpowers` CLI binary beyond install. Slash commands only. |

Discipline: a release that does too much is a release that ships late.
