---
name: god-story-verify
description: |
  Run the story's acceptance criteria as headless browser tests.
  Reuses Phase 11's runtime-test pipeline (parseFlow + headless
  browser via agent-browser or Playwright).

  Triggers on: "god story verify", "/god-story-verify", "verify story",
  "test story acceptance"
---

# /god-story-verify

Validate that the implemented story actually meets its acceptance
criteria. Headless browser test of each `## Acceptance Criteria` bullet.

## Forms

| Form | Action |
|---|---|
| `/god-story-verify <STORY-id>` | Run acceptance flows for one story |
| `/god-story-verify <STORY-id> --url <url>` | Override target URL |
| `/god-story-verify --all-in-progress` | Verify all in-progress stories |

## Process

1. Parse STORY.md.
2. Extract `## Acceptance Criteria` bullets.
3. For each bullet, run `lib/runtime-test.parseFlow(text)`:
   - If parsable: add to runnable flows
   - If not: warn and skip (per locked Q4: parseFlow is recommended,
     not required)
4. Spawn `god-browser-tester` in `test-only` mode with the parsed flows
   and the resolved URL.
5. Aggregate per-bullet pass/fail.
6. Write report to `.godpowers/runtime/<run-id>/story-{id}-verify.json`.
7. Surface findings to user.

## Output

```
Verifying STORY-auth-001

Acceptance criteria (3 bullets):
  + User clicks Connect, sees Stripe OAuth page
  + User completes OAuth, lands on dashboard within 30s
  x User without account is offered signup
       Reason: "signup link" not visible after expected click

Result: 2/3 passed.
```

## Backward compatibility

- Acceptance bullets that can't be parsed by parseFlow are warned
  but not blocked. Some acceptance is inherently human-judged.
- Stories without `## Acceptance Criteria` warn but don't block;
  the validator already flagged this.
- /god-story-verify is opt-in; the story workflow doesn't require it.

## Suggested next

- If all pass: `/god-story-close <id>`
- If some fail: address findings; possibly revise STORY.md acceptance
  to be more precise; re-run

## What this does NOT do

- Modify code (verification only)
- Auto-close passing stories (explicit /god-story-close required)
- Run design audit (that's `/god-test-runtime audit`)
