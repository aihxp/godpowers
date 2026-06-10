# Godpowers 2.6.0 Release

> Status: Release candidate
> Date: 2026-06-10

Godpowers 2.6.0 ships the Phase 3 MCP companion package. It keeps the main
`godpowers` package dependency-free while adding an optional `@godpowers/mcp`
package for MCP-capable hosts.

## What's in this release

- 112 slash commands
- 40 specialist agents
- 13 executable workflows
- 42 intent recipes
- 9 installer CLI helpers
- 5 read-only MCP tools in `@godpowers/mcp`

## Highlights

- `@godpowers/mcp` exposes `status`, `next`, `gate_check`, `lint_artifact`,
  and `trace_requirement` over stdio.
- `godpowers mcp-info --project=.` prints setup instructions without requiring
  or loading the MCP SDK in the main package.
- `godpowers-mcp setup --host=codex --project=. --write` writes a managed
  Codex MCP registration only after the user explicitly asks for it.
- Dashboard and Quick Proof host guarantee lines now include MCP availability.
- The main `godpowers` package still has no production dependencies.

## Validation

- `npm --workspace @godpowers/mcp test` passed.
- `npm --workspace @godpowers/mcp run pack:check` passed.
- `npm run test:e2e` passed.
- `node scripts/test-runtime-verification.js` passed.
- `node scripts/test-agent-browser.js` passed.
- `npm run release:check` passed before publish.

## Upgrade

- `npm install -g godpowers@2.6.0` or `npx godpowers@2.6.0`
- Optional MCP package: `npm install -g godpowers @godpowers/mcp`
- Re-run `/god-context` in each project to refresh installed runtime metadata.
- Existing `.godpowers/` state remains compatible.

## Notes

- GitHub release should be created for `v2.6.0`.
- The tag should match the npm package version.
- The companion package should publish as `@godpowers/mcp@2.6.0` after the
  release gate passes.
