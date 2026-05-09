---
name: god-harden
description: |
  Adversarial security review. Spawns the god-harden-auditor agent in a fresh
  context. Critical findings BLOCK launch.

  Triggers on: "god harden", "/god-harden", "security review", "OWASP", "pen test"
---

# /god-harden

Spawn the **god-harden-auditor** agent in a fresh context via Task tool.

## Setup

1. Verify build is complete (`.godpowers/build/STATE.md` exists).
2. Spawn god-harden-auditor with full code access.
3. The agent writes `.godpowers/harden/FINDINGS.md`.

## Verification

After god-harden-auditor returns:
1. Verify FINDINGS.md exists on disk
2. Read findings classification:
   - If any Critical: PROGRESS.md status = failed, launch is BLOCKED
   - If only High/Medium/Low: PROGRESS.md status = done

## Have-Nots

Hardening FAILS if:
- Only automated scanner output, no manual review
- Auth boundaries not tested (just code-read)
- No input validation audit
- Rate limiting not verified
- OWASP categories skipped without justification
- Findings have no severity classification

## Critical-Finding Gate

If ANY finding is Critical:
1. Pause god-mode immediately
2. Present finding to user using pause format
3. Launch remains BLOCKED until:
   - Critical finding is fixed and re-verified, OR
   - User explicitly accepts the risk in writing
