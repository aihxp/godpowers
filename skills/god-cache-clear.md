---
name: god-cache-clear
description: |
  Invalidate the agent-output cache. Use after agent prompts change,
  after a major refactor that should re-run agents, or to recover
  disk space. Read-only inspection: /god-cost.

  Triggers on: "god cache clear", "/god-cache-clear", "flush cache",
  "invalidate cache", "reset cache"
---

# /god-cache-clear

Invalidate agent-output cache entries.

## Usage

### `/god-cache-clear`
Interactive: shows cache size + entries, asks confirmation, clears all.

### `/god-cache-clear --all`
Clear every entry. Skip confirmation.

### `/god-cache-clear --expired`
Clear only entries past their TTL.

### `/god-cache-clear --agent <name>`
Clear entries for one agent (e.g. after editing
`agents/god-pm.md`, clear `--agent god-pm`).

### `/god-cache-clear --older-than=<duration>`
Clear entries older than N (e.g. `--older-than=7d`).

### `/god-cache-clear --stats`
Show cache stats; clear nothing.

## Output

```
GODPOWERS CACHE

Location: .godpowers/cache/
Entries: 47
Total: 412 KB
Oldest: 2026-05-08T11:23:47.000Z (2 days ago)

Clearing all 47 entries...
Cleared 47 entries (412 KB freed).
```

## When to use

| Scenario | Command |
|---|---|
| Edited an agent prompt | `/god-cache-clear --agent god-pm` |
| Wholesale refactor; everything should re-run | `/god-cache-clear --all` |
| Disk space, just kill old stuff | `/god-cache-clear --older-than=7d` |
| Just want to see what's cached | `/god-cache-clear --stats` |
| Drop expired entries between runs | `/god-cache-clear --expired` (auto-runs in /god-doctor --fix) |

## What it does NOT do

- Does not delete events.jsonl history. Past `cache.hit` records stay
  in the audit log; only the cached outputs are removed.
- Does not affect intent.yaml settings. To disable caching entirely,
  use `/god-budget --cache=off`.

## Implementation

Built-in. Calls `lib/agent-cache.js clear(...)` and `stats(...)`.

## Related

- `/god-cost` - spend + savings report
- `/god-budget` - cache config (enable, TTL, etc.)
