# Godpowers 1.6.5 Release

Date: 2026-05-16

Godpowers 1.6.5 keeps the stable 1.6 surface while fixing Codex God Mode
transcript hygiene. The goal of this patch is to make `god-orchestrator`
spawn correctly from `/god-mode` and `/god-mode --yolo` without exposing the
detailed orchestration payload in the visible transcript.

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

- `/god-mode` now writes detailed orchestration context to
  `.godpowers/runs/<run-id>/ORCHESTRATOR-HANDOFF.md`.
- `/god-mode` now spawns `god-orchestrator` with only a display-safe project
  root, flags, and handoff file path.
- `god-orchestrator` now knows to read the handoff file before planning,
  spawning, or mutating project state.
- `god-orchestrator` now treats handoff contents as private orchestration
  context and keeps them out of the visible transcript.
- Agent validation and smoke tests now inspect `agents/god-*.md` specialist
  files while allowing Pillars context files like `agents/context.md` and
  `agents/repo.md` to coexist.

## What 1.6.5 means

Godpowers 1.6.5 does not expand the public command surface. It fixes the Codex
spawn integration path so the right specialist agent is still started, but the
host UI only sees a small pointer to disk state instead of raw checkpoint,
routing, and local-file details.

Safe sync and unresolved Critical harden findings remain release-truth gates.
`--yolo` can still auto-pick defaults, but it cannot bypass those blockers.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.5` git tag points to the release commit that matches the npm
`godpowers@1.6.5` package. Public publishes should prefer the tag-triggered
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
