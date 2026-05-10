# Stack Decision Anatomy

## Per-category structure

For each technology category:

```
### [Category]: [Chosen Technology]

**Candidates**: A, B, C
**Scores**: A 9.2 / B 7.8 / C 6.5
**Why this one**: [specific to ARCH NFRs]
**Flip point**: [condition under which we reverse]
**Lock-in cost**: Low / Medium / High
**What switching requires**: [concrete description]
```

## Worked example

### Language: TypeScript

**Candidates**: TypeScript, Python, Go
**Scores**: TS 9.2 / Python 7.8 / Go 7.1

**Why TypeScript**:
- Frontend is React (TS already in stack)
- Team has TS experience
- Type safety reduces post-deploy bug rate per PRD NFR (95% reduction in
  runtime type errors vs JavaScript baseline; team's last project)

**Flip point**: If we add a service that needs sub-millisecond p99 latency
or hot-path performance (e.g., a real-time analytics engine), evaluate Go
or Rust for that service specifically. Don't migrate the whole stack.

**Lock-in cost**: Medium
- Switching the API to Python would require rewriting the data access layer
  and validation library. Estimated 4-6 weeks for a single engineer.
- Lower if we keep an abstraction layer between web framework and business logic.

## Pairing checks

Verify chosen technologies work together:

- TypeScript + Express + Prisma: yes (Prisma has first-class TS support)
- Postgres + Prisma: yes (Prisma supports Postgres natively)
- BullMQ + Redis: yes (BullMQ requires Redis; we have it)

Flag mismatches:
- ChosenORM doesn't support ChosenDB: blocker
- Library X requires Node 16, but we chose Node 20: minor (verify upgrade path)

## High lock-in watch list

Choices marked "High" lock-in with flip points <6 months away:

| Choice | Lock-in | Likely flip | Mitigation |
|--------|---------|-------------|------------|
| Vercel for hosting | High | If we hit Vercel's scale tier limits | Maintain Dockerfile so we can leave |

If a high-lock-in choice has no mitigation, that's a have-not (S-04).
