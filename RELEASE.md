# Godpowers 3.11.0 Release

> Status: Prepared
> Date: 2026-06-15

[DECISION] Godpowers 3.11.0 adds the optional one-time `.mythify/` ledger importer, the final item in the fusion design. With it, the native fusion of Mythify's evidence engine and quarterback into Godpowers (Phases 0-3 plus the optional importer) is complete.
[DECISION] The importer is optional, one-time, and additive: it appends imported records to the Godpowers ledger and does not roll up into `state.json` or emit gate events. No existing command behavior changes.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the 3.1.0-3.10.0 evidence, close-gate, quarterback, work-report, reflections, memory, lessons, outcome, and MCP surface.

## What's in this release

- [DECISION] New `lib/evidence-import.js` and `npx godpowers import-ledger [--from <path>]`.
- [DECISION] It copies an existing Mythify `.mythify/` ledger into `.godpowers/ledger/`: verifications (rebinding plan/step_id/step_title/step_status to arc/substep/substep_status), reflections, memory (merged by key), lessons (lessons/*.json to lessons.jsonl), and outcomes (goal.json + iterations.jsonl per slug).
- [DECISION] Records are appended; the import does not roll up into `state.json` or emit gate events.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 43 intent recipes, and the 3.1.0-3.10.0 evidence, close-gate, quarterback, work-report, reflections, memory, lessons, outcome, and eight-tool MCP surface remain available.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.11.0 minor version.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, architecture, and the SECURITY supported-version series now describe the 3.11.0 importer and the completed fusion.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `node scripts/test-evidence-import.js` passed with 4 importer tests, including the plan/step to arc/substep rebind.
- [DECISION] `node scripts/test-cli-dispatch.js` passed with 48 CLI dispatch tests, including the new `import-ledger` tests.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js` (evidence-import.js at 97 percent lines).
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.11.0 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.11.0` or `npx godpowers@3.11.0`.
- [DECISION] No migration is required. The importer is optional and additive; no other behavior changed.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.11.0`, npm `@godpowers/mcp@3.11.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.11.0`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
- [DECISION] This is the final planned release of the fusion design. Every phase (0-3) and the optional importer are implemented and shipped to main across 3.1.0-3.11.0.
