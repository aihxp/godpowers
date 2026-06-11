# Godpowers 3.0.2 Release

> Status: Published
> Date: 2026-06-11

[DECISION] Godpowers 3.0.2 is a concierge surface patch on top of the 3.0.0 surface contraction release and the 3.0.1 release-surface cleanup.
[DECISION] This release keeps `core` as the omitted installer profile, keeps `--profile=full` as the complete compatibility surface, and adds first-run, demo, and surface-control entry points for safer onboarding.
[DECISION] This release changes default guidance from catalog-first and dashboard-first output to compact recommendations with `Next commands:` blocks.
[DECISION] This release keeps `@godpowers/mcp` as the optional read-only companion package.

## What's in this release

- [DECISION] 120 slash commands.
- [DECISION] 40 specialist agents.
- [DECISION] 13 executable workflows.
- [DECISION] 43 intent recipes.
- [DECISION] Three concierge entry points are now shipped: `/god-first-run`, `/god-demo`, and `/god-surface`.
- [DECISION] Five thin verb dispatch commands remain shipped: `/god-plan`, `/god-fix`, `/god-ship`, `/god-capture`, and `/god-extend`.
- [DECISION] Five read-only MCP tools remain available in `@godpowers/mcp`: `status`, `next`, `gate_check`, `lint_artifact`, and `trace_requirement`.

## Changes

- [DECISION] `package.json`, `package-lock.json`, and `packages/mcp/package.json` now publish the 3.0.2 patch version.
- [DECISION] `/god-help` now starts with contextual next moves, while `/god-help all` remains the full installed catalog.
- [DECISION] `/god`, `/god-next`, `/god-status`, and the shared dashboard contract now prefer concise action briefs and explicit `Next commands:` blocks.
- [DECISION] `godpowers demo` exposes the shipped sandbox proof from the CLI without modifying the current project.
- [DECISION] `godpowers surface --profile=<name> --dry-run` previews runtime profile changes, and `--apply` writes the selected installed surface.
- [DECISION] README, roadmap, reference, architecture, release notes, and Pillar context now describe the 3.0.2 concierge surface.

## Validation

- [DECISION] `npm run test:quick-proof` passed with 22 tests.
- [DECISION] `npm run lint` passed with 29 static checks.
- [DECISION] `npm run release:check` passed with `coverage:lib` at 92.69 percent line coverage.
- [DECISION] `npm run release:check` passed `npm audit --omit=dev` with 0 vulnerabilities.
- [DECISION] `npm run release:check` passed public surface docs for version 3.0.2 with 120 skills, 40 agents, 13 workflows, and 43 recipes.
- [DECISION] `npm run release:check` passed root package contents with 556 files.
- [DECISION] `npm run release:check` passed `@godpowers/mcp` package contents with 8 files.
- [DECISION] `npm pack --pack-destination /tmp/godpowers-release-3.0.2` produced `godpowers-3.0.2.tgz` with 556 files.
- [DECISION] `npm pack --workspace @godpowers/mcp --pack-destination /tmp/godpowers-release-3.0.2` produced `godpowers-mcp-3.0.2.tgz` with 8 files.

## Upgrade

- [DECISION] Use `npm install -g godpowers@3.0.2` or `npx godpowers@3.0.2`.
- [DECISION] Use `npx godpowers --profile=full` when the complete pre-3.0 command surface should be installed.
- [DECISION] Use `npx godpowers --profile=core` or omit `--profile` for the contracted default surface.
- [DECISION] Use optional MCP package install `npm install -g godpowers @godpowers/mcp` when the host can register MCP servers.
- [DECISION] Re-run `/god-context` in each project to refresh installed runtime metadata.

## Notes

- [DECISION] The publish targets are npm `godpowers@3.0.2`, npm `@godpowers/mcp@3.0.2`, and GitHub release `https://github.com/aihxp/godpowers/releases/tag/v3.0.2`.
- [DECISION] The tag-triggered GitHub publish workflow remains the preferred npm path because it publishes with provenance.
