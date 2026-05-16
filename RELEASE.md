# Godpowers 1.6.20 Release

Date: 2026-05-16

Godpowers 1.6.20 closes the automation gaps found after repository surface
sync. It adds dedicated route-quality, recipe-coverage, and release-surface
checks so Godpowers detects disconnected route spawns, missing intent recipes,
and stale release-facing documentation before declaring a project or release
current.

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

## What is new

- Added `lib/route-quality-sync.js`.
- Added `lib/recipe-coverage-sync.js`.
- Added `lib/release-surface-sync.js`.
- Added `scripts/test-automation-surface-sync.js`.
- Added release maintenance, context refresh, story work, and automation setup
  recipes.
- `/god-party` now declares concrete parallel specialist personas.
- `/god-story-build` now declares planner, executor, and reviewer handoffs
  without symbolic spawn tokens.
- Feature awareness now records route quality, recipe coverage, and release
  surface sync as known runtime features.
- Package contents checks now require all three new sync helpers.

## Automation surface behavior

For a Godpowers repository, the helper checks:

- every routed specialist spawn resolves to a real agent or built-in runtime
  owner
- every durable-writing route declares standards coverage or an approved
  exemption
- high-frequency work has discoverable intent recipes
- release-facing version surfaces agree with `package.json`
- package content checks require load-bearing runtime helper files
- release checklist policy names the current sync guards

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
- `node scripts/test-context-writer.js`
- `node scripts/test-planning-systems.js`
- `node scripts/test-doc-surface-counts.js`
- `node scripts/validate-skills.js`
- `git diff --check`
- `npm run release:check`

The `v1.6.20` tag should point to the release commit that matches the npm
`godpowers@1.6.20` package.
