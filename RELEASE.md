# Godpowers 2.3.0 Release

> Status: Ready for package verification
> Date: 2026-06-08

Godpowers 2.3.0 is an accountability and release-surface hardening release for
the 2.x line. It strengthens planning grounding, package legitimacy, install
profiles, atomic persistence, executor recovery, extension authoring,
front-door route coverage, host capability reporting, and dashboard behavior.

## What's in this release

- 112 slash commands
- 40 specialist agents
- 13 executable workflows
- 42 intent recipes

## Highlights

- `/god-extension-scaffold` gives extension authors a first-class
  slash-command path before `/god-test-extension` and `/god-extension-add`.
- Public `/god` intent matching now covers the starter phrases users are most
  likely to type: start a product, add a feature, fix production, audit an
  existing repo, ship a release, maintain health, and extend Godpowers.
- Quick Proof and README starter paths are now regression-tested against the
  actual router and recipe engine.
- User project dashboards no longer show maintainer-repository documentation
  drift when a clean non-Godpowers project is inspected.
- Host capability reporting now includes optional code-intelligence tooling
  without treating missing optional tools as a host degradation.
- Extension install, planning-system detection, and agent-cache cleanup are
  hardened around symlinked paths that point outside trusted source trees.
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
- Architecture docs now include an executable audit map for disconnected
  commands, actions, workflows, recipes, and package surfaces.

## Validation

- `npm test` green across the full suite
- `npm run lint` clean
- `npm run release:check` green (tests, audit, package contents)
- `npm pack` creates a local `godpowers-2.3.0.tgz` tarball for package
  inspection

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
