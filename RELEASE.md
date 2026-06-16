# Godpowers 3.12.0 Release

> Status: Prepared
> Date: 2026-06-16

[DECISION] Godpowers 3.12.0 makes the code audit codeauditor-grade and adds an audit-remediation loop on top of the completed Mythify fusion.
[DECISION] The audit stays read-only; the remediation loop is opt-in (intent/recipe or an end-of-arc pass) and is not wired into the default greenfield full-arc.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the 3.1.0-3.11.0 evidence, close-gate, quarterback, work-report, reflections, memory, lessons, outcome, MCP, and importer surface.

## What's in this release

- [DECISION] `god-debt-assessor` (`/god-tech-debt`) is now a codeauditor-grade, read-only source-code audit: nine weighted dimensions scored 0-100 with grade bands and risk-capping, per-finding Severity/Confidence/Effort, adversarial verification with Suspected marking, paper-construct/theater hunting, root-not-leaves systemic clustering, a strengths-to-preserve section, calibration to maturity, a file:line + substitution evidence gate, and a self-contained "how to use this report" protocol. It keeps Godpowers' broader operational/knowledge debt categories as extra lenses; output stays `.godpowers/tech-debt/REPORT.md`.
- [DECISION] New `audit-remediate` recipe routes "audit and fix until clean" intent.
- [DECISION] New `GOD-ORCHESTRATOR-RUNBOOK` audit-remediation loop: audit, select worst-first, fix with `god-debugger`, verify with an independent reviewer, bound the retries with `evidence.outcome`, re-audit until no Confirmed Critical/High remains. "Clean" is an evidence-backed re-audit; un-fixable findings pause as precise blockers.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 44 intent recipes, and the 3.1.0-3.11.0 fusion surface remain available.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.12.0 minor version.
- [DECISION] No new skill or agent (god-debt-assessor enhanced in place). Recipe surface count moves 43 to 44.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, architecture, and the SECURITY supported-version series now describe the 3.12.0 audit upgrade and remediation loop.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks (agent contract + size + refs intact).
- [DECISION] `node scripts/test-recipes.js` passed; the `audit-remediate` recipe loads and matches intent.
- [DECISION] `node scripts/validate-skills.js` passed with 480 checks.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js`.
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.12.0 with 120 skills, 40 agents, 13 workflows, and 44 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.12.0` or `npx godpowers@3.12.0`.
- [DECISION] No migration is required. The audit upgrade and recipe are additive; no other behavior changed.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.12.0`, npm `@godpowers/mcp@3.12.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.12.0`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
- [DECISION] The audit-remediation loop is opt-in. Wiring a terminal codeaudit + remediation pass into the default greenfield `full-arc` is a deliberate follow-up, not part of this release.
