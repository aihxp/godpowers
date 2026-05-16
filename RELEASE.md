# Godpowers 1.6.16 Release

Date: 2026-05-16

Godpowers 1.6.16 adds feature awareness for existing Godpowers projects. After
the installed runtime gains new capabilities, Godpowers can detect stale project
awareness, record the current feature set in `state.json`, refresh AI-tool
context fences, and route migration judgment to the right command or agent.

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

## What is new

- Added `lib/feature-awareness.js`.
- Added `godpowers-features` to `state.v1.json`.
- Added `scripts/test-feature-awareness.js`.
- `/god-doctor`, `/god-context`, `/god-sync`, and `/god-mode` now document the
  feature-awareness auto-invoke path.
- `AGENTS.md` refreshes now include `/god-sync`, `/god-migrate`, and
  `/god-context refresh` in the useful command list.

## Awareness behavior

For an initialized `.godpowers` project, the helper:

- reads the installed runtime version
- compares the project `godpowers-features` record to the current feature set
- detects missing managed AI-tool context fences
- detects unimported GSD, BMAD, or Superpowers planning artifacts
- writes only safe state metadata and managed context fences when applied

Detection is read-only. Applying awareness does not rewrite product, planning,
source-system, or code files outside Godpowers-owned fences.

## Auto-invoke and auto-spawn policy

Feature awareness is local runtime work and must be reported as:

```
Agent: none, local runtime only
```

Godpowers recommends or spawns `god-greenfieldifier` only when imported or
detected planning-system context has low confidence or conflicts that need
migration judgment.

## Validation

Release validation includes:

- `node scripts/test-feature-awareness.js`
- `node scripts/test-context-writer.js`
- `node scripts/test-planning-systems.js`
- `node scripts/test-doc-surface-counts.js`
- `node scripts/validate-skills.js`
- `git diff --check`

The `v1.6.16` tag should point to the release commit that matches the npm
`godpowers@1.6.16` package.
