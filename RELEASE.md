# Godpowers 1.6.23 Release

Date: 2026-05-16

Godpowers 1.6.23 hardens the repository after a full file-by-file audit. It
aligns release gates, documentation sync, repository surface sync, feature
awareness, source-system sync-back, host guarantees, dashboard closeouts, and
package publishing into one verified release surface.

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

- Added `.planning/2026-05-16-surface-sync-status.md` to record the current
  `.github/workflows`, `.planning`, and `agents` sync status without rewriting
  historical planning evidence.
- Expanded `god-reconciler` so feature reconciliation includes repository
  documentation, repository surface, runtime feature awareness, source-system
  sync-back, and host capability checks.
- Expanded `god-updater` so closeout reports repo-doc sync, repo-surface sync,
  feature awareness, source-system sync-back, host capability, dashboard
  refresh, checkpoint sync, Pillars sync, and context refresh.
- Updated workflow release jobs so root and first-party pack publishing run
  the complete release gate first.
- Updated `prepublishOnly` so local npm publish attempts also run the complete
  release gate.

## Repairs

- Repaired stale current-version claims in README, architecture, roadmap,
  reference docs, `/god-version`, and agent context.
- Repaired stale `/god-reconcile` docs so the command and specialist agent
  describe the same expanded sync surfaces.
- Repaired final sync docs so `/god-mode`, `god-orchestrator`, and agent specs
  all describe core artifacts plus local runtime and repository sync surfaces.
- Removed literal forbidden dash and emoji characters from primary source files
  while keeping validator tests intact through Unicode escape sequences.
- Repaired release documentation drift around package contents, route quality,
  recipe coverage, release-surface checks, dogfood, host guarantees, extension
  authoring, and Mode D suite release dry-runs.

## Validation

Release validation includes:

- source audit over 639 tracked plus untracked source files
- `node scripts/validate-skills.js`
- `bash scripts/smoke.sh`
- `node scripts/test-agent-validator.js`
- `node scripts/test-artifact-linter.js`
- `node scripts/test-repo-doc-sync.js`
- `node scripts/test-repo-surface-sync.js`
- `node scripts/test-automation-surface-sync.js`
- `node scripts/test-feature-awareness.js`
- `node scripts/test-host-capabilities.js`
- `node scripts/test-dogfood-runner.js`
- `node scripts/test-extension-authoring.js`
- `node scripts/test-mode-d.js`
- `node scripts/test-extensions-publish.js`
- `node scripts/test-install-smoke.js`
- `npm audit --omit=dev`
- `git diff --check`
- `npm run release:check`

The `v1.6.23` tag should point to the release commit that matches the npm
`godpowers@1.6.23` package.
