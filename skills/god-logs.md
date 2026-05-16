---
name: god-logs
description: |
  View events.jsonl as a readable timeline. Each line: timestamp,
  event name, tier, agent, duration if available. Use to inspect
  what happened during a run, debug a stuck project run, or audit
  retroactively.

  Triggers on: "god logs", "/god-logs", "show logs", "what happened",
  "run timeline"
---

# /god-logs

Render events.jsonl as a readable timeline.

## Usage

### `/god-logs`
Show timeline for the most recent run.

### `/god-logs <run-id>`
Show timeline for a specific run.

### `/god-logs --since=<duration>`
Examples: `--since=2h`, `--since=30m`, `--since=2026-05-10T12:00:00Z`.

### `/god-logs --filter=<regex>`
Filter event names by regex. E.g. `--filter=agent` for agent-only.

### `/god-logs --tail=N`
Show only the last N events.

### `/god-logs --json`
Machine-readable.

## Output

```
2026-05-10T21:42:00.000Z workflow.run
2026-05-10T21:42:01.234Z agent.start [tier-1] god-pm
2026-05-10T21:42:18.456Z tool.call
2026-05-10T21:42:42.789Z agent.end [tier-1] god-pm (41.55s)
2026-05-10T21:42:43.012Z gate.pass [tier-1] standards
2026-05-10T21:42:44.111Z agent.start [tier-1] god-architect
...
```

## Implementation

Built-in. Calls `lib/event-reader.js timeline(...) + formatTimeline(...)`.

## Related

- `/god-metrics` - aggregate stats
- `/god-trace <tier>` - deep dive on one tier
- `/god-status` - current project state
