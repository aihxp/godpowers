# Godpowers 3.6.0 Release

> Status: Prepared
> Date: 2026-06-15

[DECISION] Godpowers 3.6.0 is a minor release that adds structured reflections, the next Phase 3 slice of the fusion design.
[DECISION] Reflections are isolated and additive: `evidence.reflect()` never touches `state.json`, the verifications ledger, or the event stream. No existing command behavior changes.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the 3.1.0-3.5.0 evidence, close-gate, quarterback, and work-report surface.

## What's in this release

- [DECISION] New `evidence.reflect()` and `evidence.reflections()`, rebound from Mythify's reflect tool.
- [DECISION] A reflection records action, outcome (success/partial/failure), observation, root cause, next action, and an optional lesson, appended to `.godpowers/ledger/reflections.jsonl` with substep context.
- [DECISION] New `npx godpowers reflect --action "<...>" --outcome <...> --next "<...>"` CLI subcommand, with `--observation`, `--root-cause`, `--lesson`, and `--substep` optional.
- [DECISION] The ledger jsonl append/read is generalized into shared `appendJsonlAtomic` and `readJsonl` helpers so verifications and reflections share one atomic path; the verifications record shape and behavior are unchanged.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 43 intent recipes, and the 3.1.0-3.5.0 evidence, close-gate, quarterback, and work-report surface remain available.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.6.0 minor version.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, architecture, and the SECURITY supported-version series now describe the 3.6.0 reflections and `reflect` command.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `node scripts/test-reflections.js` passed with 4 reflection tests.
- [DECISION] `node scripts/test-evidence.js` passed with 26 evidence tests after the jsonl helper refactor.
- [DECISION] `node scripts/test-cli-dispatch.js` passed with 38 CLI dispatch tests, including the new `reflect` tests.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js` (evidence.js at 96 percent lines).
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.6.0 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.6.0` or `npx godpowers@3.6.0`.
- [DECISION] No migration is required. Reflections are isolated and additive; no other behavior changed.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.6.0`, npm `@godpowers/mcp@3.6.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.6.0`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
- [DECISION] Phase 3 continues after this release with memory, lessons, outcome loops, and the MCP read tools (`work_report`, `route`, `verification_history`), tracked in `docs/FUSION-ARCHITECTURE.md`.
