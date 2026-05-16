# Godpowers 1.6.10 Release

Date: 2026-05-16

Godpowers 1.6.10 makes progress easier to understand while work is running and
when it closes. The goal of this patch is to keep user-facing output from
requiring internal "arc" vocabulary and to show PRD, roadmap, milestone, and
completion position wherever status is reported.

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
- GSD-style proposition closeouts for exploratory, diagnostic, audit,
  lifecycle, status, reconciliation, and decision-support outputs
- Plain-language project-run wording in user-facing reports
- Planning visibility blocks for PRD, roadmap, milestone, and completion basis

## What is new

- The core Godpowers skill now defines "arc" as internal vocabulary and tells
  user-facing output to prefer "project run", "workflow", "phase", "current
  step", or "current milestone".
- `/god-mode`, `god-orchestrator`, `/god-status`, `/god-next`, and
  `/god-lifecycle` now include planning visibility guidance for PRD, roadmap,
  milestone, and percent complete when the information is available.
- The installer, session-start hook, `/god` front door, routing descriptions,
  workflow descriptions, and high-traffic skill propositions now use
  project-run language instead of unexplained "arc" wording.
- Checkpoint and session-start summaries display lifecycle `in-arc` as
  "in progress" while preserving the internal state key for compatibility.

## What 1.6.10 means

Godpowers 1.6.10 does not expand the public command surface. It changes how
Godpowers explains itself: the user should see the current project run, PRD,
roadmap, milestone, completion percentage, open items, and next action without
decoding internal terminology.

Internal workflow names and state constants such as `full-arc.yaml` and
`in-arc` remain unchanged for compatibility. Visible reports should translate
them to plain language.

Safe sync and unresolved Critical harden findings remain release-truth gates.
Per-repo Quarterback ownership remains intact for Mode D suite work.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.10` git tag points to the release commit that matches the npm
`godpowers@1.6.10` package. Public publishes should prefer the tag-triggered
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
