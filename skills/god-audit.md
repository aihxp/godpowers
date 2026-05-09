---
name: god-audit
description: |
  Score existing artifacts against all have-nots. Build nothing. Report gaps
  with prioritized remediation.

  Triggers on: "god audit", "audit the project", "score artifacts", "check quality"
---

# God Audit

Score existing artifacts. Build nothing. Report what fails and why.

## Process

1. Scan all artifact paths on disk
2. For each artifact found, run the full have-nots catalog for its tier
3. Score each artifact: PASS / PARTIAL / FAIL per have-not
4. Produce `.godpowers/AUDIT-REPORT.md`:

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
