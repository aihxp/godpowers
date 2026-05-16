# Godpowers 1.6.22 Release

Date: 2026-05-16

Godpowers 1.6.22 turns the remaining "needs more real use" risks into
executable surfaces. It adds deterministic messy-repo dogfooding, dashboard
host guarantees, compact status output, extension authoring scaffolds, and
Mode D suite release dry-run planning.

## What is stable

- 110 slash commands
- 40 specialist agents
- 13 executable workflows
- 40 intent recipes
- 15-runtime installer
- Codex installs with generated `god-*.toml` agent metadata files
- Markdown specialist agent contracts at `<runtime>/agents/god-*.md`
- Shared runtime bundle at `<runtime>/godpowers-runtime`
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Safe-sync routing before deploy, observe, harden, launch, or god-mode work
- Critical harden finding gate before launch
- Planning-system migration for GSD, BMAD, and Superpowers
- Managed sync-back companion files for imported source systems
- Feature awareness for existing Godpowers projects
- Repository documentation sync checks
- Repository surface sync checks
- Route quality, recipe coverage, and release surface sync checks
- Dashboard action briefs for next-step compression
- Dashboard host guarantees for full, degraded, and unknown runtime capability
- Agent-spawn trace event guardrails
- Mode D suite readiness checks
- Messy-repo dogfood scenarios
- Extension authoring scaffold helper
- Mode D suite release dry-run planner

## What is new

- Added `lib/dogfood-runner.js`, `/god-dogfood`, and CLI `dogfood`.
- Added dogfood fixtures for half-migrated GSD import and sync-back, full and
  degraded host guarantees, extension scaffold validation, and suite release
  dry-run planning.
- Added `lib/host-capabilities.js` and dashboard host guarantee reporting.
- Added compact dashboard output through `--brief`.
- Added `lib/extension-authoring.js` and CLI `extension-scaffold`.
- Added `suiteState.planRelease` for Mode D dependent impact planning before
  mutation.

## Automation surface behavior

For a Godpowers repository, the helper checks:

- every routed specialist spawn resolves to a real agent or built-in runtime
  owner
- every agent-spawning route declares `agent.start` and `agent.end`
- every durable-writing route declares standards coverage or an approved
  exemption
- high-frequency work has discoverable intent recipes
- release-facing version surfaces agree with `package.json`
- package content checks require load-bearing runtime helper files
- release checklist policy names the current sync guards
- release gates include dogfood, extension publish, Mode D suite, and installer
  smoke checks
- dogfood fixtures cover migration, host guarantees, extension authoring, and
  suite release dry-runs
- host guarantees are visible in dashboard and compact dashboard output

Detection is read-only by default. Applying sync writes logs and leaves
judgment-heavy rewrites to scoped specialists.

## Auto-invoke and auto-spawn policy

Safe repo surface sync is local runtime work and must be reported as:

```text
Agent: none, local runtime only
```

Godpowers recommends scoped specialists only when judgment is needed:

- `god-auditor` for agent contract or handoff drift
- `god-roadmap-reconciler` for workflow or recipe lifecycle drift
- `god-coordinator` for extension pack drift
- `god-docs-writer` for release prose drift
- `god-greenfieldifier` for dogfood migration failures
- `god-context-writer` for host capability failures

## Validation

Release validation includes:

- `node scripts/test-dogfood-runner.js`
- `node scripts/test-host-capabilities.js`
- `node scripts/test-extension-authoring.js`
- `node scripts/test-repo-surface-sync.js`
- `node scripts/test-automation-surface-sync.js`
- `node scripts/test-repo-doc-sync.js`
- `node scripts/test-feature-awareness.js`
- `node scripts/test-dashboard.js`
- `node scripts/test-mode-d.js`
- `node scripts/test-extensions-publish.js`
- `node scripts/test-install-smoke.js`
- `node scripts/test-context-writer.js`
- `node scripts/test-planning-systems.js`
- `node scripts/test-doc-surface-counts.js`
- `node scripts/validate-skills.js`
- `git diff --check`
- `npm run release:check`

The `v1.6.22` tag should point to the release commit that matches the npm
`godpowers@1.6.22` package.
