---
pillar: deploy
status: active
always_load: false
covers: [ci, release, npm publish, package verification]
triggers: [deploy, publish, release, npm, ci, provenance]
must_read_with: [repo, quality]
see_also: [security, observe]
---

## Scope

- [DECISION] This pillar captures deployment and release context for Godpowers.

## Release Surface

- [DECISION] Godpowers deploys as an npm package published from tag-triggered GitHub Actions.
- [DECISION] `.github/workflows/ci.yml` runs tests, audit checks, E2E smoke, and package checks on pushes and pull requests to `main`.
- [DECISION] `.github/workflows/publish.yml` publishes tagged releases to npm with provenance.
- [DECISION] `package.json` exposes `bin.godpowers` at `./bin/install.js`.

## Watchouts

- [HYPOTHESIS] A release cannot be fully published locally without `NPM_TOKEN` and tag-triggered GitHub Actions access.
