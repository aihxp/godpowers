---
name: god-trace
description: |
  Deep dive on one tier's events across one run. Shows every event
  for the tier in chronological order with full attrs. Useful for
  debugging a stuck or slow tier, or auditing what a specific
  agent did.

  Triggers on: "god trace", "/god-trace", "what happened in tier-1",
  "debug tier", "deep dive"
---

# /god-trace

Deep dive on one tier's events.

## Usage

### `/god-trace <tier>`
Filter the most-recent run by tier (e.g. `tier-1`, `tier-2`).

### `/god-trace <tier> <run-id>`
Specific run.

### `/god-trace <tier> --json`
Machine-readable.

## Output

```
TRACE tier-1  run=2026-05-10T21-42-00-abc12345

2026-05-10T21:42:00.000Z workflow.run         attrs={workflow:full-arc}
2026-05-10T21:42:01.234Z agent.start          agent=god-pm
2026-05-10T21:42:08.001Z tool.call            tool=Read path=examples/...
2026-05-10T21:42:12.456Z tool.call            tool=Write path=prd/PRD.md
2026-05-10T21:42:42.789Z agent.end            agent=god-pm status=success
2026-05-10T21:42:43.012Z gate.pass            gate=standards artifact=prd/PRD.md
2026-05-10T21:42:44.111Z agent.start          agent=god-architect
...
```

## Implementation

Built-in. Calls `lib/event-reader.js trace(projectRoot, runId, tier)`.

## Related

- `/god-logs` - whole-run timeline
- `/god-metrics` - aggregate stats
