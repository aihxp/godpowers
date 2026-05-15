# Godpowers 1.6.1 Release

Date: 2026-05-15

Godpowers 1.6.1 hardens the release and package path around the 1.6 domain
precision release. The goal of this patch is to make tests, audit checks,
package contents, E2E smoke coverage, npm publishing, and GitHub release
metadata easier to verify before anything reaches users.

## What is stable

- 106 slash commands
- 39 specialist agents
- 13 executable workflows
- 36 intent recipes
- 15-runtime installer
- Native Pillars project context through `AGENTS.md` and `agents/*.md`
- `.godpowers/` workflow state and artifact layout
- Core schemas: intent, state, events, workflow, routing, recipes, extension
  manifests
- Extension pack compatibility range for the 1.x line
- Domain precision through `.godpowers/domain/GLOSSARY.md` and DG-01 through
  DG-05 checks

## What is new

- `npm run release:check` now runs tests, audit checks, and package contents
  verification as a single pre-release gate.
- `npm run pack:check` now asserts required npm payload files and rejects
  local-only files instead of relying on visual dry-run output.
- CI now installs with `npm ci`, runs audit checks, runs E2E smoke explicitly,
  and keeps package validation tied to local scripts.
- `docs/RELEASE-CHECKLIST.md` documents the expected release flow, tag flow,
  npm provenance path, and post-release verification.
- `/god-mode` full-arc has a plan-mode E2E smoke test that verifies 10 jobs,
  7 waves, and a generated `.godpowers/runs/.../plan.yaml` artifact.
- Stale placeholder docs for runtime libraries, references, and test strategy
  now describe the implemented system.

## What 1.6.1 means

Godpowers 1.6.1 does not expand the public command surface. It tightens the
release discipline around the existing surface so local checks, CI checks, npm
payload contents, git tags, and GitHub release metadata agree.

The domain glossary remains preparation context. PRD, ARCH, ROADMAP, STACK,
docs, and Pillars files still carry durable decisions for their own domains.

## Stability policy

During the 1.x stability window, do not add broad new command families, change
schema formats, or rename public artifacts without evidence from real use.

The `v1.6.1` git tag points to the release commit that matches the npm
`godpowers@1.6.1` package. Public publishes should prefer the tag-triggered
GitHub workflow so npm provenance, git history, and release notes stay aligned.

Allowed changes:

- Critical bug fixes
- Documentation clarity
- Test coverage for frozen behavior
- Compatibility fixes for supported AI coding tools
- Small fixes that make existing 1.x behavior work as documented

Deferred changes:

- New lifecycle phases
- New schema versions
- Pillars format changes
- Major routing semantics
- Large extension API changes

## Adoption ask

Run `npm run release:check` before publishing changes. Report any release path
step that still depends on memory, manual inspection, or local machine state.
