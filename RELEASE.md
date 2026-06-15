# Godpowers 3.1.0 Release

> Status: Prepared
> Date: 2026-06-15

[DECISION] Godpowers 3.1.0 adds the evidence producer on top of the 3.0.x concierge surface. It is a minor, additive feature release: no existing behavior changes.
[DECISION] The evidence producer makes the exit-code-backed verification records that `lib/gate.js` already consumes actually get written, closing the "no producer" gap in Godpowers' own evidence ledger.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the concierge entry points from 3.0.x.
[DECISION] This release keeps `@godpowers/mcp` as the optional read-only companion package; verification stays a CLI and orchestrator concern.

## What's in this release

- [DECISION] New `lib/evidence.js` evidence producer, vendored from the Mythify Node engine (`mythify-mcp@3.6.3`, the `verify_run` and `verify_claim` tools).
- [DECISION] `evidence.verify()` executes a command, appends a Mythify-shape executed record to the append-only `.godpowers/ledger/verifications.jsonl`, rolls the latest verdict per command into `state.json` `verification.commands[]` through `lib/state.js`, and emits `gate.pass` / `gate.fail` to the hash-chained `runs/<id>/events.jsonl` stream.
- [DECISION] `evidence.verifyClaim()` records a second-class attested record (`verified:null`) that never rolls up and never emits a gate event.
- [DECISION] New CLI subcommand `npx godpowers verify "<cmd>" --substep <id> --claim "<text>"`, with `--timeout` and `--attest` / `--evidence` for self-reported attestations, wired through `lib/cli-dispatch.js`. The command exits non-zero when the verified command fails.
- [DECISION] New `lib/evidence/.provenance.json` records the vendored engine's source, version, commit, and adaptations.
- [DECISION] New `scripts/sync-evidence-engine.js` re-pulls the upstream engine, re-states the recorded adaptations, and flags any upstream record-shape drift for review.
- [DECISION] New `docs/FUSION-ARCHITECTURE.md` is the canonical design for transplanting Mythify's evidence engine and quarterback into Godpowers (Phases 0-3); this release lands Phase 0.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, and 43 intent recipes remain unchanged.
- [DECISION] Five read-only MCP tools remain available in `@godpowers/mcp`: `status`, `next`, `gate_check`, `lint_artifact`, and `trace_requirement`.

## Changes

- [DECISION] `state.json` `verification.commands[]` is now reliably populated by the evidence producer. It was defined in `schema/state.v1.json` but never written. This is additive: the build gate reads the same shape and no gate behavior or close-on-evidence logic changed (that is Phase 1 of the fusion design).
- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.1.0 minor version.
- [DECISION] README, roadmap, reference, architecture, security policy, changelog, and release notes now describe the 3.1.0 evidence producer.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `node scripts/test-evidence.js` passed with 20 evidence-engine tests.
- [DECISION] `node scripts/test-cli-dispatch.js` passed with 28 CLI dispatch tests.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js`.
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.1.0 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.
- [DECISION] The vendored engine re-sync (`node scripts/sync-evidence-engine.js`) reports in sync with `mythify-mcp@3.6.3` (commit `7cbd601`): no record-shape drift, adaptations intact.
- [DECISION] End-to-end, `npx godpowers verify "true" --substep tier-2.build` records a passing ledger entry, rolls it into `state.json`, emits `gate.pass`, and exits 0; `npx godpowers verify "false" --substep tier-2.build` records a failing entry, emits `gate.fail`, and exits 1.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.1.0` or `npx godpowers@3.1.0`.
- [DECISION] No migration is required. The change is additive; existing projects keep working and gain a populated evidence ledger the first time `godpowers verify` runs.
- [DECISION] Use `npx godpowers --profile=full` when the complete pre-3.0 command surface should be installed, or `--profile=core` (or omit `--profile`) for the contracted default surface.
- [DECISION] Use the optional MCP package install `npm install -g godpowers @godpowers/mcp` when the host can register MCP servers.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.1.0`, npm `@godpowers/mcp@3.1.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.1.0`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
- [DECISION] Phases 1-3 of the fusion design (enforced gate everywhere, quarterback, loops/memory/narration) remain unshipped and are tracked in `docs/FUSION-ARCHITECTURE.md`.
