# Godpowers 3.0.1 Release

> Status: Published
> Date: 2026-06-11

[DECISION] Godpowers 3.0.1 is a documentation and release-surface cleanup patch on top of the 3.0.0 surface contraction release.
[DECISION] This release preserves the 3.0.0 runtime behavior: `core` remains the omitted installer profile, `--profile=full` remains the complete compatibility surface, verb dispatchers continue routing to existing leaves, and `@godpowers/mcp` remains the optional read-only companion package.
[DECISION] This release removes the completed migration planning document from the public documentation tree.
[DECISION] This release updates stale README, roadmap, architecture, reference, MCP, release checklist, package metadata, and package version surfaces.

## What's in this release

- [DECISION] 120 slash commands.
- [DECISION] 40 specialist agents.
- [DECISION] 13 executable workflows.
- [DECISION] 43 intent recipes.
- [DECISION] Five thin verb dispatch commands remain shipped: `/god-plan`, `/god-fix`, `/god-ship`, `/god-capture`, and `/god-extend`.
- [DECISION] Five read-only MCP tools remain available in `@godpowers/mcp`: `status`, `next`, `gate_check`, `lint_artifact`, and `trace_requirement`.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.0.1 patch version.
- [DECISION] README current-release prose now points at the 3.x release line instead of foregrounding older 2.x patch details.
- [DECISION] `docs/ROADMAP.md` now reports the 3.x public adoption window and the v3.0.1 current surface.
- [DECISION] `docs/RELEASE-CHECKLIST.md` now describes `npm run lint` as a separate static release-sensitive gate instead of claiming it runs inside `npm run release:check`.
- [DECISION] Architecture extension compatibility examples now match the shipped first-party pack range `>=2.0.0 <4.0.0`.
- [DECISION] MCP setup examples now pin `godpowers@3.0.1` and `@godpowers/mcp@3.0.1`.
- [DECISION] The quick proof regression test now guards adoption canary and release verification documentation links.

## Validation

- [DECISION] `npm run test:quick-proof` passed with 22 tests.
- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `npm run release:check` passed with `coverage:lib` at 92.82 percent line coverage.
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.0.1 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root package contents with 548 files.
- [DECISION] `npm run release:check` passed `@godpowers/mcp` package contents with 8 files.
- [DECISION] `npm pack --pack-destination /tmp/godpowers-release-3.0.1` produced `godpowers-3.0.1.tgz` with 548 files.
- [DECISION] `npm pack --workspace @godpowers/mcp --pack-destination /tmp/godpowers-release-3.0.1` produced `godpowers-mcp-3.0.1.tgz` with 8 files.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.0.1` or `npx godpowers@3.0.1`.
- [DECISION] Use `npx godpowers --profile=full` when the complete pre-3.0 command surface should be installed.
- [DECISION] Use `npx godpowers --profile=core` or omit `--profile` for the contracted default surface.
- [DECISION] Use optional MCP package install `npm install -g godpowers @godpowers/mcp` when the host can register MCP servers.
- [DECISION] Re-run `/god-context` in each project to refresh installed runtime metadata.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.0.1`, npm `@godpowers/mcp@3.0.1`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.0.1`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
