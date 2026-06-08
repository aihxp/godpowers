# Godpowers 2.4.0 Release

> Status: Ready for package verification
> Date: 2026-06-08

Godpowers 2.4.0 is a UX flow consolidation release for the 2.x line. It keeps
the complete 112-command surface intact while making the primary paths easier
to understand through command families, decision ladders, typed route outcomes,
and auditable workflow helper groups.

## What's in this release

- 112 slash commands
- 40 specialist agents
- 13 executable workflows
- 42 intent recipes

## Highlights

- `/god-help` now presents command families first, then ladders and the full
  catalog.
- `/god` and `/god-next` now share command-family helpers for capture, work
  sizing, verification, and overlapping trigger phrases.
- `/god-status` is documented as the continue-family hub, with `/god-progress`,
  `/god-lifecycle`, `/god-locate`, and `/god-next` as direct views.
- Every shipped route now carries command family metadata.
- Flexible route exits now carry typed `success-path.outcome` metadata so
  contextual, verdict-based, steady-state, session-end, and selection outcomes
  can be explained to users.
- Workflow YAML can now use named helper groups, while generated plans still
  expand the exact local helper list for visibility.
- Recipes now split simple existing-repo onboarding from deeper inheritance
  flows, and clarify workstream versus suite collaboration paths.
- Extension journey docs now describe current extension-pack-required flows
  instead of old release annotations.
- Release guardrails now require the command-family runtime files, helper group
  runtime files, and command-family regression test.

## Validation

- `npm test` green across the full suite
- `npm run test:audit` green
- `npm run pack:check` green
- `npm pack` creates a local `godpowers-2.4.0.tgz` tarball for package
  inspection

## Upgrade

- `npm install -g godpowers@2.4.0` or `npx godpowers@2.4.0`
- Re-run `/god-context` in each project to refresh installed runtime metadata
- No breaking changes; existing `.godpowers/` state is compatible. Users who
  want a compact install can run `npx godpowers --profile=core`.

## Notes

- GitHub release creation for `v2.4.0`
- The tag should match the npm package version
- The `v2.4.0` tag should point to the release commit that matches the npm
  `godpowers@2.4.0` package.
