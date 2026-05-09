# RFC 0001: State Model v1

> Status: DRAFT
> Authors: Godpowers Team
> Created: 2026-05-09

## Summary

Replace text-only `.godpowers/PROGRESS.md` with a structured state model:
machine-readable `state.json` + append-only `events.jsonl` + per-artifact
`*.meta.json` for hash and version tracking.

## Motivation

Current state has problems:

1. **Mechanical queries are slow and brittle**: parsing markdown tables to
   answer "what's the current PRD hash" is fragile.
2. **No event log**: we cannot answer "when was the PRD last revised" or "how
   many pauses happened in this run".
3. **Drift is invisible**: if a user edits PRD.md after ARCH.md consumed it,
   nothing detects this. The "moving-target PRD" have-not is theoretical.
4. **No schema**: PROGRESS.md format is implicit; tools can't validate it.

## Design

### state.json

Single source of truth for project status. Schema versioned.

```json
{
  "$schema": "https://godpowers.dev/schema/state.v1.json",
  "version": "1.0.0",
  "project": { "name": "...", "started": "..." },
  "mode": "A | B | C | D",
  "scale": "trivial | small | medium | large | enterprise",
  "active-workstream": "main",
  "tiers": {
    "tier-N": {
      "<sub-step>": {
        "status": "pending | in-flight | done | skipped | imported | failed | re-invoked",
        "artifact": "relative/path/to/artifact",
        "artifact-hash": "sha256:...",
        "agent-version": "agent-name@semver",
        "have-nots-passed": ["P-01", "..."],
        "updated": "ISO 8601 timestamp"
      }
    }
  }
}
```

### events.jsonl

Append-only log. One JSON object per line. Every significant action emits an
event. See ARCHITECTURE.md section 3 for event vocabulary.

### *.meta.json

Per-artifact sidecar:

```json
{
  "version": "1.0.0",
  "hash": "sha256:...",
  "agent": "god-pm@1.0.0",
  "template-used": "PRD.md",
  "have-nots-passed": ["P-01", "..."],
  "created": "...",
  "updated": "...",
  "consumed-by": ["god-architect", "god-roadmapper"]
}
```

`consumed-by` lets us detect moving-target PRDs: if PRD is updated after
god-architect consumed it, we know to flag it.

## Migration

`god migrate` reads `.godpowers/PROGRESS.md`, generates state.json,
synthesizes events from artifact mtimes, archives PROGRESS.md as legacy.

Legacy PROGRESS.md kept as a human-readable view auto-generated from
state.json on demand.

## Tradeoffs

### Pros
- Mechanical queries become trivial (`jq .tiers.tier-1.prd.status state.json`)
- Drift detection works: rehash artifact, compare to recorded hash
- Event log enables observability tools
- Schema enforces invariants

### Cons
- Two more files per project (state.json, events.jsonl)
- Migration burden for existing v0.3 users
- Slight learning curve: contributors must understand the schema

## Alternatives Considered

### Alt A: SQLite database
Pros: real querying, transactions, schema migrations.
Cons: opaque to humans, hard to inspect with grep/cat, harder to version-control.
Rejected: violates "disk-authoritative + human-readable" principle.

### Alt B: TOML instead of JSON
Pros: nicer for humans to read.
Cons: less tooling, no JSONL equivalent for events, more parser variance.
Rejected: JSON has wider tooling support.

### Alt C: Keep PROGRESS.md, just add a parser
Pros: zero migration cost.
Cons: parser becomes complex; format drift becomes a feature.
Rejected: doesn't solve the underlying mechanical-query problem.

## Implementation Plan

1. Define `schema/state.v1.json` (JSON Schema)
2. Implement state.json reader/writer in `lib/state.js`
3. Implement events.jsonl appender in `lib/events.js`
4. Update god-orchestrator to write state.json alongside PROGRESS.md
5. Update each agent to emit events
6. Implement `god migrate` for v0.3 -> v0.4 upgrade
7. Update smoke tests to validate state.json against schema
8. Document in CHANGELOG and ARCHITECTURE.md

## Open Questions

1. Should events.jsonl be rotated when it gets large? (e.g., archive at 10k events)
2. Should state.json be diff-friendly (sorted keys) or order-preserving?
3. Do we expose schema version mismatches as errors or warnings on first read?

## Related

- See ARCHITECTURE.md sections 3 and 6
- See RFC 0002: Workflow YAML (depends on this RFC)
