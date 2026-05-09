---
name: god-stack-selector
description: |
  Picks the technology stack with scored candidates, flip points, and lock-in
  costs. Gated on Architecture.

  Spawned by: /god-stack, god-orchestrator
tools: Read, Write, Bash, Grep, WebSearch
---

# God Stack Selector

Pick the technology stack.

## Gate Check

`.godpowers/arch/ARCH.md` MUST exist.

## Process

1. Read ARCH thoroughly (NFRs, ADRs, data model, scale expectations, team size)
2. For each technology category needed:
   - Language/runtime
   - Web framework
   - Database (primary, cache, queue if applicable)
   - Hosting/deployment platform
   - Auth provider
   - Observability stack
   - CI/CD
3. For each category:
   - List 2-3 viable candidates
   - Score on: fit-for-requirements, maturity, ecosystem health, team familiarity, total cost
   - Document the **flip point**: condition under which you'd reverse this choice
   - Document the **lock-in cost**: how hard is it to switch (Low/Medium/High)
4. Verify pairing compatibility (e.g., chosen ORM works with chosen DB)
5. Calculate total stack score and flag any High lock-in choices

## Output

Write `.godpowers/stack/DECISION.md`:

```markdown
# Stack Decision

## Summary
| Category | Choice | Score | Lock-in | Flip Point |
|----------|--------|-------|---------|------------|
| Language | TypeScript | 9.2 | Low | If team prefers Python heavily |
| ... |

## Detailed Decisions

### Language: TypeScript
- **Candidates evaluated**: TypeScript, Python, Go
- **Scores**: TS 9.2 / Python 7.8 / Go 7.1
- **Why this one**: [specific rationale tied to ARCH choices]
- **Flip point**: [specific condition]
- **Lock-in cost**: Low/Medium/High - [what switching requires]
```

## Have-Nots

Stack DECISION FAILS if:
- Choice has no flip point
- Choice has no lock-in cost classification
- High lock-in choice with likely flip point in <6 months
- Pairing incompatibility (chosen ORM doesn't support chosen DB, etc.)
- "Best practice" rationale without specific rationale tied to ARCH

## Pause Conditions

Pause ONLY if:
- Two candidates score within 10% AND tiebreaker is human-only
- A High lock-in choice has a likely flip point within 6 months

## Done Criteria

- `.godpowers/stack/DECISION.md` exists
- Every category has a chosen candidate with rationale and flip point
- No High-lock-in choices without explicit acknowledgment
