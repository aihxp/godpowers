---
name: god-build
description: |
  Build the project. Spawns god-planner first, then god-executor agents in
  parallel waves with TDD enforcement and two-stage review. Each slice
  commit is gated on god-spec-reviewer and god-quality-reviewer.

  Triggers on: "god build", "/god-build", "build it", "implement", "start coding"
---

# /god-build

Orchestrate the build via specialist agents.

## Setup

1. Verify gates:
   - `.godpowers/roadmap/ROADMAP.md` exists (skip if scale is trivial)
   - `.godpowers/stack/DECISION.md` exists (skip if scale is trivial)
   - Repo is scaffolded
2. If any gate fails: tell user which command to run first

## Orchestration

### Phase 1: Plan
Spawn **god-planner** in fresh context with ROADMAP, ARCH, DECISION.
Output: `.godpowers/build/PLAN.md` with vertical slices grouped into waves.

### Phase 2: Execute Waves

For each wave in PLAN.md:

For each slice in the wave (parallel):
1. Spawn **god-executor** in fresh context with:
   - The slice plan only (not the whole PLAN.md)
   - Relevant ARCH context for this slice
   - Stack DECISION
2. Wait for executor to complete (TDD enforced)
3. Spawn **god-spec-reviewer** in fresh context (independent of executor)
   - If FAIL: return slice to god-executor with findings
   - If PASS: proceed to stage 2
4. Spawn **god-quality-reviewer** in fresh context (independent)
   - If FAIL: return slice to god-executor with findings
   - If PASS: commit the slice atomically
5. Update `.godpowers/build/STATE.md`

Move to next wave only when current wave is fully committed.

## Verification

After all waves:
1. Run full test suite. All pass.
2. Run linter. All clean.
3. Update PROGRESS.md: Build status = done

## Pause Conditions

Pause for user ONLY if:
- A requirement is genuinely ambiguous (two valid implementations)
- A test reveals a gap in PRD or ARCH that needs human resolution

## On Completion

```
Build complete: .godpowers/build/STATE.md
[N] slices delivered. [N] commits. All tests passing.

Suggested next: /god-harden (adversarial review, gates Launch)
Alternative: /god-deploy (set up deploy pipeline, parallel-safe)
Both can run; /god-harden is the critical path to Launch.
```

If more milestones remain in the roadmap, suggest re-running /god-build for
the next milestone before moving to Tier 3.
