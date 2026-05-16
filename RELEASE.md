# Godpowers 1.6.17 Release

Date: 2026-05-16

Godpowers 1.6.17 adds autonomous repository documentation sync for release
surfaces and project-run closeout. Godpowers can now detect stale README badges,
public surface counts, release notes, changelog entries, contribution guidance,
security policy, and Pillars context planning needs before a sync, docs, doctor,
status, or god-mode closeout declares the repository current.

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

## What is new

- Added `lib/repo-doc-sync.js`.
- Added `docs/repo-doc-sync.md`.
- Added `scripts/test-repo-doc-sync.js`.
- Added missing `/god-export-otel` routing metadata.
- `/god-sync`, `/god-docs`, `/god-doctor`, `/god-status`, and `/god-mode` now
  document repo documentation sync integration.
- The dashboard proactive docs check now reads repo documentation sync status.
- Package contents checks now require the repo documentation sync helper and
  `/god-export-otel` routing metadata.

## Sync behavior

For a Godpowers repository, the helper:

- reads package version and repository surface counts
- detects stale mechanical claims in README, user docs, architecture docs,
  roadmap docs, command reference docs, `/god-version`, and `/god-doctor`
- applies safe mechanical badge, version, and count refreshes when requested
- plans Pillars sync for changed repo documentation paths
- recommends `god-docs-writer` for release notes, changelog, contribution,
  support, or security policy prose

Detection is read-only by default. Applying sync does not invent narrative
release notes, changelog entries, contribution policy, support policy, or
security support policy.

## Auto-invoke and auto-spawn policy

Safe repo documentation sync is local runtime work and must be reported as:

```text
Agent: none, local runtime only
```

Godpowers recommends or spawns `god-docs-writer` only when narrative docs need
claim verification or policy judgment after local mechanical sync has finished.

## Validation

Release validation includes:

- `node scripts/test-repo-doc-sync.js`
- `node scripts/test-feature-awareness.js`
- `node scripts/test-context-writer.js`
- `node scripts/test-planning-systems.js`
- `node scripts/test-doc-surface-counts.js`
- `node scripts/validate-skills.js`
- `git diff --check`

The `v1.6.17` tag should point to the release commit that matches the npm
`godpowers@1.6.17` package.
