---
name: god-budget
description: |
  View or set token-budget controls in intent.yaml. Budgets cap
  per-agent context loadout to keep token spend bounded; model
  profiles route routine work to cheaper models; cache enable opts
  into the agent-output cache.

  Triggers on: "god budget", "/god-budget", "set token cap", "model
  profile", "cheap mode", "enable cache"
---

# /god-budget

View or set token-cost saver controls in intent.yaml.

## Usage

### `/god-budget`
Show current budgets in plain English.

### `/god-budget --on`
**One-shot enable.** Writes the recommended defaults to
`intent.yaml.budgets`:
- `default-max-tokens: 80000`
- `model-profile: standard`
- `cache: true`
- `cache-ttl-hours: 24`

Use this if you want budgeting without thinking about specific
numbers. Idempotent; running it again is a no-op.

### `/god-budget --off`
**One-shot disable.** Removes the entire `budgets` block from
`intent.yaml`. Cache stays on disk (clear it with
`/god-cache-clear --all` if you want to free space). Budget caps no
longer applied; cache hits no longer consulted on subsequent runs.

### `/god-budget --default-max-tokens=N`
Set the default per-agent context cap. Example: `--default-max-tokens=80000`.

### `/god-budget --agent <name> --max-tokens=N`
Per-agent override. Example: `--agent god-architect --max-tokens=120000`
(architect gets more context because architecture needs the full PRD).

### `/god-budget --profile=<cheap|standard|expensive>`
Set the default model-profile. cheap routes routine reads to small
models; standard is the balanced default; expensive uses top-tier
for everything.

### `/god-budget --agent <name> --profile=<cheap|standard|expensive>`
Per-agent profile override.

### `/god-budget --cache=<on|off>`
Enable/disable the agent-output cache. Default off.

### `/god-budget --cache-ttl=<hours>`
Set cache entry TTL.

## Output (view mode)

```
GODPOWERS BUDGETS

Defaults:
  Max input tokens per agent: 80,000
  Model profile: standard
  Cache: off (enable with --cache=on)
  Cache TTL: 24 hours

Per-agent overrides:
  god-architect: max-tokens=120,000
  god-pm:        profile=expensive
  god-status:    profile=cheap
```

## What each setting actually does

| Setting | Effect |
|---|---|
| `default-max-tokens` | The orchestrator computes each agent's context loadout (required + optional files) and drops optional files beyond this cap. Required files are always loaded (a `budget.exceeded` event is emitted if they alone exceed the cap). |
| `model-profile: cheap` | Orchestrator prefers haiku / gpt-4o-mini / flash for non-creative work. Creative agents (god-pm, god-architect, god-designer) still use standard or above. |
| `cache: true` | Before spawning an agent, compute the cache key. If a non-expired entry exists for that key, emit `cache.hit` and reuse the output. Miss spawns the agent and records the result. |
| `cache-ttl-hours` | TTL for newly written cache entries. Lower = fresher results but more re-spawns. |

## Default behavior (no budget set)

- Max tokens per agent: 80,000 (built-in default in `lib/context-budget.js`)
- Model profile: standard
- Cache: off
- TTL: 24 hours

## Implementation

Built-in. Reads + writes `.godpowers/intent.yaml` against
`schema/intent.v1.yaml.json`. No agent spawn.

## Related

- `/god-cost` - what you've spent and saved
- `/god-cache-clear` - invalidate cache after rule changes
- `/god-set-profile` - one-time profile change (similar but
  session-scoped instead of project-scoped)
