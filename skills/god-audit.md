---
name: god-audit
description: |
  Score existing artifacts against all have-nots. Build nothing. Report gaps
  with prioritized remediation.

  Triggers on: "god audit", "audit the project", "score artifacts", "check quality"
---

# /god-audit

Spawn the **god-auditor** agent in a fresh context via Task tool.

## Setup

1. Verify `.godpowers/` directory exists. If not: tell user there's nothing to audit.
2. Spawn god-auditor with instructions: "Run full audit mode. Score every
   artifact against `references/HAVE-NOTS.md`."
3. The agent writes `.godpowers/AUDIT-REPORT.md`

## Verification

After god-auditor returns:
1. Verify AUDIT-REPORT.md exists on disk
2. Display the summary table to the user
3. If any artifact scored below 80%: suggest re-running the failing tier

## Output Format

The agent produces `.godpowers/AUDIT-REPORT.md`:

```markdown
# Godpowers Audit Report

Date: [timestamp]

## Summary

| Artifact | Have-Nots Checked | Passed | Failed | Score |
|----------|------------------|--------|--------|-------|
| PRD | 8 | 6 | 2 | 75% |
| Architecture | 7 | 7 | 0 | 100% |
| ... | ... | ... | ... | ... |

Overall: 85%

## Failures (prioritized by impact)

### 1. PRD: Target user is generic
- **Have-not**: Target user is "developers" with no further specificity
- **Found**: "This is for developers who want to..." (line 14)
- **Fix**: Replace with specific persona (e.g., "solo founders building SaaS MVPs")

### 2. PRD: Success metric has no timeline
- **Have-not**: Success metric has no timeline
- **Found**: "1000 users" (line 28) -- no "by when"
- **Fix**: Add timeline (e.g., "1000 users within 60 days of launch")
```

## Universal Have-Nots (checked on all artifacts)

- AI-slop: passes substitution test
- Unlabeled sentence: not decision/hypothesis/open question
- Paper artifact: document exists, mechanism does not
- Phantom reference: references an artifact that doesn't exist on disk
