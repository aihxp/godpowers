# Godpowers 1.5.0 Release

Date: 2026-05-14

Godpowers 1.5.0 adds preflight intake for brownfield and bluefield projects.
The goal of this release is to make Godpowers safer before it applies arc-ready,
pillars, archaeology, reconstruction, or refactor work to codebases with prior
context.

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

- `/god-preflight` performs a read-only intake audit and writes
  `.godpowers/preflight/PREFLIGHT.md`.
- Brownfield arcs now run preflight before archaeology, reconstruction, tech
  debt, and artifact audit.
- Bluefield arcs now capture org context, then run preflight before the
  constrained arc begins.
- `/god-mode --yolo` runs preflight automatically for brownfield and bluefield,
  follows the safest recommended route, and logs the route choice to
  `.godpowers/YOLO-DECISIONS.md`.
- Greenfield arcs still skip preflight unless the user explicitly asks for it.

## What 1.5 means

Godpowers is the product users invoke. Pillars is the native project context
layer Godpowers installs, reads, and keeps current.

New projects get Godpowers-branded `AGENTS.md` protocol text, always-loaded
`agents/context.md` and `agents/repo.md`, and routed pillar files for stack,
architecture, data, API, UI, auth, quality, deploy, and observe concerns.

Existing `.godpowers` projects are Pillar-ized on resume or sync. Durable
signals from PRD, architecture, stack, roadmap, build, deploy, observe, harden,
design, and product artifacts are linked back into relevant pillars.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

Allowed changes:

- Critical bug fixes
- Documentation clarity
- Test coverage for frozen behavior
- Compatibility fixes for supported AI coding tools
- Small fixes that make existing 1.0 behavior work as documented

Deferred changes:

- New lifecycle phases
- New schema versions
- Pillars format changes
- Major routing semantics
- Large extension API changes

## Adoption ask

Use Godpowers on brownfield, bluefield, and greenfield projects and report what
the preflight pass gets right, what it overstates, and where the safest next
route needs sharper defaults.
