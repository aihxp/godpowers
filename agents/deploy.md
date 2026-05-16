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

- [DECISION] Godpowers deploys as an npm package published from tag-triggered GitHub Actions when provenance is available.
- [DECISION] `.github/workflows/ci.yml` runs the full matrix test suite and the Node 20 release gate on pushes and pull requests to `main`.
- [DECISION] `.github/workflows/publish.yml` runs `npm run release:check` before publishing tagged releases to npm with provenance.
- [DECISION] `.github/workflows/publish-pack.yml` runs `npm run release:check` before publishing first-party extension packs.
- [DECISION] `package.json` exposes `bin.godpowers` at `./bin/install.js`.
- [DECISION] Manual tarball publish is a fallback only when the tag-triggered workflow cannot run, and provenance is unavailable for that publish.

## Watchouts

- [HYPOTHESIS] A release is incomplete until git tag, GitHub release, npm version, package tarball, README badges, CHANGELOG, RELEASE, and local install verification agree.
