---
name: god-story
description: |
  Write a new STORY.md - a fine-grained slice of work, smaller than
  /god-feature. Story-file workflow for incremental delivery. Spawns
  god-storyteller in fresh context.

  Triggers on: "god story", "/god-story", "write a story", "user story",
  "story file"
---

# /god-story

Add a new story under `.godpowers/stories/<feature-slug>/`.

## Forms

| Form | Action |
|---|---|
| `/god-story <description>` | Auto-generate ID, write story |
| `/god-story --feature <slug>` | Attach to a feature (chains to roadmap milestone) |
| `/god-story --deps STORY-x-001,STORY-y-002` | Declare deps |

## Process

1. Verify `.godpowers/PROGRESS.md` exists. If not: `/god-init` first.
2. Spawn `god-storyteller` agent in fresh context.
3. Storyteller reads PRD/ARCH for context, validates user-story format,
   writes the file.
4. Report back to user with the new story ID and path.

## Output

`.godpowers/stories/<feature-slug>/STORY-{slug}-{NNN}.md`

## Suggested next

- `/god-story-build <id>` to start implementation
- `/god-stories` to see all stories


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
