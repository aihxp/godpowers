# Godpowers 2.5.0 Release

> Status: Release verification passed, waiting on protected merge and npm publish path
> Date: 2026-06-10

Godpowers 2.5.0 is the executable gate release. It adds a JSON tier gate
command for PRD, DESIGN, ARCH, ROADMAP, STACK, repo audit, build state, and
harden findings while keeping the slash-command workflow intact.

## What's in this release

- 112 slash commands
- 40 specialist agents
- 13 executable workflows
- 42 intent recipes

## Highlights

- `npx godpowers gate --tier=<tier> --project=.` emits JSON with `tier`,
  `verdict`, `artifacts`, `checks`, `findings`, and `summary`.
- The eight tier skills now run the executable gate before marking completion.
- `/god-mode` now carries an explicit rule to run gates automatically between
  tier transitions.
- `lib/artifact-map.js` is the shared source for tier artifact paths used by
  gates and dashboard planning visibility.
- `lib/cli-dispatch.js` moves subcommand dispatch out of `bin/install.js` and
  keeps the installer entry point thin.
- `scripts/test-gate.js` covers green cases, red cases, JSON shape stability,
  CLI exit codes, and async API parity.
- Route metadata now declares `standards.gate-command` for the eight tier
  commands, and route-quality checks verify those executable gate commands.

## Validation

- `node scripts/test-gate.js` green
- `node scripts/test-cli-dispatch.js` green
- `node scripts/test-router.js` green
- `node scripts/static-check.js` green
- `npm run test:e2e` green
- `node scripts/test-runtime-verification.js` green
- `node scripts/test-agent-browser.js` green
- `npm run pack:check` green
- `npm run release:check` green

## Upgrade

- `npm install -g godpowers@2.5.0` or `npx godpowers@2.5.0`
- Re-run `/god-context` in each project to refresh installed runtime metadata
- No breaking changes for valid `.godpowers/` state.

## Notes

- GitHub release creation for `v2.5.0`
- The tag should match the npm package version.
- The `v2.5.0` tag should point to the release commit that matches the npm
  `godpowers@2.5.0` package.
- npm publish is deferred until the release commit is merged through the
  protected repository path, npm credentials are available, and release hooks
  permit publishing.
