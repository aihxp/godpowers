# Godpowers 3.1.1 Release

> Status: Prepared
> Date: 2026-06-15

[DECISION] Godpowers 3.1.1 is a patch release that adds the `evidence.canClose` strict close-gate primitive. It is additive and read-only: no existing behavior changes.
[DECISION] `canClose` is the foundational primitive for the rest of Phase 1 of the fusion design (enforced close-on-evidence). It is not yet wired into `gate.js` or the close path; that wiring is the deliberate behavior change and remains unshipped.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the 3.1.0 evidence producer and 3.0.x concierge surface.

## What's in this release

- [DECISION] New `evidence.canClose(substep)` in `lib/evidence.js`, the read-only strict close gate rebound from Mythify's completion rule (`cmd_step`): a substep may close only when evidence bound to it since it went in-flight supports the close.
- [DECISION] Tier-appropriate close rules per `docs/FUSION-ARCHITECTURE.md` section 4.2: `build`, `deploy`, and `harden` require the latest executed record since in-flight to be `verified:true`; other substeps accept an executed pass or an attested record; a failed executed record always blocks.
- [DECISION] "Since in-flight" is the substep's last status-change timestamp (`state.json` `updated`), which is when it most recently went in-flight.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 43 intent recipes, and the 3.1.0 `godpowers verify` evidence producer remain unchanged.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.1.1 patch version.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, and architecture now describe the 3.1.1 `canClose` primitive.
- [DECISION] No gate behavior or close-on-evidence logic changed. `canClose` is read-only and unwired; the build gate still reads `state.json` `verification.commands[]` exactly as before.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `node scripts/test-evidence.js` passed with 26 evidence-engine tests, including six new `canClose` tests.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js`.
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.1.1 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.1.1` or `npx godpowers@3.1.1`.
- [DECISION] No migration is required. The change is additive and read-only; existing projects keep working unchanged.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.1.1`, npm `@godpowers/mcp@3.1.1`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.1.1`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
- [DECISION] The remaining Phase 1 work (wiring `canClose` into the gate and the close path, the deliberate behavior change) and Phases 2-3 remain unshipped and are tracked in `docs/FUSION-ARCHITECTURE.md`.
