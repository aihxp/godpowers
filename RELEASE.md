# Godpowers 1.6.8 Release

Date: 2026-05-16

Godpowers 1.6.8 keeps shipping work moving when a deployed staging URL is not
ready yet. The goal of this patch is to finish local and CI-verifiable deploy,
observe, harden, and launch gates first, then ask for `STAGING_APP_URL` only
when the user requests staging or reaches final sign-off.

## What is stable

- 106 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- Codex installs with 39 generated `god-*.toml` agent metadata files
- Safe-sync routing before deploy, observe, harden, launch, or god-mode work
- Critical harden finding gate before launch
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Core schemas: intent, state, events, workflow, routing, recipes, extension
  manifests
- Extension pack compatibility range for the 1.x line
- Domain precision through `.godpowers/domain/GLOSSARY.md` and DG-01 through
  DG-05 checks

## What is new

- `god-orchestrator` now documents staging URL deferral as the default shipping
  closure policy.
- `/god-mode`, `/god-deploy`, and `/god-launch` now continue through local and
  CI-verifiable gates when no live deployed origin is evidenced.
- `god-deploy-engineer`, `god-observability-engineer`, and
  `god-launch-strategist` now treat missing deployed staging as deferred unless
  the user explicitly requested staging.
- Missing deployed access is recorded in
  `.godpowers/deploy/WAITING-FOR-EXTERNAL-ACCESS.md` with the exact command to
  run later.
- At final sign-off, Godpowers offers three clear choices: provide
  `STAGING_APP_URL=<deployed staging origin>`, sign off local-only with
  deployed verification deferred, or run `/god-deploy --stage` later.

## What 1.6.8 means

Godpowers 1.6.8 does not expand the public command surface. It changes when
staging access is requested: not during ordinary mid-arc progress, but at an
explicit staging request, deployed verification command, or final project
sign-off.

The release keeps the no-guessed-domain rule intact. Godpowers must not invent
a staging URL from a product name, brand name, README title, or common TLD.
If only local URLs exist, it runs local smoke, records deployed verification as
deferred, and continues.

Safe sync and unresolved Critical harden findings remain release-truth gates.
Per-repo Quarterback ownership remains intact for Mode D suite work.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.8` git tag points to the release commit that matches the npm
`godpowers@1.6.8` package. Public publishes should prefer the tag-triggered
GitHub workflow so npm provenance, git history, and release notes stay aligned.

Allowed changes:

- Critical bug fixes
- Documentation clarity
- Test coverage for frozen behavior
- Compatibility fixes for supported AI coding tools
- Small fixes that make existing 1.x behavior work as documented

Deferred changes:

- New lifecycle phases
- New schema versions
- Pillars format changes
- Major routing semantics
- Large extension API changes

## Adoption ask

Run `npm run release:check` before publishing changes. Report any release path
step that still depends on memory, manual inspection, or local machine state.
