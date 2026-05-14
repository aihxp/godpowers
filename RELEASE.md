# Godpowers 1.0.0 Release

Date: 2026-05-14

Godpowers 1.0.0 is the public adoption freeze. The goal of this release is not
to add another layer of capability, but to stop the ground from moving so real
projects can try the system, report friction, and shape the next cycle from
evidence.

## What is stable

- 105 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Core schemas: intent, state, events, workflow, routing, recipes, extension
  manifests
- Extension pack compatibility range for the 1.x line

## What 1.0 means

Godpowers is the product users invoke. Pillars is the native project context
layer Godpowers installs, reads, and keeps current.

New projects get Godpowers-branded `AGENTS.md` protocol text, always-loaded
`agents/context.md` and `agents/repo.md`, and routed pillar files for stack,
architecture, data, API, UI, auth, quality, deploy, and observe concerns.

Existing `.godpowers` projects are Pillar-ized on resume or sync. Durable
signals from PRD, architecture, stack, roadmap, build, deploy, observe, harden,
design, and product artifacts are linked back into relevant pillars.

## Freeze policy

During the adoption freeze, do not add new command families, change schema
formats, or rename public artifacts without evidence from real use.

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

Use Godpowers on real projects and report what breaks, what feels too heavy,
what feels magical, and what needs sharper defaults. The next release train
should be shaped by those reports rather than by more speculative surface area.
