# Godpowers 3.2.0 Release

> Status: Prepared
> Date: 2026-06-15

[DECISION] Godpowers 3.2.0 is a minor release that lands the first enforced close-on-evidence behavior change from the Phase 1 fusion design: the harden gate now requires executed verification evidence.
[DECISION] This is a behavior change, not an additive-only release. A security tier can no longer close "done" without an exit-code-backed passing verification record. The build gate behavior is unchanged.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the 3.1.0 evidence producer and 3.1.1 `canClose` primitive.

## What's in this release

- [DECISION] BEHAVIOR CHANGE: `lib/gate.js`'s build-only executed-evidence requirement is generalized to every executable-gated tier, driven by `evidence.EXECUTED_REQUIRED_SUBSTEPS` (`build`, `deploy`, `harden`).
- [DECISION] The `harden` gate now requires at least one passed and zero failed verification commands in `state.json` `verification.commands[]`, in addition to its existing no-Critical-findings check.
- [DECISION] Finding ids are tier-prefixed: the build tier keeps `build-verification-*`, and harden gains `harden-verification-*`.
- [DECISION] Added the `tier-3.harden` state-step mapping in `lib/artifact-map.js` so the harden gate reads structured state evidence like the build gate.
- [DECISION] Updated the `god-harden` skill to record the executed security check (for example `npx godpowers verify "npm audit --omit=dev" --substep tier-3.harden`) before running the harden gate.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 43 intent recipes, the 3.1.0 `godpowers verify` producer, and the 3.1.1 `evidence.canClose` primitive remain available.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.2.0 minor version.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, architecture, and the SECURITY supported-version series now describe the 3.2.0 enforced harden gate.
- [DECISION] The harden-pass gate fixture now carries a passing verification record so it reflects the enforced requirement.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `node scripts/test-gate.js` passed, including two new harden gate tests (fail without executed evidence, pass with executed evidence).
- [DECISION] `node scripts/test-evidence.js` passed with 26 evidence-engine tests.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js`.
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.2.0 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.2.0` or `npx godpowers@3.2.0`.
- [DECISION] Action required for harden: projects that closed a harden step without a verification record must now run an executed verification (for example `npx godpowers verify "npm audit --omit=dev" --substep tier-3.harden --project=.`) before the harden gate passes.
- [DECISION] No other tier behavior changed. Build, planning, repo, and other gates are unaffected.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.2.0`, npm `@godpowers/mcp@3.2.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.2.0`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
- [DECISION] The remaining Phase 1 work (wiring `evidence.canClose` into the orchestrator close path) and Phases 2-3 remain unshipped and are tracked in `docs/FUSION-ARCHITECTURE.md`.
