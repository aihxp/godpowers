# Godpowers 2.2.0 Release

> Status: Ready for release
> Date: 2026-05-30

Godpowers 2.2.0 adds deliverable progress tracking on top of the 2.1.1
documentation and off-switch safety patch. It keeps the public slash-command
surface stable and backward compatible.

## What's in this release

- 111 slash commands
- 40 specialist agents
- 13 executable workflows
- 41 intent recipes

## Highlights

- Deliverable progress tracking: the new `/god-progress` command and the
  `.godpowers/REQUIREMENTS.md` ledger report which PRD requirements and roadmap
  increments are done, in progress, or not started. Status is derived from the
  linkage map by `lib/requirements.js`, so it cannot drift from the code that is
  actually implemented.
- Stable requirement and increment ids: PRD requirements carry
  `P-MUST-NN`/`P-SHOULD-NN`/`P-COULD-NN`, and ROADMAP increments carry `M-slug`
  ids with a per-increment `Status` and member requirement ids.
- The build chain populates the ledger during real runs: `god-planner` names the
  requirement ids each slice delivers, `god-executor` stamps `// Implements: P-...`
  annotations, and the spec and quality reviewers verify them.
- The dashboard (`/god-status`, `/god-next`, `/god-mode` closeout) gains a
  `Deliverable progress` section, and a `whats-done` recipe routes natural
  language like "how far along are we" to `/god-progress`.
- Documentation reconciled with the shipped surface and version: accurate
  counts and `/god-progress`/`REQUIREMENTS.md` awareness across README,
  ARCHITECTURE, reference, linkage, recipes, and the artifact inventories.

## Validation

- `npm test` green across the full suite
- `npm run lint` clean
- `npm run release:check` green (tests, audit, package contents)

## Upgrade

- `npm install -g godpowers@2.2.0` or `npx godpowers@2.2.0`
- Re-run `/god-context` in each project to refresh installed runtime metadata
- No breaking changes; existing `.godpowers/` state is compatible. Projects gain
  a `REQUIREMENTS.md` ledger the next time `/god-progress` or `/god-sync` runs.

## Notes

- GitHub release creation for `v2.2.0`
- The tag should match the npm package version
- The `v2.2.0` tag should point to the release commit that matches the npm
  `godpowers@2.2.0` package.
