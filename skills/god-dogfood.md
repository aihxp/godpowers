---
name: god-dogfood
description: |
  Run built-in messy-repo dogfood scenarios against Godpowers automation,
  migration, host capability, extension authoring, and suite release surfaces.

  Triggers on: "god dogfood", "/god-dogfood", "dogfood godpowers",
  "test messy repos", "real-project dogfooding"
---

# /god-dogfood

Run deterministic messy-repo scenarios before release or after automation changes.

## When To Use

- [DECISION] Use `/god-dogfood` before a release when migration, host autonomy,
  extension authoring, or Mode D suite release behavior changes.
- [DECISION] Use `/god-dogfood` when a project already contains GSD, BMAD, or
  Superpowers context and you need confidence that Godpowers can import and
  sync back without deleting prior-system files.
- [DECISION] Use `/god-dogfood` when host-spawn guarantees are unclear and the
  dashboard reports degraded or unknown host capability.

## Process

1. Resolve the runtime root and load `lib/dogfood-runner.js`.
2. Run `dogfood.runAll()` against `fixtures/dogfood/`.
3. Report each scenario with pass or fail status.
4. If any scenario fails, auto-invoke the matching specialist by visible card:
   - `god-greenfieldifier` for planning-system import failures.
   - `god-context-writer` for host capability or install surface failures.
   - `god-coordinator` for extension authoring or suite release failures.
5. Do not edit user projects while running fixture scenarios.
6. End with the Godpowers Dashboard and make `/god-repair` the recommended
   route when dogfood is red.

## CLI Equivalent

```bash
npx godpowers dogfood
npx godpowers dogfood --json
```

## Expected Coverage

- [DECISION] The dogfood suite includes a half-migrated GSD project.
- [DECISION] The dogfood suite includes degraded and full host capability
  scenarios.
- [DECISION] The dogfood suite includes extension scaffold validation.
- [DECISION] The dogfood suite includes a Mode D suite release dry-run.

## Auto-Invoke Card

```text
Auto-invoked:
  Trigger: /god-dogfood scenario failure
  Agent: <god-greenfieldifier | god-context-writer | god-coordinator | none, local runtime only>
  Local syncs:
    + dogfood-runner: <pass, fail, or skipped reason>
  Artifacts: fixture-only unless repair is explicitly requested
  Log: none
```
