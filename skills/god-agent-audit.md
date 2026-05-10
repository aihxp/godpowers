---
name: god-agent-audit
description: |
  Validates every `agents/*.md` against the agent contract:
  required frontmatter, recommended sections (Have-Nots, Inputs,
  Outputs, Handoff), hand-off targets exist, no dual-ownership of
  output paths. Lenient by design: most issues are warnings; only
  structural breakage errors.

  Triggers on: "god agent audit", "/god-agent-audit", "audit agents",
  "validate agent contracts"
---

# /god-agent-audit

Mechanical validation of agent contracts. Backed by `lib/agent-validator.js`.

## Forms

| Form | Action |
|---|---|
| `/god-agent-audit` | Default human-readable report |
| `/god-agent-audit --json` | Structured JSON output |
| `/god-agent-audit --errors-only` | Skip warnings and infos |
| `/god-agent-audit --fix` | Append placeholder for missing recommended sections (info-level only) |

## What gets checked

**Required (errors)**:
- Frontmatter `name` field
- Frontmatter `description` field

**Recommended (warnings)**:
- Frontmatter `tools` field
- Hand-off targets that are referenced exist as agent files
- Output paths claimed by 4+ agents (boundary review needed)

**Recommended (info)**:
- Each agent should have these sections somewhere:
  - "Have-Nots" (or equivalent failure list)
  - "Inputs" (what it reads)
  - "Outputs" (what it writes)
  - "Handoff" (where it returns / what it spawns)

The info-level suggestions are non-blocking. They surface as polish
opportunities, not failures.

## Output

```
Agent audit

37 agents audited
0 errors, 2 warnings, 90 infos

Errors:
(none)

Warnings:
  [multi-ownership] STATE.md claimed by 4 agents (verify boundaries)
  [multi-ownership] .godpowers/roadmap/ROADMAP.md claimed by 4 agents

Infos: 90 missing-recommended-section suggestions across agents
       (run with --json for full list)
```

## Backward-compatibility promise

This skill never breaks existing agents that don't yet have the
recommended sections. Errors fire only on real structural issues
(missing required frontmatter, broken hand-off targets, conflicting
output ownership).

The `--fix` flag inserts placeholder sections so contributors can
fill them in incrementally. It never modifies content that's already
present.

## Integration

`/god-agent-audit` is part of the standard test suite (npm test).
Agent contract violations become regression failures: contracts can
only get tighter over time, not looser.

## See also

- `lib/agent-validator.js` - parser + validator
- `docs/agent-specs.md` - per-agent specifications (canonical reference)
