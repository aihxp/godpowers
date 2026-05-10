---
name: god-review-changes
description: |
  Walk REVIEW-REQUIRED.md interactively. Surface each pending review
  with affected files and suggested actions. Mark items as addressed
  to clear them from the pending list.

  Triggers on: "god review changes", "/god-review-changes", "pending reviews",
  "what needs review", "address reviews"
---

# /god-review-changes

Walk through pending review items in `REVIEW-REQUIRED.md` one batch at
a time. For each: show what changed, which files are affected, propose
remediation, and let the user mark addressed (or defer).

## Forms

| Form | Action |
|---|---|
| `/god-review-changes` | Walk all batches interactively |
| `/god-review-changes --list` | List all pending items, no action |
| `/god-review-changes --clear` | Clear `REVIEW-REQUIRED.md` (only if empty or after explicit confirm) |
| `/god-review-changes --json` | Output structured JSON, no interaction |

## Process

1. Read `REVIEW-REQUIRED.md` via `lib/review-required.readEntries`.
2. If empty: report "No pending reviews."
3. For each batch, surface:
   - Batch ID, source, summary, timestamp
   - Each item with severity, ID, file path, message, suggestion
4. For each item, ask: address now / defer / mark resolved.
5. If addressed: open the affected file(s) for editing.
6. After all items in a batch are addressed: prompt to clear the batch.
7. After all batches cleared: delete `REVIEW-REQUIRED.md`.

## Auto-clear policy

Per plan question 3: REVIEW-REQUIRED.md does NOT auto-clear under
--yolo. Clearing requires either:
- Walking through and marking items
- Explicit `--clear` flag with confirmation

This forces the user to look at what changed, which is the whole point
of the artifact.

## Integration with linkage

When showing "affected files," this skill cross-references
`lib/linkage.queryByFile(projectRoot, file)` so the user sees which
artifact IDs that file is linked to. Helps decide what to fix.

## Output

```
/god-review-changes

3 pending batches in REVIEW-REQUIRED.md:

Batch 1: Design token change
  Source: design-impact
  Timestamp: 2026-05-10T14:23:11Z
  Summary: colors.primary darkened; affects 3 files

  Items (3):
    [WARNING] [colors.primary] src/components/Button.tsx: token value changed
       Linked to: D-button-primary
       Suggestion: review computed contrast on Button against background

    [WARNING] [colors.primary] src/components/Header.tsx: token value changed
       Linked to: D-header
       Suggestion: review header hierarchy

    [WARNING] [colors.primary] src/styles/globals.css: token value changed
       Linked to: (style file)
       Suggestion: re-render visual regression test

Address now / defer / mark resolved? [a/d/r]
```

## What this skill does NOT do

- Modify any artifact (DESIGN.md, PRD.md, etc.)
- Run lint or impeccable (those are separate skills)
- Run reverse-sync (god-updater on /god-sync)
- Auto-fix any issue (always requires human review)

## Output

Updates `REVIEW-REQUIRED.md` (clearing addressed items). No other
artifact changes.
