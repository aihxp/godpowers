# Godpowers 1.6.15 Release

Date: 2026-05-16

Godpowers 1.6.15 adds automatic migration from GSD, BMAD, and Superpowers
projects into Godpowers. The release also adds managed sync-back so a team can
return to its prior planning system with current Godpowers progress visible.

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
- GSD-style proposition closeouts for exploratory, diagnostic, audit,
  lifecycle, status, reconciliation, and decision-support outputs
- Plain-language project-run wording in user-facing reports

## What is new

- Added `lib/planning-systems.js` for GSD, BMAD, and Superpowers detection.
- Added `lib/source-sync.js` for managed sync-back companion files.
- Added `/god-migrate` as the explicit migration command.
- `/god-init` now auto-invokes planning-system import when source systems are
  detected.
- `/god-sync` now auto-invokes source-system sync-back when enabled source
  systems are recorded in `state.json`.
- `reverse-sync` now returns source-system sync-back results.
- `state.v1.json` now records source-system import and sync-back state.
- Added `docs/planning-system-migration.md`.

## Migration behavior

Godpowers detects:

- GSD: `.planning/`, `.gsd/`, `GSD.md`, and `gsd*.md`
- BMAD: `_bmad/`, `_bmad-output/`, `.bmad-core/`, `.bmad/`, and `BMAD.md`
- Superpowers: `docs/superpowers/`, `.superpowers/`, `SUPERPOWERS.md`, and
  project-local skills

Imported context is written to `.godpowers/prep/IMPORTED-CONTEXT.md`.
Missing Godpowers seed artifacts are created only when source evidence exists.
Existing Godpowers artifacts are preserved unless the user explicitly forces an
overwrite.

## Sync-back behavior

Godpowers writes managed companion files:

- GSD: `.planning/GODPOWERS-SYNC.md` or `.gsd/GODPOWERS-SYNC.md`
- BMAD: `_bmad-output/GODPOWERS-SYNC.md` or `.bmad/GODPOWERS-SYNC.md`
- Superpowers: `docs/superpowers/GODPOWERS-SYNC.md` or
  `.superpowers/GODPOWERS-SYNC.md`

Pointer fences are written only when a safe native state file already exists.
Godpowers never rewrites source-system prose outside managed fences.

## Auto-invoke and auto-spawn policy

The import path is local runtime work and must be reported as:

```
Agent: none, local runtime only
```

The sync-back path is also local runtime work and must be reported the same
way.

Godpowers spawns `god-greenfieldifier` only when import confidence is low,
multiple source systems conflict, or canonical seed artifacts cannot be safely
created from available evidence.

## Validation

Release validation includes:

- `node scripts/test-planning-systems.js`
- `node scripts/test-reverse-sync.js`
- `npm test`
- `npm run test:audit`
- `node scripts/check-package-contents.js`
- `git diff --check`

The `v1.6.15` git tag points to the release commit that matches the npm
`godpowers@1.6.15` package.
