# Godpowers 1.6.24 Release

Date: 2026-05-16

Godpowers 1.6.24 turns release readiness automation into a strict,
fail-closed background check. It packages the lesson from the 1.6.23 release:
release readiness cannot be inferred from README, package metadata, and
changelog alone. Every owned repo surface must be checked or the release is
blocked.

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
- Release gate enforcement through `npm run release:check`

## What is new

- Added `strict-release-readiness` to the safe automation templates.
- Added a strict release-surface manifest that covers root docs, docs, agents,
  skills, routing, workflows, schema, templates, references, hooks, lib,
  scripts, tests, fixtures, GitHub workflows, package metadata, npm latest, git
  tag state, GitHub release state, CI status, publish workflow status, and
  local install state.
- Updated `/god-automation-setup` so background release checks use the strict
  template by default.
- Updated the release maintenance recipe so background release setup goes
  through `/god-automation-setup` and keeps publishing behind explicit human
  approval.
- Updated auto-invoke visibility docs so strict release readiness is a Level 2
  read-only local automation candidate.

## Guardrails

- Strict release readiness fails closed when any required surface is unchecked,
  stale, missing, untested, or inconsistent with the intended version.
- Strict release readiness reports blockers and exact next commands only.
- Strict release readiness must not modify files, stage, commit, tag, push,
  create a GitHub release, publish to npm, delete files, clear caches, or
  change runtime installs.
- Behavioral tests verify that the strict template is fail-closed, read-only,
  and names every required release surface.

## Validation

Release validation includes:

- `node scripts/test-automation-providers.js`
- `node scripts/test-automation-surface-sync.js`
- `node scripts/test-recipes.js`
- source scan for forbidden dash characters in edited files
- `npm run release:check`
- `npm pack --json`
- npm cache clear before local install
- local uninstall and reinstall from the generated tarball
- tag-triggered npm publish workflow with provenance
- npm registry verification after publish
- local uninstall and reinstall from `godpowers@1.6.24`
- all-runtime `godpowers --all` refresh after published install

The `v1.6.24` tag should point to the release commit that matches the npm
`godpowers@1.6.24` package.
