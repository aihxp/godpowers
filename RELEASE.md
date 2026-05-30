# Godpowers 2.1.0 Release

Date: 2026-05-30

Godpowers 2.1.0 is the security and drift hardening release. It keeps the 2.0
proof, request-trace, and command surfaces stable while closing a
command-injection vector, hardening runtime file handling and the installer,
and reconciling documentation drift across the repository.

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
- Repository documentation, repository surface, route quality, recipe coverage,
  and release surface sync checks
- Messy-repo dogfood scenarios
- Extension authoring scaffold helper
- Mode D suite release dry-run planner
- Release gate enforcement through `npm run release:check`

## What is new

- Closed a command-injection vector in `lib/agent-browser-driver.js`. CLI
  arguments now flow through an argv array with the shell disabled, so URLs,
  selectors, and eval expressions sourced from project content or CLI flags
  cannot be interpreted as shell syntax.
- Guarded runtime JSON parsing of `state.json` and `events.jsonl` against
  corrupt or partially-written files, replacing uncaught crashes with clear
  errors or skipped torn lines.
- Corrected the review registry path to `.godpowers/REVIEW-REQUIRED.md` so the
  dashboard and automation see review items and the off-switch no longer
  deletes a repo-root file.
- Made data-directory and runtime-bundle installs a clean replace so version
  upgrades never leave behind files that no longer ship.
- Narrowed `agent-cache` deletion scope, added extension-scaffold name
  validation, added prototype-pollution guards to the YAML/manifest parser and
  router, and limited installer symlink reproduction to the source tree.
- Added a skill/agent prose reference validator wired into the agent-ref test
  gate, wired have-not `A-13` into the architecture gate, and softened brittle
  exact-count tests to floors.
- Reconciled documentation drift across README, ARCHITECTURE, ARCHITECTURE-MAP,
  docs, references, and skills (counts, linkage paths, HAVE-NOTS tally, stale
  sample output).

## Guardrails

- The public slash-command surface remains frozen.
- The runtime remains dependency-free.
- `bin/install.js` stays a thin CLI entry point and delegates install behavior
  to `lib/installer-core.js`.
- Every `child_process` call site uses an argv array with the shell disabled.
- `scripts/static-check.js` continues to verify async APIs, JSDoc typedefs,
  agent-ref test coverage, shared harness adoption, skill metadata source
  parsing, and God Mode runbook delegation.

## Validation

Release validation includes:

- `npm test`
- `npm run test:audit`
- `npm run pack:check`
- `npm run release:check`
- `npm pack --json`
- local install smoke tests across supported runtime shapes
- npm publish when registry credentials are available
- GitHub release creation for `v2.1.0`

The `v2.1.0` tag should point to the release commit that matches the npm
`godpowers@2.1.0` package.
