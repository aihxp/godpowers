---
name: god-metrics
description: |
  Aggregate per-tier statistics across runs: agent count, duration,
  pauses, errors. Useful for spotting slow tiers, frequent pause
  points, or error-prone steps.

  Triggers on: "god metrics", "/god-metrics", "stats", "how long
  does tier-1 take", "performance"
---

# /god-metrics

Per-tier aggregate stats across one or all runs.

## Usage

### `/god-metrics`
All runs in the project.

### `/god-metrics <run-id>`
Single run.

### `/god-metrics --since=<duration>`
Only runs that started within the duration.

### `/god-metrics --json`
Machine-readable.

## Output

```
GODPOWERS METRICS  (3 runs)

Per tier:
  tier-0  count=3   avg=0.4s   total=1.2s   pauses=0  errors=0
  tier-1  count=12  avg=44.2s  total=8.8m   pauses=2  errors=0
  tier-2  count=9   avg=2.1m   total=18.9m  pauses=1  errors=1
  tier-3  count=12  avg=18.5s  total=3.7m   pauses=0  errors=0

Totals: 3 runs, 36 agent spawns, 3 pauses, 1 error, 32.6m elapsed
```

## Implementation

Built-in. Calls `lib/event-reader.js metrics(...)`.

## Related

- `/god-logs` - readable event timeline
- `/god-trace <tier>` - one tier in detail
