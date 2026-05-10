# Dogfood Run 002: Phases 12-15 + Real-User Validation

Date: 2026-05-10
Phases validated: 12 (Mode D), 13 (routing sweep), 14 (docs), 15 (heuristics)
Status: PASS with 1 finding for follow-up

## Setup

Two parallel scenarios:

1. **Self-dogfood**: lint godpowers' own repo + lint the
   examples/saas-mrr-tracker exemplar
2. **Sandbox**: synthetic Mode D suite at
   `/tmp/dogfood-002-sandbox/hub` with two siblings (`repo-a`,
   `repo-b`); deliberate byte-identical drift on `.editorconfig`,
   matching LICENSE files

## Validation matrix

### Self-dogfood findings

| Test | Result |
|---|---|
| `lintAll('.')` on godpowers repo | 0 files (godpowers itself isn't a `.godpowers/`-style project) - correct |
| `lintAll(examples/saas-mrr-tracker)` | 5 files; 0 errors, 8 warnings (all interpretive U-01 / U-02 substitution-test soft signals; expected) |

### Mode D end-to-end

| Test | Result |
|---|---|
| `detector.detect(hub)` | `isMultiRepo: true`, `role: 'hub'`, 2 siblings detected |
| `meta.runAll(hub)` (default) | 0 errors, 1 warning (byte-identical-drift on .editorconfig) |
| `meta.runAll(hub, {strict: true})` | 1 error, 0 warnings (Q2 strict mode promoted correctly) |
| `suite.refreshFromRepos(hub)` | 2 repos aggregated, 3 total artifacts, avg coverage 88.5% |
| STATE.md written | yes |

### Runtime heuristic improvements

| Test | Result |
|---|---|
| `parseFlow` on positive flow | 1 of 2 expected steps caught (see finding below) |
| `parseFlow` on negative expectation | 2 of 2 expected steps caught (incl. not-expect) |
| `deriveSelectorsFromDesign` on real DESIGN.md | 4 component selectors derived correctly |

### Integration detection on this machine

| Integration | Status |
|---|---|
| awesome-design-md catalog | 71 sites available |
| SkillUI | not installed (correct fallback path: install instructions reported) |
| agent-browser | not installed |
| Playwright | installed |
| Active runtime backend | Playwright (correct cascade fallback) |

## Findings

### F-001: parseFlow misses "lands on" verb (LOW)

**Test input**:
> "User clicks Connect, completes Stripe OAuth, lands on populated
> dashboard within 30 seconds."

**Expected**: 3+ steps (click + complete-flow + expect)

**Actual**: 1 step (just click)

**Why**: My parseFlow regex doesn't include "lands on" as an expect
verb. "completes" is also not recognized.

**Severity**: low. The framework correctly detects the click; the
"lands on" expectation gets lost. For PRD acceptance criteria, this
is a real gap.

**Fix proposal**: Add "lands on", "arrives on", "completes" to the
verb tables. Easy 5-minute change in a follow-up commit.

**Note**: this is exactly the kind of finding the dogfood is supposed
to surface. Synthetic dogfood-001 didn't catch this because its test
used the simpler verbs already in the recognized set.

## What worked first try

Everything else. Mode D detection, meta-linter cascade, strict mode
upgrade, suite-state aggregation, byte-identical drift detection,
hub-vs-sibling role classification, suite-config.yaml parsing,
fenced-section reverse-sync (existing from earlier phases),
deriveSelectorsFromDesign reading components, runtime heuristic
visualRegression baseline-and-compare, the new tests themselves.

## What's NOT exercised here

The dogfood does NOT execute:

- god-orchestrator running an arc end-to-end inside a real AI tool
  (it's a markdown contract; runtime would happen inside Claude
  Code/Cursor/etc.)
- god-coordinator running a real cross-repo patch via Task tool
  spawn (same: agent runtime needed)
- god-design-reviewer two-stage gate (lib lints work, but the agent
  runtime isn't exercised here)
- /god-test-runtime against an actual running app (no live server in
  this environment)
- /god-suite-init interactive prompt flow (UI-bound)

These gaps are not blocking; the lib layer that supports them is
exercised by the 28+ behavioral tests for each module. Real validation
of agent contracts happens when a user runs them in their AI tool.

## Bugs to fix

| ID | Severity | Phase | Fix scope |
|---|---|---|---|
| F-001 | low | Phase 15 | Add 3-4 verbs to parseFlow (lands on, arrives on, completes); ~10 lines + 3 tests |

## Recommendation

Ship Phases 12-16 (this dogfood being Phase 16). F-001 fix is small
enough to fold into the same commit since we're already touching
parseFlow. Apply now.

## Cleanup

Test sandbox at `/tmp/dogfood-002-sandbox/` remains; safe to delete.
