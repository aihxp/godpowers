# Godpowers 2.0.3 Release

Date: 2026-05-26

Godpowers 2.0.3 is the maintenance hardening patch. It keeps the 2.0 proof,
request-trace, and command surfaces stable while reducing installer size,
removing copied test harnesses, making workflow agent ranges executable, and
adding async file APIs for future runtime migration.

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
- Dashboard action briefs for next-step compression
- Dashboard host guarantees for full, degraded, and unknown runtime capability
- `godpowers status --project .` and `godpowers next --project .`
- `godpowers quick-proof --project .`
- Planning-system migration for GSD, BMAD, and Superpowers
- Repository documentation sync checks
- Repository surface sync checks
- Route quality, recipe coverage, and release surface sync checks
- Messy-repo dogfood scenarios
- Extension authoring scaffold helper
- Mode D suite release dry-run planner
- Release gate enforcement through `npm run release:check`
- Request-trace discipline in `god-executor`
- Scope and request-trace checks in `god-spec-reviewer`
- Simplicity and surgicality checks in `god-quality-reviewer`

## What is new

- Split installer runtime definitions, argument parsing, and install core logic
  out of `bin/install.js`.
- Migrated test files to the shared `scripts/test-harness.js` helper and made
  static checks reject future copied harness boilerplate.
- Added async state, intent, and workflow plan APIs beside existing synchronous
  APIs.
- Added executable workflow agent reference validation for `god-agent@range`
  entries.
- Added `lib/skill-surface.js` so individual `skills/` files are the source of
  truth for slash-command metadata.
- Moved detailed God Mode transcript, flag, sync, and completion templates into
  `references/orchestration/GOD-MODE-RUNBOOK.md`.
- Added JSDoc typedef contracts to load-bearing runtime modules.
- Updated README, validation docs, release checklist, changelog, release notes,
  package metadata, and lockfile for `2.0.3`.

## Guardrails

- The public slash-command surface remains frozen.
- The runtime remains dependency-free.
- `bin/install.js` stays a thin CLI entry point and delegates install behavior
  to `lib/installer-core.js`.
- `scripts/static-check.js` verifies async APIs, JSDoc typedefs, agent-ref test
  coverage, shared harness adoption, skill metadata source parsing, and God
  Mode runbook delegation.
- Workflow `uses:` ranges now fail fast if they do not satisfy the current
  agent contract version.
- Existing synchronous APIs remain available while async APIs provide the safe
  migration path.

## Validation

Release validation includes:

- `npm test`
- `npm run test:audit`
- `npm run pack:check`
- `npm run release:check`
- `npm pack --json`
- local install smoke tests across supported runtime shapes
- npm publish when registry credentials are available
- GitHub release creation for `v2.0.3`

The `v2.0.3` tag should point to the release commit that matches the npm
`godpowers@2.0.3` package.
