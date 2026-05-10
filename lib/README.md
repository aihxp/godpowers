# lib/ - Runtime Library (placeholder)

This directory is reserved for v0.5+ runtime modules. v0.4 has the schemas
defined; v0.5 implements them.

## Planned modules

| Module | Purpose | Target version |
|--------|---------|----------------|
| `state.js` | Read/write `.godpowers/state.json` with schema validation | v0.5 |
| `events.js` | Append OpenTelemetry-shape events to events.jsonl | v0.5 |
| `intent.js` | Read/validate `intent.yaml` (or `.godpowers/intent.yaml`) | v0.5 |
| `workflow-runtime.js` | Parse and execute workflow YAML | v0.5 |
| `reflog.js` | Append to `.godpowers/log` and rewind state | v0.6 |
| `trash.js` | Recoverable deletion to `.godpowers/.trash/` | v0.6 |
| `metrics.js` | Compute per-tier stats from events.jsonl | v0.7 |
| `extension-loader.js` | Lazy-activate skill packs | v0.8 |

## Why placeholder

In v0.4 (current), Godpowers is markdown skills + agent prose. There's no
runtime that needs these modules; agents read/write artifacts directly.

In v0.5+, the workflow runtime needs structured access to state. That's when
these modules ship.

See `../ARCHITECTURE.md` for the design and `../docs/ROADMAP.md` for the
sequencing.
