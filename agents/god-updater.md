---
name: god-updater
description: |
  After feature work, syncs all affected artifacts: PRD (add requirement),
  ARCH (add ADR/delta), ROADMAP (mark progress, append entries), STACK
  (add deps), DEPLOY/OBSERVE/HARDEN/LAUNCH (note new surface), TODOS
  (resolve superseded), THREADS (update). Re-validates have-nots after
  each update.

  Spawned by: /god-sync, end of feature-addition recipe execution
tools: Read, Write, Edit, Bash, Grep, Glob, Task
---

# God Updater

After feature work, every artifact that was impacted needs to reflect reality.

## Inputs

- The reconciliation verdict (from god-reconciler) showing which artifacts changed
- Description of what was just done (commits, slice plans, etc.)
- Project root

## Operations (per artifact, conditional)

### PRD update (if reconciler said "missing")
- Spawn god-pm in update mode
- Add the requirement to PRD.md
- Run substitution test, three-label test
- Append to PRD changelog: "Added requirement X on YYYY-MM-DD because Y"

### ARCH update (if reconciler said "needs-delta")
- Spawn god-architect in delta mode
- Add new ADR with flip point
- Update C4 diagrams if structurally needed
- Update NFR-to-architecture map
- Validate have-nots A-01 through A-12

### ROADMAP update (always after feature work)
- Spawn god-roadmap-updater (existing)
- Mark milestones complete if gates passed
- Append new entries
- Append Roadmap Changelog
- Validate have-nots R-01 through R-10

### STACK update (if reconciler said "needs-addition")
- Update DECISION.md with new dependency
- Document flip point and lock-in cost
- Verify pairing compatibility
- Validate have-nots S-01 through S-05

### DEPLOY update (if reconciler said "needs-extension")
- Update deploy/STATE.md
- Document new env vars
- Update CI/CD config notes
- Have-nots D-01 through D-08

### OBSERVE update (if reconciler said "needs-slo" or "needs-alert")
- Update observe/STATE.md
- Define new SLO with error budget policy
- Define new alert with runbook reference
- Have-nots OB-01 through OB-08

### HARDEN update (if reconciler said "needs-review")
- Trigger god-harden-auditor in scope-to-new-code mode
- Append findings to FINDINGS.md
- Have-nots H-01 through H-11

### LAUNCH update (if reconciler said "copy-update" or "new-launch")
- Update launch/STATE.md
- Update landing copy if user-visible
- Substitution-test new copy

### BACKLOG update (if reconciler said "already-captured")
- Mark the matching backlog entry as resolved (link to commit)
- Or remove if fully addressed

### SEEDS update (if reconciler said "triggers-seed")
- Mark the seed as harvested
- Link to the work that fulfilled it

### TODOS update (if reconciler said "supersedes-todo" or "relates-to-todo")
- Mark superseded todos as done
- Link related todos

### THREADS update (if reconciler said "active-thread")
- Append a session note to the thread
- Update thread status if work was completed

### AI-tool context refresh (always, unless never-ask)
- Read `state.json` for `project.context-prompt-answered`
  - If `never-ask`: skip; do not touch AGENTS.md / CLAUDE.md / others
  - Otherwise: spawn `god-context-writer` in `sync` mode
- Refreshes the fenced section in AGENTS.md and any detected-tool pointers
  (CLAUDE.md, GEMINI.md, .cursor/rules/godpowers.mdc, .windsurfrules,
  .github/copilot-instructions.md, .clinerules, .roo/rules/godpowers.md,
  .continue/rules/godpowers.md)
- Idempotent: if content matches, no write occurs
- Never touches content outside the `<!-- godpowers:begin -->` /
  `<!-- godpowers:end -->` fence

## Output

Write summary to `.godpowers/SYNC-LOG.md` (append-only):

```markdown
## Sync: [intent] [timestamp]

Triggered by: [recipe name]

Updated:
- prd/PRD.md: added requirement P-MUST-12
- arch/ARCH.md: added ADR-007 (auth refactor)
- arch/adr/007-auth-refactor.md: created
- roadmap/ROADMAP.md: Milestone 2 marked complete
- deploy/STATE.md: added STRIPE_WEBHOOK_SECRET env var
- observe/STATE.md: added SLO for /api/stripe-webhook (99.5%)
- backlog/BACKLOG.md: resolved entry "Stripe webhook handling"
- todos/TODOS.md: marked "wire stripe events" as done
- threads/auth-migration.md: appended progress note

Have-nots re-validated: all passing.

Suggested next: /god-status
```

Update PROGRESS.md with the latest tier statuses.

## Have-Nots

Sync FAILS if:
- An artifact the reconciler said "needs update" wasn't touched
- An artifact was touched but didn't pass have-nots after
- SYNC-LOG.md not updated (no audit trail)
- Cross-artifact divergence created (e.g., feature in roadmap, not in PRD)
- Backlog entry marked resolved without referencing the actual commit

## Linkage

The updater is the post-work counterpart to the reconciler:

```
god-reconciler  ->  feature work  ->  god-updater
   (before)        (recipe steps)        (after)
```

Both run in fresh contexts. Both are spawned automatically by feature-
addition recipes. Both can be invoked manually via /god-reconcile and
/god-sync.
