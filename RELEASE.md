# Godpowers 1.6.9 Release

Date: 2026-05-16

Godpowers 1.6.9 makes proposal and report outputs easier to act on. The goal of
this patch is to keep Godpowers from ending a recommendation, audit, lifecycle
report, status report, or exploratory answer without offering concrete next
moves.

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

## What is new

- The core Godpowers skill now requires a `Proposition:` block after
  recommendations, proposals, exploratory plans, diagnostics, status reports,
  audits, lifecycle reports, reconciliations, and decision-support answers
  when no command was launched.
- `/god`, `/god-next`, `/god-status`, `/god-lifecycle`, `/god-locate`,
  `/god-context-scan`, `/god-preflight`, `/god-doctor`, `/god-audit`,
  `/god-hygiene`, `/god-standards`, and `/god-agent-audit` now close with
  concrete next choices.
- Planning and analysis commands such as `/god-discuss`, `/god-explore`,
  `/god-list-assumptions`, `/god-refactor`, `/god-spike`, `/god-tech-debt`,
  `/god-archaeology`, `/god-map-codebase`, `/god-reconstruct`,
  `/god-design-impact`, `/god-reconcile`, and `/god-roadmap-check` now make
  their next move explicit.
- Proposition blocks separate partial implementation, full implementation,
  discussion, status inspection, and `/god-mode` continuation when safe.

## What 1.6.9 means

Godpowers 1.6.9 does not expand the public command surface. It changes how
Godpowers exits proposal-like work: the user should see useful routes forward
instead of only a recommendation.

Pure completion commands can still end with a normal `Suggested next` line when
an artifact was actually produced. Proposal, diagnostic, audit, lifecycle,
status, and decision-support commands must offer a proposition block.

Safe sync and unresolved Critical harden findings remain release-truth gates.
Per-repo Quarterback ownership remains intact for Mode D suite work.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.9` git tag points to the release commit that matches the npm
`godpowers@1.6.9` package. Public publishes should prefer the tag-triggered
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
