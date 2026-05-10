# Build Waves

> Independent slices run in parallel within a wave. Waves run sequentially.
> Maximizes throughput; minimizes context rot.

## Detection

Two slices can be in the same wave if:
- They modify different files (no merge conflicts)
- They don't depend on each other's output
- Neither needs the other's data

## Worked example

Milestone: User can see MRR breakdown.

### Slice plan

| Slice | Files | Depends on |
|-------|-------|------------|
| 1.1 Signup | src/auth/signup.ts | none |
| 1.2 Login | src/auth/login.ts | 1.1 |
| 1.3 Stripe OAuth | src/auth/stripe-*.ts, src/db/stripe_accounts | 1.1, 1.2 |
| 1.4 Stripe sync worker | src/worker/stripe-sync.ts | 1.3 |
| 1.5 MRR query API | src/api/mrr.ts | 1.3, 1.4 |
| 1.6 Dashboard UI | src/components/Dashboard.tsx | 1.5 |

### Wave grouping

- Wave 1: Slice 1.1 (no dependencies)
- Wave 2: Slice 1.2 (depends on 1.1)
- Wave 3: Slice 1.3 (depends on 1.1, 1.2)
- Wave 4: Slice 1.4 + Slice 1.5 (parallel; 1.4 worker writes, 1.5 API reads, but different files)
- Wave 5: Slice 1.6 (depends on 1.5)

In Wave 4, two agents work in parallel on different files. Each gets fresh
context. Each enforces TDD. Each goes through two-stage review independently.

## Anti-patterns

### Wave too wide
Putting 10 parallel slices in one wave. Even if technically independent,
review and integration become coordination heavy.

**Rule of thumb**: max 3-4 parallel slices per wave.

### Hidden cross-wave dependency
Slice 4.1 thinks it's independent but actually reads a config file that
Slice 4.2 modifies. Race condition.

**Fix**: spell out READ dependencies, not just WRITE dependencies.

### Sequential when parallel-safe
Putting Slice X and Slice Y in different waves when they're actually
independent.

**Cost**: wasted wall-clock time. Each agent runs serially when they could
run in parallel.

**Fix**: at planning time, look hard for shared file modifications. If none,
parallelize.
