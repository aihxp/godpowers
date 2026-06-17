# Godpowers 3.14.0 Release

> Status: Published
> Date: 2026-06-17

[DECISION] Godpowers 3.14.0 is a UX-audit remediation release that drives the Godpowers UX audit (`uxaudit.md`, 11 weighted experience lenses) to zero: all 20 findings across usability, content, information architecture, interaction, process, journeys, and trust.
[DECISION] The changes are backward compatible and add no new commands. They tighten the install and dashboard surfaces, broaden the free-text router, restructure `--help`, add a docs index, and rewrite the front-door documentation. This is a minor bump because it adds backward-compatible user-facing functionality.
[DECISION] No new skill, agent, workflow, or recipe surface is added or removed. Surface counts are unchanged: 120 slash commands, 40 specialist agents, 13 workflows, 44 recipes. The lib module count is unchanged at 91.

## What's in this release

- [DECISION] Install and surface validation (USE-001, USE-002, USE-003): a typo'd bare subcommand errors instead of silently starting a global install; an unknown `--profile` is a clean one-line error before any filesystem write; `surface --runtime=<bad>` is rejected instead of planning an apply to a nonexistent runtime.
- [DECISION] Dashboard and report display honesty (USE-004, CNT-005, CNT-006, IXD-001): `status --full` shows `Phase/Step: not initialized` instead of `Complete` on an uninitialized project; the readiness headline reads `no blockers` instead of the overloaded `ready`; the empty `report` names the commands that populate the ledger; `next` no longer prints the recommended command a third time.
- [DECISION] Free-text router accuracy (IA-001, IA-002): broadened `intent-keywords` so common verbs match a topical recipe (fix a bug, ship it, deploy, release, check progress); `classifyWorkSize` returns null when no small-task signal is present instead of mis-sizing an unrelated intent as `/god-quick`.
- [DECISION] Process and journey honesty (PROC-001, JRN-002): `can-close` output, its docstring, and the orchestrator runbook now state that `can-close` is the advisory freshness check and `npx godpowers gate` is the enforced boundary; the dashboard progress line annotates skipped steps so a skipped-tier run no longer shows an inflated percent.
- [DECISION] Help and docs prioritization (CNT-004, IA-004): `--help` leads with a 6-item "Start here" group above two labelled advanced groups; a new `docs/README.md` indexes user-facing docs under "Start here" and separates internal/maintainer docs.
- [DECISION] Front-door content, vocabulary, and trust (CNT-001, CNT-002, CNT-003, IA-003, JRN-001, TRU-001, TRU-002): the README top fold leads with a runnable Quick start and an inline glossary, version archaeology moved to a CHANGELOG/RELEASE pointer; the worst command descriptions lead with the user-intent verb and the `/god-reconcile` vs `/god-sync` overlap is disambiguated; the README clarifies that plain `/god-mode` resumes from disk; SECURITY.md softens its SLA to best-effort; the runtime headline no longer implies 15-way parity.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.14.0 version.
- [DECISION] No new runtime module (lib module count unchanged at 91). No public command/agent/workflow/recipe surface change.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, architecture, the architecture map, and `agents/context.md` now reflect 3.14.0. The SECURITY supported-version table now carries the `3.14.x` row.

## Validation

- [DECISION] `npm test` passed all command groups.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor and the 75 percent branch floor, and the per-file floor (>= 70 percent lines across the lib modules).
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities and `git diff --check`.
- [DECISION] `npm run release:check` passed public surface docs for version 3.14.0 with 120 skills, 40 agents, 13 workflows, and 44 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.14.0` or `npx godpowers@3.14.0`.
- [DECISION] No migration is required. The changes are install-surface validation, dashboard/router honesty, and documentation improvements with no breaking surface change.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.14.0`, npm `@godpowers/mcp@3.14.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.14.0`.
- [DECISION] Tagged `v3.14.0` and published to npm with provenance via the tag-triggered GitHub publish workflow (`.github/workflows/publish.yml`): `godpowers@3.14.0` and `@godpowers/mcp@3.14.0` are live as the `latest` dist-tag.
