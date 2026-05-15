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

Pre-planning Socratic discussion with domain grilling.

## When to use

- Before /god-feature: scope the feature with the user
- Before /god-refactor: clarify what's changing
- Before /god-upgrade: nail down the migration target
- Generally: any time the next command's input is fuzzy

## Process

Spawn god-explorer in fresh context with focus="next-phase-scoping".

The agent:
1. Reads the active workflow context
2. Reads `.godpowers/domain/GLOSSARY.md` if it exists
3. Asks targeted questions one at a time, with a recommended answer for each
4. Explores the codebase instead of asking when repo evidence can answer
5. Challenges vague, overloaded, or conflicting terms against the glossary
6. Stress-tests domain relationships with concrete scenarios and edge cases
7. Surfaces 2-3 hidden assumptions
8. Identifies what's [DECISION] vs [HYPOTHESIS] vs [OPEN QUESTION]
9. Drafts a brief in `.godpowers/discussions/<topic>.md`
10. Updates `.godpowers/domain/GLOSSARY.md` when a term or ambiguity is resolved

The brief and glossary get passed to the next planning command. The glossary is
preparation context, not a replacement for PRD, ARCH, ROADMAP, STACK, or Pillars
files.

## Domain Glossary Rules

- Create `.godpowers/domain/GLOSSARY.md` lazily from `templates/DOMAIN-GLOSSARY.md`
  only when the discussion resolves the first project-specific term.
- Keep `.godpowers/domain/GLOSSARY.md` free of implementation details.
- Use the glossary for canonical terms, avoided aliases, relationships, example
  dialogue, flagged ambiguities, and source notes.
- When the user uses a term that conflicts with the glossary, call out the
  conflict immediately and ask which meaning should win.
- When the user uses a fuzzy term, propose a precise canonical term and the
  avoided aliases.
- Offer ADRs only when all three are true: the decision is hard to reverse, a
  future reader would find it surprising without context, and the choice came
  from a real tradeoff.

## Output

```
Discussion complete: .godpowers/discussions/<topic>.md
Domain glossary: .godpowers/domain/GLOSSARY.md (created or updated if terms resolved)

Key findings:
  - [assumption surfaced]
  - [open question that needs human decision]
  - [term or ambiguity resolved]

Suggested next: [the planning command this discussion was for]
```
