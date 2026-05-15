# Godpowers 1.6.0 Release

Date: 2026-05-15

Godpowers 1.6.0 adds domain precision. The goal of this release is to keep
project language sharp before it becomes product scope, system shape, delivery
sequence, stack rationale, documentation, or linted artifact text.

## What is stable

- 106 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Core schemas: intent, state, events, workflow, routing, recipes, extension
  manifests
- Extension pack compatibility range for the 1.x line

## What is new

- `/god-discuss` now performs domain grilling during next-phase scoping.
- `.godpowers/domain/GLOSSARY.md` records canonical terms, avoided aliases,
  relationships, example dialogue, source notes, and flagged ambiguities.
- `templates/DOMAIN-GLOSSARY.md` provides the native glossary shape.
- `god-explorer` inspects code or docs before asking the user when repo
  evidence can answer a domain question.
- PM, architect, roadmapper, stack selector, and docs writer agents now read
  `.godpowers/domain/GLOSSARY.md` when present.
- `/god-lint` now recognizes domain glossary artifacts and reports DG-01
  through DG-05 findings.
- Architecture guidance now creates ADRs only when a decision is hard to
  reverse, surprising without context, and based on a real tradeoff.

## What 1.6 means

Godpowers now has a native vocabulary layer that supports planning without
creating a competing source of truth. The domain glossary is preparation
context. PRD, ARCH, ROADMAP, STACK, docs, and Pillars files still carry the
durable decisions for their own domains.

The glossary helps agents converge on exact project language before they write
load-bearing artifacts. It is especially useful for brownfield and bluefield
projects where existing docs, code names, org vocabulary, and user intent can
use the same word for different things.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.0` git tag points to the release commit that matches the npm
`godpowers@1.6.0` package. Future public publishes should prefer the
tag-triggered GitHub workflow so npm provenance, git history, and release notes
stay aligned.

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

Use `/god-discuss` before a PRD, feature, refactor, or migration where terms
feel fuzzy. Report where the glossary catches ambiguity early, where it adds
noise, and which domain checks should become stricter.
