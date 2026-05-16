---
pillar: observe
status: active
always_load: false
covers: [events, metrics, traces, checkpoints, logs]
triggers: [observe, observability, events, checkpoint, trace, metrics, logs]
must_read_with: [repo]
see_also: [quality]
---

## Scope

- [DECISION] This pillar captures observability mechanisms inside Godpowers itself.

## Signals

- [DECISION] `lib/events.js` writes hash-chained JSONL events under `.godpowers/runs/<run-id>/events.jsonl`.
- [DECISION] `lib/checkpoint.js` writes `.godpowers/CHECKPOINT.md` as the durable orientation pin for future sessions.
- [DECISION] `/god-logs`, `/god-metrics`, and `/god-trace` read the event stream.

## Watchouts

- [HYPOTHESIS] Checkpoint drift can confuse future sessions if state changes without `lib/checkpoint.syncFromState`.
