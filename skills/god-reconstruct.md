---
name: god-reconstruct
description: |
  Reverse-engineer Godpowers planning artifacts (PRD, ARCH, ROADMAP, STACK)
  from existing code. Lets brownfield projects use the full reconciliation
  system without rewriting planning from scratch.

  Triggers on: "god reconstruct", "/god-reconstruct", "reverse engineer",
  "derive prd", "extract planning"
---

# /god-reconstruct

Derive planning artifacts from existing code.

## When to use

- Brownfield project without `.godpowers/` planning artifacts
- Need to use /god-reconcile or /god-feature on existing code
- Want a starting point for stakeholder review of the project's "shape"

## Setup

1. Verify codebase exists (Mode B)
2. Optional: run /god-archaeology first for richer input
3. Spawn god-reconstructor in fresh context

## Verification

- All four artifacts created at `.godpowers/<tier>/`:
  - prd/PRD.md
  - arch/ARCH.md (+ adr/)
  - roadmap/ROADMAP.md
  - stack/DECISION.md
- Each has reconstruction warning at top
- Each section tagged with confidence level (HIGH/MEDIUM/LOW)
- Open questions explicitly listed
- `.godpowers/RECONSTRUCTION-LOG.md` written

## On Completion

```
Reconstruction complete.

Artifacts derived from code:
  + prd/PRD.md            (HIGH/MEDIUM/LOW per section)
  + arch/ARCH.md          (HIGH/MEDIUM/LOW per section)
  + roadmap/ROADMAP.md    (Done section preserved)
  + stack/DECISION.md     (flip points marked OPEN QUESTION)

Open questions for stakeholder review: [N]
Reconstruction log: .godpowers/RECONSTRUCTION-LOG.md

CRITICAL: these are reconstructed, not authoritative. Schedule
stakeholder review within 1-2 weeks. Treat as starting point.

Suggested next:
  /god-audit       - score the reconstructed artifacts
  /god-feature     - now you can add features with reconciliation
  /god-tech-debt   - assess what needs paying down

Proposition:
  1. Implement partial: /god-audit the reconstructed artifacts first
  2. Implement complete: /god-audit then /god-feature with reconciliation
  3. Discuss more: /god-discuss stakeholder review questions
  4. Run God Mode: /god-mode after stakeholder review or audit accepts the reconstruction
Recommended: /god-audit before new feature work because reconstruction is
evidence-derived, not stakeholder-approved.
```

## Caveats

Reconstruction is lossy:
- Original intent may be wrong-inferred
- Decisions never written down stay unknown
- Future plans living in someone's head are absent
- The reconstructed PRD may not match what stakeholders actually want NOW

Always recommend stakeholder review before treating reconstructed artifacts
as authoritative.
