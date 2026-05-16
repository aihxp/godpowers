---
name: god-list-assumptions
description: |
  Surface Claude's assumptions about a phase approach before planning.
  Lists what's being taken for granted so the user can flag wrong ones
  before they cement into decisions.

  Triggers on: "god list assumptions", "/god-list-assumptions", "what assumptions",
  "what are you assuming"
---

# /god-list-assumptions

Surface assumptions before they harden into decisions.

## When to use

- Before /god-feature: what's Claude assuming about the existing system?
- Before /god-build: what's Claude assuming about the user's preferences?
- Before /god-upgrade: what's Claude assuming about current state?

## Process

1. Read the active context (what command is queued, what artifacts exist)
2. Spawn god-explorer in fresh context with focus="assumptions-only":
   - List 5-10 assumptions you're operating under
   - Tag each: [HIGH-CONFIDENCE] / [MEDIUM] / [LOW-CONFIDENCE]
   - For [LOW-CONFIDENCE]: flag explicitly for user verification
3. Present to user; ask which (if any) are wrong

## Output

```
Assumptions Claude is operating under:

[HIGH-CONFIDENCE]
1. The existing codebase uses TypeScript (verified: package.json)
2. Tests live in tests/ directory (verified: filesystem)

[MEDIUM]
3. The team has experience with React (inferred from existing code)
4. Production runs on Node 20 (inferred from .nvmrc)

[LOW-CONFIDENCE]
5. The team prefers monolith over microservices (no evidence either way)
6. The product target is B2C (no PRD specifies)

Any of these wrong? Flag them now before they cement into decisions.
```

## Proposition Closeout

After listing assumptions, end with a proposition block:

```
Proposition:
  1. Implement partial: correct or confirm the low-confidence assumptions only
  2. Implement complete: confirm assumptions and continue to [queued command]
  3. Discuss more: /god-discuss assumptions before planning
  4. Inspect status: /god-status to re-ground before deciding
Recommended: [one option and why]
```

## Have-Nots

- Assumptions are too vague to verify ("we're building a good product")
- Confidence labels missing
- Assumptions you can't articulate (always fail; if you can't list it,
  you don't know what you're assuming)
