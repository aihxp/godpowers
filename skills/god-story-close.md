---
name: god-story-close
description: |
  Mark a STORY done after build + verify pass. Updates status,
  appends to roadmap milestone, triggers reverse-sync to update
  Implementation Linkage footers across artifacts.

  Triggers on: "god story close", "/god-story-close", "close story",
  "mark story done"
---

# /god-story-close

Final step in the story lifecycle. Sets status to `done`, propagates
linkage updates.

## Forms

| Form | Action |
|---|---|
| `/god-story-close <STORY-id>` | Close the named story |
| `/god-story-close <STORY-id> --skip-verify` | Close without requiring /god-story-verify (use sparingly) |

## Process

1. Parse STORY.md via `lib/story-validator.parseStory`.
2. Pre-flight checks:
   - Status is `in-progress` (not pending, not blocked)
   - At least one commit exists with `// Implements: STORY-{id}`
   - Unless `--skip-verify`: a /god-story-verify run exists in
     `.godpowers/runtime/` and ALL acceptance bullets passed
3. If pre-flight fails: surface specific reason; do not close.
4. Update status to `done` via `lib/story-validator.setStatus`.
5. Append to STORY.md `## Notes`: "Closed: <ISO date>".
6. Trigger `lib/reverse-sync.run()`:
   - Updates ROADMAP.md milestone with story credit
   - Refreshes Implementation Linkage footers
   - May update parent feature's PRD if the feature directory exists
7. Emit `story.closed` event to events.jsonl.

## Output

- STORY.md `status: done`
- Notes section gets "Closed: YYYY-MM-DD" appended
- ROADMAP milestone footer updated (if story was tied to a milestone)
- Linkage Implementation footers refreshed

## Suggested next

- `/god-stories` to see the updated board
- `/god-story --feature <slug>` to write the next story in the feature
- `/god-story-build --next` for the next eligible pending story

## Backward compatibility

- Stories not tied to a milestone close cleanly without affecting
  ROADMAP.md
- /god-feature workflow continues to work without ever using stories
- /god-story-close on a story without an annotated commit warns but
  can be forced via --skip-verify (logged to events as a yolo decision)

## What this does NOT do

- Run /god-story-verify (must already have run; pre-flight checks)
- Modify the implementation code
- Trigger any other workflow automatically


## Locking

The orchestrator acquires a state-lock before this skill mutates anything,
scoped to the smallest affected unit (e.g. `tier-1.prd` for `/god-prd`,
`linkage` for `/god-scan`). Lock TTL is 5 minutes; reentrant for the
same holder; force-reclaimable if stale via `/god-repair`.

Read-only inspection commands (`/god-status`, `/god-doctor`,
`/god-locate`) do NOT block on the lock. Concurrent writers on
non-overlapping scopes are allowed; on overlapping scopes, the second
writer pauses or routes elsewhere via `/god-next`.

See [ARCHITECTURE.md "Concurrency contract"](../ARCHITECTURE.md) for
the full contract.
