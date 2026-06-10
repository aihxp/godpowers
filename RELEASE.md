# Godpowers 2.5.1 Release

> Status: Ready for protected merge
> Date: 2026-06-10

[DECISION] Godpowers 2.5.1 is a Phase 2 host-proof blocker patch.
[DECISION] Phase 2 proof work exposed two Godpowers defects that would otherwise contaminate Slot B, and this release fixes both defects before the next host run.
[DECISION] This release does not complete the Host Proof Campaign because Run B and Run C are still pending.

## What's in this release

- [DECISION] 112 slash commands.
- [DECISION] 40 specialist agents.
- [DECISION] 13 executable workflows.
- [DECISION] 42 intent recipes.
- [DECISION] 8 installer CLI helpers.

## Highlights

- [DECISION] `godpowers-runtime` now includes `bin/` next to `package.json`, so host workflows can run `npm exec --package <runtime> -- godpowers gate`.
- [DECISION] Build gates now fail closed when `.godpowers/build/STATE.md` records any failed verification command.
- [DECISION] Phase 2 Slot A, Slot B, and Slot C evidence remains the repository state merged through PR #9.
- [DECISION] Slot B can now start with the installed runtime bundle exposing the documented gate command and the build gate failing closed on failed command evidence.

## Validation

- [DECISION] `node scripts/test-gate.js` passed.
- [DECISION] `node scripts/test-install-smoke.js` passed.
- [DECISION] `npm run test:e2e` passed.
- [DECISION] `node scripts/test-runtime-verification.js` passed.
- [DECISION] `node scripts/test-agent-browser.js` passed.
- [DECISION] `node scripts/static-check.js` passed.
- [DECISION] Patched `lib/gate.js` failed a captured build artifact because a verification command was recorded as failed.
- [DECISION] A temp local Codex install ran `npm exec --package <runtime> -- godpowers gate --tier=prd --project=<example> --json` successfully.
- [DECISION] `npm run release:check` passed with `coverage:lib` at 92.9 percent line coverage, `npm audit --omit=dev` reporting 0 vulnerabilities, public surface docs matching version 2.5.1, and package contents verified at 534 files.

## Upgrade

- [DECISION] Use `npm install -g godpowers@2.5.1` or `npx godpowers@2.5.1` after the package is published.
- [DECISION] Reinstall Godpowers in host runtimes before Phase 2 Run B so the installed runtime bundle includes the gate CLI entrypoint fix.
- [DECISION] Existing `.godpowers/` state remains compatible.

## Notes

- [DECISION] Slot A remains the PR #9 `sindresorhus/slugify-cli` host-proof record, and this patch does not change its claim scope.
- [DECISION] Run B and Run C remain required before the Phase 2 docs patch can claim a complete host proof campaign.
- [DECISION] Publishing remains pending until protected merge, tag, and npm provenance publish complete.
