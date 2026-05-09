---
name: god-spike
description: |
  Time-boxed research spike. Builds a minimal proof of concept to answer one
  specific technical question, documents findings, then stops. Spike code
  does NOT merge to main; it answers a question, then either gets deleted or
  rewritten cleanly in a real feature workflow.

  Triggers on: "god spike", "/god-spike", "research spike", "prototype",
  "proof of concept", "POC", "explore feasibility"
---

# /god-spike

Time-boxed research spike.

## When to use

- You have a specific technical question to answer
- A 1-day proof of concept would resolve it
- You don't want to commit to building until you know more

Examples:
- "Can our existing schema handle multi-tenancy?"
- "Will this third-party API meet our latency budget?"
- "Does the new framework let us delete the auth middleware?"

## When NOT to use

- The question is too broad ("should we use GraphQL?"): narrow it first via
  /god-explore
- You already know the answer: just /god-feature it
- Time-box would exceed 3 days: that's a feature, scope it down

## Setup

Ask the user:
- The specific question (one sentence)
- The time-box (default: 1 day)
- What evidence would answer it (so the spike knows what to measure)

## Orchestration

### Phase 1: Run the spike (god-spike-runner)
Spawn **god-spike-runner** in fresh context with:
- The exact question
- The time-box
- The success criteria

The agent:
- Builds the smallest possible proof
- Hard-codes inputs, no real interface
- Measures or tests as needed
- Documents findings honestly

### Phase 2: No further phases
- No build pipeline
- No deploy
- No observe
- No harden
- No launch

The spike answers a question. That's it.

## After the Spike

The user reviews the SPIKE.md and decides:
- **Proceed**: route to /god-feature with the spike's recommendation
- **Reject**: archive the spike, document why
- **Follow-up spike**: another /god-spike with a narrower question

## On Completion

```
Spike complete: .godpowers/spikes/<question-slug>/SPIKE.md

Time-boxed: [N hours]
Time spent: [actual]

Recommendation: [DECISION from spike]

Suggested next:
  - If proceeding: /god-feature with this recommendation
  - If rejecting: archive .godpowers/spikes/<question-slug>/
  - If unclear: /god-spike with narrower question

REMINDER: spike code is throwaway. Do NOT merge to main.
```

## Have-Nots

Spike FAILS if:
- Built a feature instead of a proof
- No measurable evidence in findings
- "It depends" with no decision support
- Spike code merged to main
- Time-boxed exceeded without escalation
