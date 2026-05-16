---
name: god-status
description: |
  Re-derive project state from disk. Never from memory. Scans all artifact
  paths and reports what exists, what passes, and what's missing.

  Triggers on: "god status", "where are we", "project status", "what's done"
---

# God Status

Re-derive state from disk. Your memory is not authoritative. The file system is.

## Process

1. Check if `.godpowers/PROGRESS.md` exists
   - If not: "No Godpowers project found. Run `god init` to start."
2. Read PROGRESS.md for recorded state
3. Scan ALL artifact paths on disk:
   - `.godpowers/prd/PRD.md`
   - `.godpowers/arch/ARCH.md`
   - `.godpowers/roadmap/ROADMAP.md`
   - `.godpowers/stack/DECISION.md`
   - `.godpowers/repo/AUDIT.md`
   - `.godpowers/build/STATE.md`
   - `.godpowers/deploy/STATE.md`
   - `.godpowers/observe/STATE.md`
   - `.godpowers/launch/STATE.md`
   - `.godpowers/harden/FINDINGS.md`
   - `.godpowers/SYNC-LOG.md`
   - `.godpowers/CHECKPOINT.md`
4. For each artifact found: run a lightweight have-nots check
5. Compare disk state to PROGRESS.md state:
   - If PROGRESS.md says "done" but artifact is missing: FLAG as phantom resume
   - If artifact exists but PROGRESS.md says "pending": FLAG as untracked work
6. Report:
   - Current mode and scale
   - Progress summary: percentage, completed step count, current step number
   - Planning visibility: PRD status, roadmap status, active milestone, and
     completion basis
   - What happened recently, using CHECKPOINT.md actions when available
   - Last sync status, using SYNC-LOG.md when available
   - Proactive opportunities based on the auto-invoke policy
   - What happens next, using routing and disk state
   - Per-tier status (with disk verification)
   - Any inconsistencies between PROGRESS.md and disk
   - Suggested next action
7. If inconsistencies found: offer to repair PROGRESS.md to match disk truth

## Output Format

```
Godpowers Status

Mode: A (greenfield)    Scale: medium
Started: 2026-05-09
Progress: 15% (2 of 13 steps complete; current step 3 of 13)
Current: Tier 1 Planning / Architecture

Planning visibility:
  PRD: done .godpowers/prd/PRD.md
  Roadmap: pending
  Current milestone: Planning / Architecture
  Completion: 15% based on PROGRESS.md tracked steps

What happened recently:
  1. PRD artifact verified on disk
  2. Tier state refreshed from state.json

Last sync:
  Trigger: /god-mode final sync
  Agent: god-updater
  Local syncs:
    + reverse-sync: scanned 14 files, updated 2 footers, populated 0 review items
    + pillars-sync: no-op
    + checkpoint-sync: CHECKPOINT.md updated
    + context-refresh: no-op
  Log: .godpowers/SYNC-LOG.md

Proactive opportunities:
  Checkpoint: fresh
  Reviews: 5 pending, suggest /god-review-changes
  Sync: fresh
  Docs: possible drift, suggest /god-docs
  Runtime: known local URL, suggest /god-test-runtime
  Security: clear
  Dependencies: clear
  Hygiene: stale, suggest /god-hygiene

What happens next:
  1. Run /god-arch
  2. Verify architecture artifact
  3. Recompute next gate with /god-next

Tier 1: Planning
  + PRD           done     .godpowers/prd/PRD.md (lint clean: 0 errors)
  + Architecture  done     .godpowers/arch/ARCH.md (lint clean: 0 errors)
  - Roadmap       pending
  - Stack         pending
  - Design        not-required (backend-only project)
  - Product       not-required (backend-only project)

Tier 2: Building
  - Repo          pending
  - Build         pending

Tier 3: Shipping
  - Deploy        pending
  - Observe       pending
  - Launch        pending
  - Harden        pending

Linkage status (from .godpowers/links/):
  Coverage: 87% (15 of 17 declared IDs implemented)
  Orphans: 2 (P-MUST-09, P-SHOULD-03)
  Drift: 1 (colors.removed referenced in src/old.css but missing in DESIGN.md)
  Pending reviews: 5 (see REVIEW-REQUIRED.md)
  Last scan: 2026-05-10T14:23:11Z

Suite (Mode D) status:
  This repo is a sibling of suite "my-products" (hub: ../hub)
  Run /god-suite-status to see all 3 repos and meta-linter findings.

Next: god roadmap
```

## Proposition Closeout

Every status report must end with a proposition block so the user can choose
how much momentum to give Godpowers:

```
Proposition:
  1. Implement partial: [single next command from "What happens next"]
  2. Implement complete: /god-mode to continue the current project run when no blockers are present
  3. Discuss more: /god-discuss [unclear state, blocker, or inconsistency]
  4. Inspect status: /god-locate or /god-next for a smaller routing view
Recommended: [one option and why it fits the disk-derived state]
```

If inconsistencies are present, make `/god-repair` the partial option and do
not recommend `/god-mode` until disk state is coherent.

## Proactive Opportunity Rules

Use the master auto-invoke policy to populate `Proactive opportunities`.
`/god-status` is read-only by default, so it suggests Level 3 agents instead of
spawning them unless the user asked status to continue work.

Report:
- Checkpoint: `fresh`, `missing`, `stale`, or `conflicts with state.json`
- Reviews: `none` or `<N> pending, suggest /god-review-changes`
- Sync: `fresh`, `missing`, `stale`, or `suggest /god-sync`
- Docs: `fresh`, `possible drift, suggest /god-docs`, or
  `docs drift-check already logged`
- Runtime: `not-applicable`, `known URL, suggest /god-test-runtime`, or
  `no known URL, defer deployed verification`
- Security: `clear` or `sensitive files changed, suggest /god-harden`
- Dependencies: `clear` or `dependency files changed, suggest /god-update-deps`
- Hygiene: `fresh` or `stale, suggest /god-hygiene`

## Mode D awareness

If `lib/multi-repo-detector.detect(projectRoot)` returns
`isMultiRepo: true`, /god-status appends a "Suite (Mode D) status"
section showing:
- Suite name and our role (hub or sibling)
- Hub path
- Suggestion to run /god-suite-status for the aggregate view

For the hub itself, this section becomes:
```
Suite (Mode D) status:
  This repo IS the hub for suite "my-products" (3 siblings).
  Aggregate: 42 artifacts done, 1 drift, 5 pending reviews.
  Last suite refresh: 2026-05-10T16:45:00Z
```

The suite section is omitted entirely when the project is not part of
a registered suite.
