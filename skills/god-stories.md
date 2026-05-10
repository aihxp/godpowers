---
name: god-stories
description: |
  List all STORY.md files grouped by status (pending, in-progress,
  blocked, done). Useful for "what am I working on" overview.

  Triggers on: "god stories", "/god-stories", "list stories",
  "show stories", "what stories are open"
---

# /god-stories

Show all stories with status, owner, deps. Read-only; no agent spawn.

## Forms

| Form | Action |
|---|---|
| `/god-stories` | All stories grouped by status |
| `/god-stories --status pending` | Filter to one status |
| `/god-stories --feature <slug>` | Stories for one feature |
| `/god-stories --json` | Structured output |

## Process

1. Verify `.godpowers/` exists.
2. Call `lib/story-validator.listStories(projectRoot)`.
3. Group by status; render.

## Output (default)

```
Stories (12 total)

In progress (2)
  STORY-auth-001  [alice]  Add OAuth flow
    deps: STORY-auth-000

Pending (5)
  STORY-billing-001  [bob]    Stripe webhook handler
  STORY-billing-002  [bob]    MRR calculator
  ...

Blocked (1)
  STORY-search-001  [alice]  Indexing - waiting on SearchKit upgrade

Done (4)
  STORY-auth-000  Connect button
  ...

Cycles detected: none
```

If dep cycles exist, surface them at the end.

## What this does NOT do

- Modify any STORY.md (use /god-story-close, /god-story-block to change status)
- Spawn agents (read-only)
- Trigger reverse-sync
