# Godpowers 2.3.0 Release

> Status: Ready for release
> Date: 2026-05-30

Godpowers 2.3.0 is an accountability-hardening release for the 2.x line. It
keeps the public slash-command surface stable while strengthening planning
grounding, package legitimacy, install profiles, atomic persistence, and
executor recovery.

## What's in this release

- 111 slash commands
- 40 specialist agents
- 13 executable workflows
- 41 intent recipes

## Highlights

- Source-grounded planning records existing files, existing symbols, planned new
  artifacts, and unchecked references before build execution.
- Package legitimacy checks give stack and dependency decisions a concrete npm
  evidence gate before recommending package-backed choices.
- Installer profiles let users install a smaller role-based command surface
  with `--profile=<name>` or `--minimal`.
- Atomic write helpers now protect core state and ledger writes from partial
  file updates.
- Executor repair classification names whether a failed attempt should retry,
  decompose, prune, or escalate.
- Public migration language now uses neutral legacy-planning terminology so
  Godpowers is not confused with external workflow products.

## Validation

- `npm test` green across the full suite
- `npm run lint` clean
- `npm run release:check` green (tests, audit, package contents)

## Upgrade

- `npm install -g godpowers@2.3.0` or `npx godpowers@2.3.0`
- Re-run `/god-context` in each project to refresh installed runtime metadata
- No breaking changes; existing `.godpowers/` state is compatible. Users who
  want a compact install can run `npx godpowers --profile=core`.

## Notes

- GitHub release creation for `v2.3.0`
- The tag should match the npm package version
- The `v2.3.0` tag should point to the release commit that matches the npm
  `godpowers@2.3.0` package.
