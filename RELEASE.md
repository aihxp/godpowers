# Godpowers 3.8.0 Release

> Status: Prepared
> Date: 2026-06-15

[DECISION] Godpowers 3.8.0 is a minor release that adds a reusable lessons store, the next Phase 3 slice of the fusion design.
[DECISION] The lessons store is isolated and additive: it never touches `state.json`, the verifications ledger, or the event stream. The only reflect change is that a reflection carrying a lesson now auto-records one; the reflection record itself is unchanged.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the 3.1.0-3.7.0 evidence, close-gate, quarterback, work-report, reflections, and memory surface.

## What's in this release

- [DECISION] New `evidence.lesson.add/list`, rebound from Mythify's lessons store.
- [DECISION] Lessons carry tags and a scope (project or global) and append to `.godpowers/ledger/lessons.jsonl` (or `~/.godpowers/lessons.jsonl` for global).
- [DECISION] `evidence.reflect()` auto-records a project lesson tagged `auto-reflected` when a reflection carries a lesson.
- [DECISION] New `npx godpowers lesson add|list "<lesson>" [--tags a,b] [--scope project|global]` CLI subcommand.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 43 intent recipes, and the 3.1.0-3.7.0 evidence, close-gate, quarterback, work-report, reflections, and memory surface remain available.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.8.0 minor version.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, architecture, and the SECURITY supported-version series now describe the 3.8.0 lessons store and `lesson` command.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `node scripts/test-lessons.js` passed with 5 lesson tests, including the reflect auto-record.
- [DECISION] `node scripts/test-reflections.js` passed with 4 reflection tests after the auto-record wiring.
- [DECISION] `node scripts/test-cli-dispatch.js` passed with 43 CLI dispatch tests, including the new `lesson` tests.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js` (evidence.js at 96.7 percent lines).
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.8.0 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.8.0` or `npx godpowers@3.8.0`.
- [DECISION] No migration is required. The lessons store is isolated and additive; no other behavior changed.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.8.0`, npm `@godpowers/mcp@3.8.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.8.0`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
- [DECISION] Phase 3 continues after this release with outcome loops and the MCP read tools (`work_report`, `route`, `verification_history`), the last two slices tracked in `docs/FUSION-ARCHITECTURE.md`.
