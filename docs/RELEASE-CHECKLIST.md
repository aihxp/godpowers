# Release Checklist

Use this checklist before publishing a public Godpowers release.

## Version And Notes

- Confirm `package.json` has the intended version.
- Confirm `README.md`, `CHANGELOG.md`, and `RELEASE.md` mention the same version.
- Confirm `CHANGELOG.md` explains user-visible changes, guardrails, and release risks.
- Confirm `RELEASE.md` explains what is stable, what changed, and what is deferred.
- Confirm `lib/repo-doc-sync.detect(projectRoot)` reports `fresh` before publishing.
- Confirm `lib/repo-surface-sync.detect(projectRoot)` reports `fresh` before publishing.
- Confirm `lib/route-quality-sync.detect(projectRoot)` reports `fresh` before publishing.
- Confirm `lib/recipe-coverage-sync.detect(projectRoot)` reports `fresh` before publishing.
- Confirm `lib/release-surface-sync.detect(projectRoot)` reports `fresh` before publishing.

## Local Verification

Run the one-command release gate:

```bash
npm run release:check
```

This includes:

- Full test suite through `npm test`.
- Security and surface audit through `npm run test:audit`.
- Package contents assertion through `npm run pack:check`.
- Repository documentation sync tests through `node scripts/test-repo-doc-sync.js`.
- Repository surface sync tests through `node scripts/test-repo-surface-sync.js`.
- Automation surface sync tests through `node scripts/test-automation-surface-sync.js`.
- Host capability tests through `node scripts/test-host-capabilities.js`.
- Extension authoring scaffold tests through `node scripts/test-extension-authoring.js`.
- Dogfood runner tests through `node scripts/test-dogfood-runner.js`.
- Extension publish readiness tests through `node scripts/test-extensions-publish.js`.
- Mode D suite tests through `node scripts/test-mode-d.js`.
- Installer smoke tests through `node scripts/test-install-smoke.js`.

Before publish, confirm release-surface sync still sees those dogfood,
extension, suite, and installer gates in `package.json`.

## Package Surface

Confirm the npm payload includes:

- `bin/install.js`
- `SKILL.md`
- `skills/`
- `agents/`
- `templates/`
- `references/`
- `routing/`
- `workflows/`
- `schema/`
- `lib/`
- `fixtures/`
- `extensions/`

Confirm the npm payload excludes:

- `.github/`
- `docs/`
- `scripts/`
- `tests/`
- `examples/`
- `node_modules/`
- generated `*.tgz` files

## Git And Npm

- Commit release changes on `main`.
- Push `main`.
- Create a `vX.Y.Z` git tag on the release commit.
- Push the tag.
- Prefer the tag-triggered GitHub publish workflow for npm provenance.
- Verify `npm view godpowers@latest version` after publish.
- Verify the local installer can install the published version.

## Post-Release

- Keep package tarballs out of the repository.
- Record any release follow-up as a GitHub issue or backlog item.
- Do not start the next version until the published package, git tag, and docs agree.
