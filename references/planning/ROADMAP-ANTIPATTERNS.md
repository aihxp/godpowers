# ROADMAP Antipatterns

> Common ways roadmaps fail. Each has a sample, why it fails, and the fix.

## 1. The Date-Hopeful Roadmap

**Sample**: "M-1: Auth — early Q3"

**Why it fails**: "Early Q3" is not a gate, not a date, not a measurable
state. The team treats it as soft, slippage compounds, and by mid-Q3 the
milestone is "in progress" with no ship date.

**Fix**: Replace dates with gates. "M-1 ships when integration tests pass
on the staging environment with two beta accounts active for 7 consecutive
days." The gate is the milestone, not the date.

## 2. The Featurelist Roadmap

**Sample**:
- M-1: Auth, profile pages, settings, password reset
- M-2: Dashboard, charts, exports, sharing

**Why it fails**: Each milestone bundles unrelated features. There is no
shippable subset; users get nothing until the whole bag arrives. Slippage
on one item delays everything.

**Fix**: Each milestone must produce a thin vertical slice that delivers
real user value. M-1 = "user can sign up and see one chart." M-2 = "user
can share that chart." Each milestone ships independently.

## 3. The Phantom Gate

**Sample**: "M-2 gate: integration tests pass."

**Why it fails**: "Integration tests pass" is mechanical but vague. Which
tests? Against what data? In what environment? Writing the gate this way
makes it un-falsifiable.

**Fix**: Specify the gate concretely. "M-2 gate: the regression suite of
50 real CI logs identifies the right line in 95% of cases, run against
the M-2 build on the production CI runner."

## 4. The Reordering Trap

**Sample**: M-1 marked "done" but the gate criterion was relaxed mid-sprint.

**Why it fails**: A milestone that closed without meeting its original
gate is technical debt disguised as progress. The team moves on; the
unmet gate becomes invisible.

**Fix**: Treat gate changes as milestone changes. If the gate must move,
the milestone gets a new ID (M-1.1) and the old one is documented as
"closed with relaxed gate, see ADR-XXX." The original gate is preserved
for honesty.

## 5. The Phase-as-Milestone

**Sample**:
- M-1: Planning (4 weeks)
- M-2: Building (8 weeks)
- M-3: Shipping (2 weeks)

**Why it fails**: This is a Gantt chart, not a roadmap. Phases group
activities, not outcomes. Tracking against phases tells you how much
time elapsed, not what shipped.

**Fix**: Milestones are user-facing outcomes. "M-1: First account synced
end-to-end." "M-2: Dashboard reads cache, p99 under 800ms." Time
spent is incidental.

## 6. The Roadmap Without Reverse Direction

**Sample**: Each milestone lists what to build but never what to remove,
deprecate, or migrate.

**Why it fails**: Software accretes; only deletes shrink it. A roadmap
that only adds eventually becomes the source of complexity.

**Fix**: At least one milestone per quarter has a "remove" item. M-N:
"Remove the legacy v1 export path; users on v1 emails since Jan are
migrated to v2." Roadmap = what we ship + what we sunset.

## 7. The Empty Changelog

**Sample**: ROADMAP.md exists; the Changelog table at the bottom is
empty or has a single entry from project start.

**Why it fails**: Roadmaps drift. Milestones get added, removed, reordered.
No log = no honesty about why. New team members read the current roadmap
as if it were the original plan.

**Fix**: Every roadmap edit appends a changelog row with date, change,
reason. `2026-06-15 | Moved M-3 ahead of M-2 | Beta users blocked on
digest delivery, dashboard can wait`.
