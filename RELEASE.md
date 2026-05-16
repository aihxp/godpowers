# Godpowers 1.6.6 Release

Date: 2026-05-16

Godpowers 1.6.6 extends transcript-safe spawn handling beyond `/god-mode`.
The goal of this patch is to keep Codex-visible spawn messages small and safe
for `/god-init` and Mode D suite coordination while preserving the same
orchestrator and coordinator behavior.

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

- `/god-init` now writes detailed initialization context to
  `.godpowers/runs/<run-id>/INIT-ORCHESTRATOR-HANDOFF.md` before spawning
  `god-orchestrator`.
- `/god-suite-init`, `/god-suite-release`, and `/god-suite-patch` now write
  suite coordination context to
  `.godpowers/runs/<run-id>/COORDINATOR-HANDOFF.md` before spawning
  `god-coordinator`.
- `god-coordinator` now writes per-repo orchestrator context to
  `.godpowers/runs/<run-id>/COORDINATOR-ORCHESTRATOR-HANDOFF.md` before
  spawning a target repo's `god-orchestrator`.
- `god-orchestrator` now treats handoff files as a general caller protocol,
  not only as a `/god-mode` protocol.
- `/god-hygiene` routing no longer lists `god-orchestrator` as a secondary
  spawn because the skill only runs artifact, dependency, and documentation
  audits.

## What 1.6.6 means

Godpowers 1.6.6 does not expand the public command surface. It fixes more
Codex spawn integration paths so the right agent is still started, but the host
UI only sees a small pointer to disk state instead of raw project description,
suite metadata, release notes, patch directives, dependency graphs, routing
rules, or local-file details.

Safe sync and unresolved Critical harden findings remain release-truth gates.
Per-repo Quarterback ownership remains intact for Mode D suite work.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.6` git tag points to the release commit that matches the npm
`godpowers@1.6.6` package. Public publishes should prefer the tag-triggered
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
