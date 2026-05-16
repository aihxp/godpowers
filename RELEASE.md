# Godpowers 1.6.7 Release

Date: 2026-05-16

Godpowers 1.6.7 makes the live workflow easier to track. The goal of this
patch is to answer "what is Godpowers doing, how far along is it, what just
happened, and what happens next" from disk state.

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

- `lib/state.progressSummary` computes percentage complete, completed step
  count, total step count, current step number, and current tier/sub-step from
  `state.json`.
- `CHECKPOINT.md` can persist progress frontmatter and now includes
  "What happened recently" and "What happens next" sections.
- `god-orchestrator` now has a Step Narration Protocol for compact
  "Next step" and "Step result" cards around visible tier/sub-step work.
- `/god-mode`, `/god-next`, `/god-status`, and `/god-locate` now document
  progress, path-ahead, recent-work, and next-action summaries.
- `templates/PROGRESS.md` now includes a current step plan and recent step
  result shape.
- Package publication now allowlists `agents/god-*.md`, preventing local
  Pillars files under `agents/` from entering the npm payload.
- Package contents checks now fail if non-specialist files under `agents/`
  would be published.
- `AGENTS.md` now includes the Pillars Protocol for loading durable project
  context and workflow-state files.
- Installer local mode now resolves runtime destinations under the current
  directory and installs only `god-*.md` specialist agent files.

## What 1.6.7 means

Godpowers 1.6.7 does not expand the public command surface. It makes the
existing arc more legible by showing a disk-derived progress report, a short
plan before visible work starts, and a short result after work completes or
pauses.

The release also tightens npm packaging around specialist agents. Local
project Pillars can live under `agents/` during development, but only
`agents/god-*.md` files are packaged as Godpowers specialist agents.

Safe sync and unresolved Critical harden findings remain release-truth gates.
Per-repo Quarterback ownership remains intact for Mode D suite work.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.7` git tag points to the release commit that matches the npm
`godpowers@1.6.7` package. Public publishes should prefer the tag-triggered
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
