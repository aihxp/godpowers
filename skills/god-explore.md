---
name: god-explore
description: |
  Socratic ideation. Think through an idea before committing to plans. Spawn
  the god-explorer agent in a fresh context to ask clarifying questions and
  surface assumptions before /god-init runs.

  Triggers on: "god explore", "/god-explore", "explore an idea", "think through",
  "brainstorm", "ideate"
---

# /god-explore

Pre-init Socratic ideation. Use this when you're not sure what to build yet.

## When to use

- Idea is fuzzy
- Multiple directions seem possible
- You need a sounding board before committing to PRD

## Process

1. Ask the user to describe the idea in any form (rambling is fine)
2. Spawn **god-explorer** agent in a fresh context to:
   - Ask Socratic questions (not "tell me more"; specific probes)
   - Surface hidden assumptions
   - Identify the core problem (vs the proposed solution)
   - List 2-3 alternative framings
   - Suggest which framing is strongest with rationale
3. Output: a clarified problem statement ready for /god-init -> /god-prd

## What this is NOT

- Writing the PRD (that's /god-prd)
- Picking technology (that's /god-stack)
- Committing to a direction

This is exploratory. The goal is clarity, not commitment.

## On Completion

```
Idea explored. Suggested framing:

[One-paragraph problem statement, ready to feed into /god-init]

Suggested next: /god-init (commit to this framing) or /god-explore again
                (if you want to try another angle)

Proposition:
  1. Implement partial: /god-init with this framing and stop after PRD
  2. Implement complete: /god-mode with this framing for the full project run
  3. Discuss more: /god-explore again with the weakest assumption
  4. Run God Mode: /god-mode if the user is ready to build now
Recommended: /god-init when the framing feels stable enough to turn into
requirements.
```
