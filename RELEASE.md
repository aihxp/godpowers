# Godpowers 1.6.2 Release

Date: 2026-05-16

Godpowers 1.6.2 hardens Codex agent integration around the stable 1.6 domain
precision release. The goal of this patch is to make every installed
Godpowers specialist agent spawnable in Codex sessions that require per-agent
metadata, without changing the public command surface.

## What is stable

- 106 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- Codex installs with 39 generated `god-*.toml` agent metadata files
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Core schemas: intent, state, events, workflow, routing, recipes, extension
  manifests
- Extension pack compatibility range for the 1.x line
- Domain precision through `.godpowers/domain/GLOSSARY.md` and DG-01 through
  DG-05 checks

## What is new

- Codex runtime support now declares an `agentMetadata: "toml"` capability in
  the installer.
- Codex installs generate a matching TOML metadata file for every
  `agents/god-*.md` source file.
- Codex metadata includes agent name, description, workspace-write sandbox
  mode, and developer instructions derived from the markdown agent spec.
- Install smoke tests now verify all 39 Codex metadata files, plus
  runtime-specific install surfaces for all 15 supported runtimes.
- Claude Code, Pi, and the other non-Codex runtimes keep their existing
  markdown agent install behavior.

## What 1.6.2 means

Godpowers 1.6.2 does not expand the public command surface. It tightens the
runtime compatibility path so the installed Codex agent registry can see the
same Godpowers agents already shipped in `agents/*.md`.

The domain glossary remains preparation context. PRD, ARCH, ROADMAP, STACK,
docs, and Pillars files still carry durable decisions for their own domains.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.2` git tag points to the release commit that matches the npm
`godpowers@1.6.2` package. Public publishes should prefer the tag-triggered
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
