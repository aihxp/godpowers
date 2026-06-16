# Godpowers 3.13.0 Release

> Status: Prepared
> Date: 2026-06-16

[DECISION] Godpowers 3.13.0 is a minor release that hardens the default greenfield arc. The one-shot `full-arc` workflow run by `/god-mode` now audits the whole codebase after the build and writes verified documentation after harden, so a long-running idea-to-production run ships audited and documented without a separate manual pass.
[DECISION] No new skill, agent, workflow, or recipe surface is added: both new steps reuse existing agents (`god-debt-assessor`, `god-docs-writer`). Surface counts are unchanged from 3.12.1.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and keeps the full 3.1.0-3.12.1 surface (fusion + codeauditor-grade audit + remediation loop).

## What's in this release

- [DECISION] `full-arc` gains a `code-audit` job (`god-debt-assessor`, `mode: post-build-audit`) that runs after `build` and before `deploy`/`harden`. It gives the whole AI-generated codebase a scored, prioritized audit that catches issues the per-slice `god-spec-reviewer` + `god-quality-reviewer` reviews cannot see across files.
- [DECISION] `full-arc` gains a `docs` job (`god-docs-writer`, `mode: product-docs-verify`) that runs after `harden` and before `launch`. It writes the project documentation and verifies every claim against the code (drift detected) before the product ships.
- [DECISION] Dependencies were rewired: `deploy` and `harden` now `need` `code-audit`; `launch` now `needs` `docs`. The greenfield arc is build, code-audit, deploy, observe, harden, docs, launch, final-sync. The `full-arc` plan goes from 11 to 13 steps.
- [DECISION] `GOD-ORCHESTRATOR-RUNBOOK` documents the audit and docs positions in the greenfield arc.
- [DECISION] 120 slash commands, 40 specialist agents, 13 executable workflows, 44 intent recipes, and the full fusion + audit surface remain available.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.13.0 version.
- [DECISION] `workflows/full-arc.yaml` adds the `code-audit` and `docs` jobs and rewires `deploy`/`harden`/`launch` dependencies. No lib change.
- [DECISION] CHANGELOG, RELEASE notes, README, roadmap, reference, architecture, and the MCP docs now reflect 3.13.0. SECURITY supported-version table adds the `3.13.x` row and moves `3.12.x` to security fixes only.

## Validation

- [DECISION] `npm run lint` passed with 29 static checks (agent contract + size + refs intact).
- [DECISION] `node tests/integration/full-arc.test.js`, `node scripts/test-workflow-runner.js`, and `node scripts/test-agent-refs.js` passed: `full-arc` plans to 13 steps with a valid DAG and both `god-debt-assessor` and `god-docs-writer` are real agents.
- [DECISION] `npm run release:check` passed `coverage:lib` above the 90 percent line floor for `lib/**/*.js`.
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.13.0 with 120 skills, 40 agents, 13 workflows, and 44 recipes.
- [DECISION] `npm run release:check` passed root and `@godpowers/mcp` package contents.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.13.0` or `npx godpowers@3.13.0`.
- [DECISION] No migration is required. Existing projects are unaffected; the change only adds steps to the greenfield one-shot arc, which now takes longer in exchange for an audited and documented product.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.13.0`, npm `@godpowers/mcp@3.13.0`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.13.0`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance. This release has not been tagged or published to npm yet.
