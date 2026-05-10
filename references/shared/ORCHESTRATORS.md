# Composing with Other Orchestrators

> Godpowers is one of several skill-based AI dev tools. Here's how it
> composes with the others, what's safe to combine, and what conflicts.

## GSD (Get Shit Done)

**Relationship**: complementary

**Composition pattern**: GSD owns `.planning/`, Godpowers owns `.godpowers/`.
They don't compete for state directories. You can have both installed.

**When to use which**:
- GSD: longer-form planning, knowledge graphs, multi-phase milestones
- Godpowers: artifact-discipline workflows, lifecycle-aware steady state

**Migration**: Godpowers can read .planning/ as source for /god-init in
Mode B (gap-fill). Reverse migration (Godpowers -> GSD) by treating the
roadmap milestones as GSD phases.

**On conflict**: pick one for any given workflow. Don't run /god-build and
/gsd-execute-phase concurrently on the same code.

## Superpowers

**Relationship**: stack (orthogonal)

**Composition pattern**: Superpowers shapes how the agent reasons (TDD,
two-stage review, verification before completion). Godpowers shapes what
artifacts the session produces. They don't overlap.

**When to use both**: Superpowers' auto-triggering ensures discipline at
the agent level; Godpowers' workflows ensure structure at the session level.

**Status**: Godpowers already incorporates Superpowers' core ideas (TDD,
two-stage review, substitution test). If you have both installed, expect
some redundancy in messages.

## BMAD Method

**Relationship**: alternative for planning, complementary for execution

**Composition pattern**: BMAD has heavier methodology framework (sprints,
ceremonies, multi-team coordination). Godpowers is lighter and skill-only.

**When to use which**:
- BMAD: 5+ engineer team, formal agile cadence, regulated industry
- Godpowers: solo founder or small team, faster iteration, lighter ceremony

**Migration**: BMAD's PRD format is compatible with Godpowers' substitution
test if you tag sentences. /god-init Mode B can read BMAD artifacts.

**On conflict**: pick one for planning. Mixing creates duplicate state.

## arc-ready

**Relationship**: ancestor

**Composition pattern**: Godpowers extends arc-ready's artifact discipline
(have-nots, substitution test, three-label test, tier gating) into a
skill-based architecture with multiple workflows.

**When to use which**:
- arc-ready: you want a single SKILL.md with all the discipline
- Godpowers: you want granular slash commands and multiple workflow types

**Migration**: arc-ready's `.<tier>-ready/` paths are compatible. /god-init
Mode B reads them and maps to Godpowers' `.godpowers/<tier>/` structure.

## General coexistence rules

1. **One state directory per project**. Don't run multiple orchestrators
   on the same `.godpowers/` (or `.planning/`).

2. **Skills can coexist in `~/.claude/skills/`**. The AI tool routes by
   description match. Multiple `/god-*` and `/gsd-*` and others all work.

3. **Don't mix recovery commands**. `/god-undo` reverts Godpowers state;
   `/gsd-undo` reverts GSD state. Running both on the same project
   causes drift.

4. **Hooks are per-tool**. SessionStart hooks from Godpowers and GSD
   coexist in `~/.claude/hooks/`. They run sequentially.

5. **Resolve conflicts by tool boundary**. If Godpowers says X and GSD
   says Y, follow whichever owns the relevant state directory.
