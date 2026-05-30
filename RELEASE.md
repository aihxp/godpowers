# Godpowers 2.1.1 Release

Date: 2026-05-30

Godpowers 2.1.1 is a documentation and off-switch safety patch on top of the
2.1.0 security release. The public slash-command surface, runtime behavior, and
artifact layout are unchanged except for one safety improvement to the context
off-switch.

## What is stable

- 110 slash commands
- 40 specialist agents
- 13 executable workflows
- 40 intent recipes
- 15-runtime installer
- Codex installs with generated `god-*.toml` agent metadata files
- Shared runtime bundle at `<runtime>/godpowers-runtime`
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- `godpowers status --project .`, `godpowers next --project .`, and
  `godpowers quick-proof --project .`
- Release gate enforcement through `npm run release:check`
- The 2.1.0 security hardening (argv-only browser exec, corrupt-file parse
  guards, clean-replace installs, prototype-pollution guards)

## What is new

- The context off-switch now empties the canonical `AGENTS.md` instead of
  deleting it; auto-generated pointer files (`CLAUDE.md`, `.cursorrules`, etc.)
  are still removed when only the Godpowers fence remains.
- Documentation reconciliation: removed unverifiable external impeccable
  rule/finding counts; aligned the project-mode taxonomy with the runtime
  (A/B/C/E primary modes, with D as the orthogonal multi-repo suite overlay);
  documented every `lib/` module; and clarified how the artifact-category counts
  relate.

## Guardrails

- The public slash-command surface remains frozen.
- The runtime remains dependency-free.
- `bin/install.js` stays a thin CLI entry point and delegates install behavior
  to `lib/installer-core.js`.

## Validation

Release validation includes:

- `npm test`
- `npm run test:audit`
- `npm run pack:check`
- `npm run release:check`
- `npm pack --json`
- local install smoke tests across supported runtime shapes
- npm publish when registry credentials are available
- GitHub release creation for `v2.1.1`

The `v2.1.1` tag should point to the release commit that matches the npm
`godpowers@2.1.1` package.
