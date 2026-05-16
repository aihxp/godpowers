# Godpowers 1.6.21 Release

Date: 2026-05-16

Godpowers 1.6.21 sharpens the daily operating loop after the automation
surface closeout. It adds dashboard action briefs, requires agent-spawning
routes to declare trace events, and expands release readiness checks across
dogfood, extension publish, Mode D suite, and installer smoke gates.

## What is stable

- 109 slash commands
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
- Agent-spawn trace event guardrails
- Mode D suite readiness checks

## What is new

- Added `Action brief` output to `lib/dashboard.js` and CLI status rendering.
- Added route-quality enforcement for `agent.start` and `agent.end` trace
  event declarations on agent-spawning routes.
- Added repo-surface Mode D suite readiness checks for suite helper presence,
  suite command skill and routing coverage, roadmap documentation, and release
  test wiring.
- Added release-surface checks for dogfood, extension publish, Mode D suite,
  and installer smoke tests.
- Updated `/god-init`, `/god-roadmap-update`, and `/god-sync` route metadata
  to declare `agent.start`.

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

## Validation

Release validation includes:

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

The `v1.6.21` tag should point to the release commit that matches the npm
`godpowers@1.6.21` package.
