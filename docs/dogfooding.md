# Dogfooding

## Purpose

- [DECISION] Godpowers uses deterministic messy-repo fixtures to test the
  automation paths that are hardest to trust from unit tests alone.
- [DECISION] Dogfood scenarios run against copied fixtures and must not mutate
  real user projects.
- [DECISION] Dogfood failures route to scoped specialist ownership instead of
  being described as generic release risk.

## Runtime Surface

- [DECISION] `lib/dogfood-runner.js` lists scenarios from `fixtures/dogfood/`.
- [DECISION] `npx godpowers dogfood` runs every shipped scenario and exits
  nonzero when any scenario fails.
- [DECISION] `/god-dogfood` is the AI-tool command surface for the same
  behavior.
- [DECISION] Release readiness requires `scripts/test-dogfood-runner.js`.

## Shipped Scenarios

- [DECISION] `half-migrated-gsd` verifies GSD detection, imported prep
  context, PRD seed creation, and managed sync-back.
- [DECISION] `host-degraded` verifies that Godpowers reports degraded runtime
  guarantees when fresh-context agent metadata is absent.
- [DECISION] `host-full` verifies that Godpowers reports full runtime
  guarantees when Codex agent metadata is installed.
- [DECISION] `extension-authoring` verifies scaffolded extension files and
  manifest validation.
- [DECISION] `suite-release-dry-run` verifies Mode D dependent impact planning
  without mutating sibling repositories.

## Auto-Invoke Policy

- [DECISION] Planning migration failures belong to `god-greenfieldifier`.
- [DECISION] Host capability failures belong to `god-context-writer`.
- [DECISION] Extension and suite release failures belong to `god-coordinator`.
- [DECISION] Local fixture execution reports `Agent: none, local runtime only`
  unless a specialist is explicitly spawned to diagnose a failure.

## Release Gate

```bash
node scripts/test-dogfood-runner.js
npx godpowers dogfood
```

- [DECISION] `npm run release:check` includes the dogfood runner test.
- [DECISION] `lib/release-surface-sync.js` checks that the dogfood test remains
  wired into `package.json`.
- [DECISION] `lib/repo-surface-sync.js` checks that required dogfood fixtures
  are present.
