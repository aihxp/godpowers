# Godpowers 2.0.2 Release

Date: 2026-05-26

Godpowers 2.0.2 is the release hardening patch. It keeps the 2.0 proof,
request-trace, and command surfaces stable while tightening the package
runtime, maintainer validation, and release-readiness checks.

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

- Added `scripts/run-tests.js` as the maintained full-suite runner behind
  `npm test`.
- Added `scripts/static-check.js` and `npm run lint` for dependency-free
  JavaScript syntax and release-gate structure checks.
- Added dedicated YAML parser coverage for the supported dependency-free YAML
  subset.
- Updated README, validation docs, release checklist, repo surface docs,
  changelog, release notes, package metadata, and lockfile for `2.0.2`.

## Guardrails

- The runtime remains dependency-free.
- The supported YAML subset is documented and covered by tests.
- Router `file:` checks reject absolute paths and traversal outside the
  project root.
- Installer recursive copy preserves symlinks instead of dereferencing them.
- Release and repo surface sync detectors recognize delegated test wiring
  through `scripts/run-tests.js`.
- Budget block removal only removes the top-level `budgets` block.
- Package contents checks require the runtime helper files shipped by this
  patch.

## Validation

Release validation includes:

- `npm test`
- `npm run test:audit`
- `npm run pack:check`
- `npm run release:check`
- `npm pack --json`
- local uninstall of previous runtime installs
- local reinstall from the generated tarball
- npm publish with provenance when available
- `node scripts/verify-published-install.js godpowers@latest`
- GitHub release creation for `v2.0.2`

The `v2.0.2` tag should point to the release commit that matches the npm
`godpowers@2.0.2` package.
