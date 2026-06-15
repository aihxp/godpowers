# Godpowers 3.5.0 Release

> Status: Prepared
> Date: 2026-06-15

[DECISION] Godpowers 3.5.0 is a minor release that lands the first Phase 3 slice of the fusion design: the work report play-by-play.
[DECISION] The work report is read-only beyond a report cursor and additive. No existing command behavior changes.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the 3.1.0-3.4.0 evidence, close-gate, and quarterback surface.

## What's in this release

- [DECISION] New `lib/work-report.js`, the chat play-by-play rebound from Mythify's build_work_report.
- [DECISION] It reads `.godpowers/ledger/verifications.jsonl`, surfaces an Attention section for unverified records, summarizes passed/failed/attested, and advances a cursor at `.godpowers/ledger/reports/cursor.json` so a fresh session emits only what is new.
- [DECISION] New read-only `npx godpowers report --since last` CLI subcommand, with `--since all` for the full history and `--peek` to show the report without advancing the cursor.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 43 intent recipes, and the 3.1.0-3.4.0 evidence, close-gate, and quarterback surface remain available.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.5.0 minor version.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, architecture, and the SECURITY supported-version series now describe the 3.5.0 work report and `report` command.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `node scripts/test-work-report.js` passed with 5 work-report tests.
- [DECISION] `node scripts/test-cli-dispatch.js` passed with 36 CLI dispatch tests, including the new `report` tests.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js` (work-report.js at 100 percent lines).
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.5.0 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.5.0` or `npx godpowers@3.5.0`.
- [DECISION] No migration is required. The work report is read-only beyond a cursor and additive; no other behavior changed.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.5.0`, npm `@godpowers/mcp@3.5.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.5.0`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
- [DECISION] Phase 3 continues after this release with outcome loops, memory, lessons, reflections, and the MCP read tools (`work_report`, `route`, `verification_history`), tracked in `docs/FUSION-ARCHITECTURE.md`.
