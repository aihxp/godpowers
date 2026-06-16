# Godpowers 3.12.1 Release

> Status: Prepared
> Date: 2026-06-16

[DECISION] Godpowers 3.12.1 is a patch that de-duplicates the audit lanes introduced by the 3.12.0 codeauditor-grade upgrade. No surface change, no new behavior beyond the audit agent's prompt.
[DECISION] `god-debt-assessor`'s Security dimension now defers to and cites `god-harden-auditor` rather than re-deriving security findings; its Code Quality dimension is explicitly the whole-repo read that complements `god-quality-reviewer`'s per-slice diff review.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the full 3.1.0-3.12.0 surface (fusion + codeauditor-grade audit + remediation loop).

## What's in this release

- [DECISION] `god-debt-assessor` gains a "Lane discipline" section: when `.godpowers/harden/FINDINGS.md` exists, the Security dimension is scored from harden's verdict and cites its finding IDs (a security finding is recorded here only if harden did not cover it); if FINDINGS.md is absent, a lightweight security read is done and labeled as not a substitute for `/god-harden`.
- [DECISION] The Code Quality dimension is marked as the whole-codebase point-in-time read; per-slice diff review remains owned by `god-quality-reviewer`.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 44 intent recipes, and the full fusion + audit surface remain available.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.12.1 patch version.
- [DECISION] Agent prompt only; no new skill, agent, recipe, or lib change. Recipe and command counts are unchanged from 3.12.0.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, and architecture now reflect 3.12.1.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks (agent contract + size + refs intact).
- [DECISION] `node scripts/test-agent-refs.js` and `node scripts/test-agent-validator.js` passed; `god-debt-assessor` stays under the 20KB prompt limit.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js`.
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.12.1 with 120 skills, 40 agents, 13 workflows, and 44 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.12.1` or `npx godpowers@3.12.1`.
- [DECISION] No migration is required. This is a prompt-level clarification of the audit agent; no other behavior changed.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.12.1`, npm `@godpowers/mcp@3.12.1`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.12.1`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
