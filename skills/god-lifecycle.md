---
name: god-lifecycle
description: |
  Show where the project is in its lifecycle and what workflows make sense
  next. Distinguishes: pre-init, planning, building, shipping, steady state,
  in-incident, in-migration. Suggests appropriate workflows for each.

  Triggers on: "god lifecycle", "/god-lifecycle", "where am I", "what now",
  "project phase"
---

# /god-lifecycle

Show project phase and contextually appropriate workflows.

## Process

1. Detect lifecycle phase from disk:
   - **No `.godpowers/`** -> Pre-init
   - **`.godpowers/PROGRESS.md` exists, not all tiers done** -> In-arc
   - **All tiers done, no special markers** -> Steady state
   - **`.godpowers/postmortems/<id>/` exists with no POSTMORTEM.md** -> Post-incident pending
   - **`.godpowers/migrations/<slug>/MIGRATION.md` exists, status != complete** -> In-migration
   - **`.godpowers/spikes/` has any inconclusive entries** -> Spike pending follow-up

2. Display the phase with context.

3. Suggest workflows appropriate to the phase.

## Output Format

### Pre-init
```
Lifecycle: Pre-init (no Godpowers project here)

Available actions:
  /god-init     Initialize a Godpowers project
  /god-explore  Brainstorm before committing
  /god-mode     Run full autonomous arc (will init first)
```

### In-arc
```
Lifecycle: In-arc (planning/building/shipping)

Current state:
  PRD:          [done/pending]
  Architecture: [done/pending]
  ...

Suggested next: [via /god-next logic]

Or run /god-mode to autonomously continue from here.
```

### Steady state
```
Lifecycle: Steady state (full-arc complete, in maintenance)

Last full audit: [N days ago]
Last dep audit: [N days ago]
Last docs check: [N days ago]

For ongoing work:
  Adding features:        /god-feature
  Production bugs:        /god-hotfix
  Code cleanup:           /god-refactor
  Research questions:     /god-spike
  Framework upgrades:     /god-upgrade
  Documentation:          /god-docs
  Dependency updates:     /god-update-deps

Periodic (recommended cadence):
  /god-hygiene every 30 days
  /god-audit before milestones

Or describe what you want; /god-next will route.
```

### Post-incident pending
```
Lifecycle: Post-incident pending

Incident detected: [.godpowers/postmortems/<id>/]
No POSTMORTEM.md yet.

REQUIRED next: /god-postmortem
This is overdue if hotfix was >48 hours ago.
```

### In-migration
```
Lifecycle: In-migration

Migration: [from -> to]
Status: [expanding / migrating / contracting]
Slices done: N/M

Continue with: /god-upgrade
Or pause and switch context: /god-pause-work
```

### Spike pending follow-up
```
Lifecycle: Spike pending follow-up

Inconclusive spike: .godpowers/spikes/<slug>/SPIKE.md
Recommended follow-up: [from spike's recommendation]

Suggested next: /god-spike with narrower question
Or: archive the spike if no longer relevant
```

## Have-Nots

Lifecycle check FAILS if:
- Multiple lifecycle phases detected without resolution (data inconsistency)
- Lifecycle phase doesn't match disk reality (drift)
- Suggestions don't match phase
