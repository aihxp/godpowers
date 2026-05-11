---
name: god-export-otel
description: |
  Export godpowers events.jsonl to an OpenTelemetry collector as OTLP/JSON
  trace data. Lets you pipe godpowers runs into Honeycomb, Datadog, Jaeger,
  Tempo, or any OTLP-compatible backend. Opt-in: nothing exports until you
  invoke this skill.

  Triggers on: "god export otel", "/god-export-otel", "export to honeycomb",
  "send traces to collector", "pipe events to datadog"
---

# /god-export-otel

Convert one (or all) godpowers run events into OTLP/JSON ResourceSpans
and POST them to an OpenTelemetry collector.

## Usage

### `/god-export-otel`
Export the most recent run to the endpoint in `OTEL_EXPORTER_OTLP_ENDPOINT`
(or `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT`). With no endpoint set, prints the
OTLP JSON payload to stdout.

### `/god-export-otel <run-id>`
Export a specific run.

### `/god-export-otel --all`
Export every run in the project. Use sparingly: a large history can push a
lot of spans at once.

### `/god-export-otel --endpoint=<url>`
Override the env var. The path `/v1/traces` is appended if not present.

### `/god-export-otel --stdout`
Print OTLP JSON without POSTing. Useful for inspecting the payload or
piping through `jq` into a file collector.

### `/god-export-otel --service-name=<name>`
Override `service.name` in the resource. Defaults to `godpowers`.

## Environment

- `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` - takes precedence
- `OTEL_EXPORTER_OTLP_ENDPOINT` - fallback; `/v1/traces` is appended
- `OTEL_EXPORTER_OTLP_HEADERS` - comma-separated `key=value` pairs for
  auth headers (e.g. `x-honeycomb-team=YOUR_KEY`)

## Event -> span mapping

- `workflow.run` + `workflow.complete` -> root span
- `agent.start` + `agent.end` (matched by `span_id`) -> child span,
  parented to the workflow root
- Other events (`cost.recorded`, `gate.fail`, `error`, `decision.route`,
  `tool.call`, etc.) attach as span events on the span sharing their
  `span_id`
- Events whose span has no start/end become zero-duration spans so no
  data is dropped
- An `error` or `gate.fail` event flips the parent span's status to
  `ERROR`

Timestamps in events.jsonl are ISO strings; OTLP wants nanoseconds since
epoch as numeric strings (JS numbers cannot hold 64-bit nanos). The
exporter converts on the fly with millisecond precision.

## Output

```
Exported run 2026-05-10T22-15-31-3f6827a1
  spans:    12
  endpoint: https://api.honeycomb.io/v1/traces
  status:   200
```

In stdout mode, prints the raw OTLP JSON payload.

## Implementation

Built-in. `lib/otel-exporter.js` does the conversion and HTTP POST. No
external dependencies; uses Node's built-in `http` / `https`.

## Related

- `/god-logs` - human-readable timeline (no export)
- `/god-metrics` - per-tier durations + pause / error counts
- `/god-trace` - filter a run by tier
- `/god-cost` - token + dollar accounting from `cost.recorded` events
