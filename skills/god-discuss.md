---
name: god-discuss
description: |
  Adaptive Socratic discussion before planning. Surfaces hidden assumptions,
  identifies open questions, and produces a brief that gets fed into the
  next planning command. Different from /god-explore: this is for a specific
  next phase, not an open-ended idea.

  Triggers on: "god discuss", "/god-discuss", "discuss this", "think through"
---

# /god-discuss

Pre-planning Socratic discussion.

## When to use

- Before /god-feature: scope the feature with the user
- Before /god-refactor: clarify what's changing
- Before /god-upgrade: nail down the migration target
- Generally: any time the next command's input is fuzzy

## Process

Spawn god-explorer in fresh context with focus="next-phase-scoping".

The agent:
1. Reads the active workflow context
2. Asks targeted (not open-ended) questions
3. Surfaces 2-3 hidden assumptions
4. Identifies what's [DECISION] vs [HYPOTHESIS] vs [OPEN QUESTION]
5. Drafts a brief in `.godpowers/discussions/<topic>.md`

The brief gets passed to the next planning command.

## Output

```
Discussion complete: .godpowers/discussions/<topic>.md

Key findings:
  - [assumption surfaced]
  - [open question that needs human decision]

Suggested next: [the planning command this discussion was for]
```
