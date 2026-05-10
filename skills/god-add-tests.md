---
name: god-add-tests
description: |
  Generate tests for existing code based on UAT criteria and observed
  behavior. For shoring up coverage on legacy code without rewriting.

  Triggers on: "god add tests", "/god-add-tests", "test coverage", "add tests"
---

# /god-add-tests

Generate tests for existing code.

## When to use

- Before /god-refactor on legacy code without coverage
- Before /god-upgrade as part of pre-migration test gap-fill
- After acquiring code from another team (combined with /god-map-codebase)

## When NOT to use

- New feature: use /god-build (TDD writes tests first)
- Single bug fix: use /god-debug (writes regression test as part of fix)

## Process

1. Identify the surface to add tests for (file, module, or function)
2. Spawn god-executor in test-only mode:
   - Read the code
   - Identify acceptance behaviors (what should this do)
   - Identify edge cases
   - Write tests that codify the current behavior
   - Don't change the code (just add tests)
3. Spawn god-quality-reviewer:
   - Are tests meaningful (testing behavior, not implementation)?
   - Are edge cases covered?
4. Atomic commit: `test: add coverage for <surface>`

## Have-Nots

- Tests that verify the test framework runs (no actual assertions)
- Tests that mirror the implementation 1:1 (fragile, no value)
- Tests that pass even when bug is intentionally introduced

## On Completion

```
Test coverage added: <surface>
New tests: N
Coverage delta: +X%

Suggested next: /god-refactor or /god-upgrade now that coverage is in place
```
