# Tutorial: Your First Project

A complete walkthrough from install to deployed product.

## Setup (1 minute)

```bash
mkdir my-saas && cd my-saas
git init
npx godpowers --claude --global
```

Open Claude Code in `my-saas/`.

## The one-shot path (autonomous)

```
/god-mode
```

Claude asks what you want to build. Sample answer:
> A SaaS for solo founders to track their MRR breakdown by new/expansion/churn.
> Connect Stripe, see a dashboard. Solo, no team auth. Web only.

Claude detects:
- Mode: A (greenfield)
- Scale: medium

Then runs the full arc. About 10 pauses across the run for genuine
human-only decisions (TypeScript vs Python tied at 9.2/9.0; team prefer
TypeScript? "go").

When done:
- Working app in `src/`
- Tests in `tests/`
- Deploy pipeline in `.github/workflows/`
- Observability config
- Security audit clean
- Launch artifacts ready

Total time: ~2-3 hours of autonomous work, plus a few minutes of pauses.

## The granular path (more control)

If you want to drive each step:

### Day 1: Plan

```
/god-init      <- Detects mode and scale, creates .godpowers/
/god-prd       <- Writes the PRD. Pauses to clarify target user.
/god-arch      <- Designs system. Pauses on monolith vs services.
/god-roadmap   <- Sequences milestones.
/god-stack     <- Picks technology. Pauses on TS vs Python tie.
```

After day 1: planning artifacts on disk. Review them. Edit if needed.

### Day 2-3: Build

```
/god-repo      <- Scaffolds the repo: package.json, CI, lint, README
/god-build     <- Plans slices, executes per wave with TDD + reviews
```

`/god-build` is the heaviest. Plans the milestone, runs slices in parallel
waves, each with TDD and two-stage review.

You'll see commits land one slice at a time. Each has a clean message.

### Day 4: Ship

```
/god-deploy    <- Sets up deploy pipeline
/god-observe   <- Wires SLOs and alerts
/god-harden    <- OWASP review (BLOCKS launch on Criticals)
/god-launch    <- Launch copy + runbook (only if harden passes)
```

After day 4: live in production.

### Day 5+: Steady state

Use ongoing workflows:
- `/god-feature` for new features
- `/god-update-deps` weekly for security
- `/god-hygiene` monthly for health check

## What if things go wrong?

```
/god-status         <- See current state from disk
/god-doctor         <- Diagnose install or state issues
/god-undo           <- Revert last operation
/god-rollback prd   <- Walk back the PRD and downstream
/god-restore        <- Recover from .trash
```

State is always on disk. Resume any time by re-opening the directory.

## What if you mess up the PRD?

```
/god-redo prd
```

Re-runs PRD and marks downstream tiers as in-flight (since they consumed
the old PRD). You'll re-run /god-arch etc. with the new PRD.

## What if you want to skip a tier?

```
/god-skip launch --reason "private internal tool, no public launch"
```

Marks launch as explicitly skipped with audit trail.

## Don't want to think about which command?

```
/god-next
```

Reads disk state, suggests the right next command. Or just type what you
want in plain English; /god-next routes via keyword matching.

## When you're done with a feature

After your feature ships:
```
/god-extract-learnings
```

Captures decisions, lessons, surprises to `.godpowers/learnings/`.
Useful institutional knowledge for future projects.

## When something breaks in prod

```
/god-hotfix
```

Runs: debug -> regression test -> minimal fix -> compressed review ->
expedited deploy -> verify in prod -> schedules /god-postmortem within 48h.

## A week later: incident review

```
/god-postmortem
```

Builds timeline, identifies root cause AND class-of-bug, drafts blameless
action items with owners and due dates, updates runbooks.

## Done. What now?

Repeat the cycle. Add features. Hot-fix when needed. Run /god-hygiene
monthly. Run /god-audit before milestones.

Your `.godpowers/` directory becomes the institutional memory of your
product. Every decision, every artifact, every run, every learning, on
disk, queryable, traceable.
