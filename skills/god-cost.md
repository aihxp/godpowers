---
name: god-cost
description: |
  Token cost + dollar accounting report. Shows spend, savings (via
  cache hits), and breakdowns per tier / agent / model across one or
  all runs. Use to spot expensive tiers, justify cache enablement,
  or measure the impact of /god-budget tightening.

  Triggers on: "god cost", "/god-cost", "how much did this cost",
  "token spend", "show savings"
---

# /god-cost

Report token + dollar spend across runs.

## Usage

### `/god-cost`
Aggregate across every run in the project.

### `/god-cost <run-id>`
One specific run.

### `/god-cost --since=<duration>`
E.g. `--since=24h`, `--since=7d`.

### `/god-cost --json`
Machine-readable.

### `/god-cost --pricing=<file>`
Use custom pricing table (JSON) instead of the built-in approximate
table. Useful if you have negotiated rates.

### `/god-cost --strict`
Exit non-zero if any `cost.recorded` event has `source: 'estimated'`.
Use in CI when you have wired live token reporting and want the
build to fail the moment estimation creeps back in.

## Output

```
GODPOWERS COST REPORT

Spent: $0.4823 across 18 model calls (124,500 tokens)
  Live:      $0.4012 (15 calls, 100,400 tokens)
  Estimated: $0.0811 (3 calls, 24,100 tokens)
Saved: $0.1842 via 7 cache hits (47,200 tokens)
Cache hit rate: 28.0% (7/25)

Per tier:
  tier-1: $0.2134 (8 calls, 3 hits, $0.0892 saved)
  tier-2: $0.1542 (6 calls, 2 hits, $0.0521 saved)
  tier-3: $0.1147 (4 calls, 2 hits, $0.0429 saved)

Per agent (top 5 by spend):
  god-architect: $0.1245 (3 calls)
  god-pm:        $0.0889 (2 calls)
  god-executor:  $0.0856 (5 calls)
  god-roadmapper:$0.0445 (2 calls)
  god-harden-auditor: $0.0388 (1 call)

Per model:
  claude-3-5-sonnet: $0.4012 (15 calls)
  claude-3-5-haiku:  $0.0811 (3 calls)
```

## Where the data comes from

- `cost.recorded` events: every LLM call records `{model, tokens_in,
  tokens_out, cost_usd, agent, tier, source}`. Aggregated by tier /
  agent / model.
- `cache.hit` events: each hit records `{savings_tokens, savings_usd,
  agent, tier}`. Counts toward savings.
- `cache.miss` events: counted to compute hit rate.

## Live vs estimated (source field)

Every `cost.recorded` carries `source: 'live'` or `source: 'estimated'`:

- **live**: the AI tool surfaced real per-call token counts from the
  provider API response. Numbers reflect actual spend. Emitted by
  `cost.recordModelCall(handle, {...})` from `lib/cost-tracker.js`.
- **estimated** (default): the orchestrator inferred token counts from
  byte heuristics (~4 bytes per token). Useful as a fallback when the
  AI tool does not expose usage, but the totals are approximate and
  should not be used for billing or budget enforcement.

`--strict` exits non-zero if any record in scope is estimated. Wire it
into CI once your tooling reliably reports live usage.

## Pricing table

The default pricing table is the May 2026 ballpark for major models.
It's approximate; do not use for billing. Customize with
`--pricing=<file>`:

```json
{
  "claude-3-5-sonnet": { "in": 3.0,  "out": 15.0 },
  "gpt-4o":            { "in": 2.5,  "out": 10.0 },
  ...
}
```

Values are USD per 1M tokens.

## Implementation

Built-in. Reads events.jsonl via `lib/event-reader.js`; aggregates via
`lib/cost-tracker.js aggregate(...)`. No agent spawn.

## Related

- `/god-budget` - view + set context-budget caps
- `/god-cache-clear` - invalidate cache (next run = no hits)
- `/god-metrics` - durations + pauses + errors per tier
- `/god-logs` - timeline of events
