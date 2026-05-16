# Godpowers 2.0.0 Release

Date: 2026-05-16

Godpowers 2.0.0 is the executable proof release. It turns the first-user trust
loop from documentation into a packaged command: `npx godpowers quick-proof
--project=.`. The command renders a shipped fixture with real
`.godpowers/state.json`, computed next action, missing-artifact visibility, and
host guarantees from the caller's environment.

## What is stable

- 110 slash commands
- 40 specialist agents
- 13 executable workflows
- 40 intent recipes
- 15-runtime installer
- Codex installs with generated `god-*.toml` agent metadata files
- Markdown specialist agent contracts at `<runtime>/agents/god-*.md`
- Shared runtime bundle at `<runtime>/godpowers-runtime`
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Dashboard action briefs for next-step compression
- Dashboard host guarantees for full, degraded, and unknown runtime capability
- `godpowers status --project .` and `godpowers next --project .`
- `godpowers quick-proof --project .`
- Planning-system migration for GSD, BMAD, and Superpowers
- Repository documentation sync checks
- Repository surface sync checks
- Route quality, recipe coverage, and release surface sync checks
- Messy-repo dogfood scenarios
- Extension authoring scaffold helper
- Mode D suite release dry-run planner
- Release gate enforcement through `npm run release:check`

## What is new

- Added `lib/quick-proof.js` and the packaged `fixtures/quick-proof/` project.
- Added the `quick-proof` CLI command as the first executable proof path.
- Added `docs/quick-proof.md` to make the first 10 minutes concrete.
- Added `docs/proof-transcript.md` with captured command output.
- Added `docs/adoption-canary.md` with pass/fail criteria and feedback routing.
- Added `scripts/run-adoption-canary.js` to clone an external repo and capture
  quick proof, dashboard status, and next-route output.
- Added `scripts/verify-published-install.js` to verify the npm registry
  artifact after publish.
- Updated README, getting started, reference, release checklist, and Pillars
  context so executable proof is part of the product surface.

## Guardrails

- Quick proof is read-only and deterministic.
- Quick proof reports the user's current host guarantees separately from the
  shipped fixture state.
- Package contents checks require the quick-proof module and fixture state.
- Published install verification checks quick proof, status, next, Claude
  install, and Codex metadata install against the registry artifact.
- The adoption canary harness captures CLI-verifiable signals only. Host slash
  commands such as `/god-preflight`, `/god-audit`, and `/god-reconstruct` still
  require an AI coding host.

## Validation

Release validation includes:

- `npm run test:quick-proof`
- `node scripts/run-adoption-canary.js <repo> --output=<report>`
- `npm run release:check`
- `npm pack --json`
- local uninstall of previous runtime installs
- local reinstall from the generated tarball
- npm publish with provenance when available
- `node scripts/verify-published-install.js godpowers@latest`
- GitHub release creation for `v2.0.0`

The `v2.0.0` tag should point to the release commit that matches the npm
`godpowers@2.0.0` package.
