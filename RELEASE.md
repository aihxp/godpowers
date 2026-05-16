# Godpowers 1.6.19 Release

Date: 2026-05-16

Godpowers 1.6.19 adds repository surface sync and clarifies status truth across
`/god-status`, `/god-next`, God Mode closeouts, and installer CLI status
helpers. Godpowers can now detect structural drift across routes, package
payload rules, agent handoffs, workflow metadata, recipe routes, extension
packs, and release policy before declaring a project run current.

## What is stable

- 109 slash commands
- 40 specialist agents
- 13 executable workflows
- 36 intent recipes
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

## What is new

- Added `lib/repo-surface-sync.js`.
- Added `docs/repo-surface-sync.md`.
- Added `scripts/test-repo-surface-sync.js`.
- `/god-sync`, `/god-docs`, `/god-doctor`, `/god-status`, and `/god-mode` now
  document repo surface sync integration.
- Dashboard proactive checks now include a repo surface status line.
- Package contents checks now require `lib/repo-surface-sync.js`.
- Feature awareness now records `repo-surface-sync` as a known runtime feature.
- Dashboard output keeps workflow progress distinct from audit, hygiene,
  remediation, and launch-readiness scores.

## Surface sync behavior

For a Godpowers repository, the helper checks:

- every `skills/god-*.md` command has matching `routing/god-*.yaml` metadata
- required package payload entries exist in `package.json`
- package content checks require load-bearing runtime helper files
- routed specialist spawns resolve to real agent files
- workflows have parseable metadata
- recipes contain slash-command routes
- extension manifests, package metadata, peer dependencies, and provided files agree
- release docs and release policy checks name repo documentation and repo surface sync

Detection is read-only by default. Applying sync only writes a log and may
create missing routing stubs when `fixRouting` is explicitly enabled.

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
- `node scripts/test-repo-doc-sync.js`
- `node scripts/test-feature-awareness.js`
- `node scripts/test-dashboard.js`
- `node scripts/test-context-writer.js`
- `node scripts/test-planning-systems.js`
- `node scripts/test-doc-surface-counts.js`
- `node scripts/validate-skills.js`
- `git diff --check`
- `npm run release:check`

The `v1.6.19` tag should point to the release commit that matches the npm
`godpowers@1.6.19` package.
