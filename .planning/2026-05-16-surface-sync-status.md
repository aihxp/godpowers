# 2026-05-16 Surface Sync Status

## Scope

- [DECISION] This note records the current status of `.github/workflows`, `.planning`, and `agents` after the 1.6.22 autonomy and documentation-sync work.
- [DECISION] Older `.planning` files are historical audit and dogfood records. They should not be rewritten to pretend their May 10 findings already knew later runtime features.
- [DECISION] Current repository-facing truth lives in runtime helpers, root documentation, schemas, workflows, and agent contracts.

## Workflow Status

- [DECISION] `.github/workflows/ci.yml` runs the full test matrix and the Node 20 release gate.
- [DECISION] `.github/workflows/publish.yml` runs `npm run release:check` before npm publish with provenance.
- [DECISION] `.github/workflows/publish-pack.yml` runs `npm run release:check` before first-party extension pack publish.
- [DECISION] Local helper jobs remain explicit in workflow metadata so repo-doc sync, repo-surface sync, host capability checks, source sync-back, and checkpoint sync stay visible to users.

## Agent Status

- [DECISION] `agents/context.md` reflects package version 1.6.22 and the 110 command public surface.
- [DECISION] `agents/arch.md`, `agents/repo.md`, `agents/deploy.md`, `agents/quality.md`, `agents/observe.md`, and `agents/security.md` now describe the local helper surface added around feature awareness, repository sync, host guarantees, dogfood, extension authoring, and release gates.
- [DECISION] `agents/god-orchestrator.md` now points dashboard closeouts at `lib/dashboard.js` and includes action brief, host guarantee, repo surface, and dogfood status lines.
- [DECISION] `agents/god-updater.md` now treats repo-doc sync, repo-surface sync, feature awareness, source-system sync-back, host capability checks, dashboard refresh, checkpoint sync, Pillars sync, and context refresh as part of closeout.
- [DECISION] `agents/god-reconciler.md` now checks repository documentation, repository surface, runtime feature awareness, source-system sync-back, and host capability alongside PRD, ARCH, ROADMAP, STACK, DEPLOY, OBSERVE, HARDEN, LAUNCH, and capture artifacts.

## Planning Status

- [DECISION] `.planning/dogfood-001-results.md` and `.planning/dogfood-002-results.md` remain historical evidence of earlier validation cycles.
- [DECISION] `.planning/2026-05-10-*.md` files remain historical planning records. New current-state updates should be additive notes like this file.
- [HYPOTHESIS] The next useful planning document is a real messy-repo dogfood run against an external project, because the synthetic and self-dogfood cycles already covered the known internal paths.

## Remaining Watchouts

- [HYPOTHESIS] Host guarantee behavior can still vary across AI tools, so dashboard output must keep showing full, degraded, or unknown rather than implying universal runtime guarantees.
- [HYPOTHESIS] External extension authoring and Mode D suite releases still need more real maintainer use before they should be treated as fully proven.
- [OPEN QUESTION] Which external messy repository should be the first 1.6.22 adoption canary? Owner: maintainer. Due: before the next release.
