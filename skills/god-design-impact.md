---
name: god-design-impact
description: |
  Predict the impact of a proposed DESIGN.md change without committing.
  Reports affected components, files, and severity. Useful for "what
  if I make primary darker?" exploration before running god-design.

  Triggers on: "god design impact", "/god-design-impact", "what changes if",
  "impact analysis", "affected files"
---

# /god-design-impact

What-if analysis on DESIGN.md changes. Does NOT modify the design;
returns a structured report of what would be affected.

## Forms

| Form | Action |
|---|---|
| `/god-design-impact "<plain English change description>"` | Predict + analyze |
| `/god-design-impact --file <new-design.md>` | Compare current DESIGN.md vs the proposed file |
| `/god-design-impact --token <path> --new <value>` | Single-token change preview |

## Process

1. Verify `DESIGN.md` exists. If not: "no design to analyze."
2. Compute proposed new content:
   - Plain English: paraphrase the change into a token edit (best effort).
     If ambiguous, ask one clarifying question.
   - `--file`: read the candidate file.
   - `--token X --new V`: replace token value in current DESIGN.md.
3. Call `lib/impact.forDesign(projectRoot, oldContent, newContent)`.
4. Format the report:
   - Token changes (added / removed / modified)
   - Component changes (added / removed / modified)
   - Affected files (linked via the linkage map)
   - Severity (error if removals, warning if modifications, info if additions)
5. If `--depth 2` flag given: include transitive dependents via
   `lib/impact.transitive`.

## Output

```
/god-design-impact: "make primary darker"

Proposed changes:
  - colors.primary: oklch(20% 0.01 250) -> oklch(15% 0.01 250)

Token changes (1):
  modified  colors.primary  oklch(20% 0.01 250) -> oklch(15% 0.01 250)

Component changes (0):
  (none directly)

Affected files (3):
  src/components/Button.tsx
  src/components/Header.tsx
  src/styles/globals.css

Severity: warning (modification, no removals)

Transitive (depth 2):
  src/pages/index.tsx (depends on Button, Header)

Recommendation: Run /god-design with this change to apply.
god-design-reviewer will gate via two-stage review.
```

## When this skill helps

- "What if we tone down the bold accent?"
- "Can I rename `card` to `panel`?"
- "If I remove `colors.tertiary`, what breaks?"
- "Show me before I commit."

## What it does NOT do

- Apply the change (use `/god-design` for that)
- Run impeccable critique (that's part of the actual review gate)
- Persist anything to disk (purely informational)

## Output

No artifact changes. No state.json updates. Findings to stdout (or JSON
with `--json`).
