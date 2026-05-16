---
pillar: repo
status: active
always_load: true
covers: [repository layout, package scripts, test commands, release files]
triggers: [repo, package, scripts, tests, release, installer, workflow]
must_read_with: [context]
see_also: [quality, deploy, security]
---

## Scope

- [DECISION] This pillar captures repository structure and command conventions for Godpowers.

## Layout

- [DECISION] `SKILL.md` is the main installed skill entry point.
- [DECISION] `skills/` contains one slash-command skill markdown file per command.
- [DECISION] `agents/` contains specialist agent markdown files and project Pillars files.
- [DECISION] `routing/` contains command routing YAML files and `routing/recipes/` contains fuzzy-intent recipes.
- [DECISION] `workflows/` contains workflow YAML definitions used by `lib/workflow-runner.js`.
- [DECISION] `schema/` contains JSON schemas for state, events, intent, routing, recipes, workflows, and extension manifests.
- [DECISION] `lib/` contains runtime helpers for state, routing, workflow planning, artifact linting, linkage, events, locks, checkpoints, Pillars, feature awareness, repository sync, host capabilities, dogfood, extension authoring, and suite state.
- [DECISION] `scripts/` contains validation and release checks.
- [DECISION] `tests/` contains integration fixtures and workflow smoke tests.
- [DECISION] `templates/` and `references/` contain artifact scaffolds and have-nots guidance.
- [DECISION] `fixtures/dogfood/` contains deterministic messy-repo scenarios for release and autonomy readiness.

## Commands

- [DECISION] Use `npm test` for the full local suite.
- [DECISION] Use `npm run test:audit` for audit, whitespace, and documentation surface checks.
- [DECISION] Use `npm run pack:check` to verify npm package contents before release.
- [DECISION] Use `npm run release:check` for the complete release gate.

## Rules

- [DECISION] Do not add production dependencies unless the installer or runtime need them.
- [DECISION] Keep the public operation model slash-command based.
- [DECISION] Treat `bin/install.js` as the install and distribution surface, with only narrow operational helpers for status, next route, automation status, dogfood, and extension scaffolding.

## Watchouts

- [HYPOTHESIS] Package contents can regress when files are added outside the `files` allowlist in `package.json`.
- [HYPOTHESIS] Routing drift can regress direct command gates because `lib/router.js` loads `routing/*.yaml` at runtime.

<!-- godpowers:pillar-sync:begin -->
## Godpowers artifact sources

- Sync mode: proposed for review.
- Related artifact: `README.md`.
- Related artifact: `docs/reference.md`.
- Rule: keep this pillar aligned when these artifacts change durable repo truth.
<!-- godpowers:pillar-sync:end -->
