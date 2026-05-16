# Godpowers 1.6.3 Release

Date: 2026-05-16

Godpowers 1.6.3 hardens release-truth routing around the stable 1.6 surface.
The goal of this patch is to make `/god-next` and `/god-deploy` honor safe
sync blockers before Tier 3 work, without changing the public command surface.

## What is stable

- 106 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- Codex installs with 39 generated `god-*.toml` agent metadata files
- Safe-sync routing before deploy, observe, harden, or launch work
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Core schemas: intent, state, events, workflow, routing, recipes, extension
  manifests
- Extension pack compatibility range for the 1.x line
- Domain precision through `.godpowers/domain/GLOSSARY.md` and DG-01 through
  DG-05 checks

## What is new

- `/god-next` detects `.godpowers/sync/SAFE-SYNC-PLAN.md` and routes to
  `/god-reconcile Release Truth And Safe Sync` before `/god-deploy`.
- `/god-next` also detects checkpoint text that marks safe sync as a blocking
  red gate before deploy.
- `/god-deploy` has a `safe-sync-clear` prerequisite with the same reconcile
  route as its auto-complete command.
- Router tests now cover unresolved safe sync plans, checkpoint blockers,
  deploy prerequisite failure, and resolved safe sync plans.

## What 1.6.3 means

Godpowers 1.6.3 does not expand the public command surface. It tightens the
runtime decision path so project truth can override the structural tier order
when a safe-sync gate is still red.

The domain glossary remains preparation context. PRD, ARCH, ROADMAP, STACK,
docs, and Pillars files still carry durable decisions for their own domains.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.3` git tag points to the release commit that matches the npm
`godpowers@1.6.3` package. Public publishes should prefer the tag-triggered
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
