/**
 * semantic-release configuration.
 *
 * On every push to main, computes the next version from
 * conventional-commit history since the last tag, generates release
 * notes, prepends a CHANGELOG entry, publishes to npm with provenance,
 * tags the commit, and creates a GitHub Release.
 *
 * Triggered by .github/workflows/release.yml. Requires repo secrets:
 *   NPM_TOKEN     - granular publish-only token scoped to godpowers
 *   GITHUB_TOKEN  - provided automatically by GitHub Actions
 *
 * Conventional-commit -> version-bump rules (default):
 *   feat:         -> minor
 *   fix: / perf:  -> patch
 *   BREAKING CHANGE footer -> major
 *   chore / docs / refactor / test / build / ci / style / release
 *                 -> no release
 *
 * To skip a release on an otherwise feat/fix commit, include
 * `[skip release]` in the commit message.
 */

module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    ['@semantic-release/changelog', {
      changelogFile: 'CHANGELOG.md',
      changelogTitle: '# Changelog\n\nAll notable changes to Godpowers will be documented in this file.\n\nThe format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),\nand this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).'
    }],
    ['@semantic-release/npm', {
      npmPublish: true
    }],
    ['@semantic-release/git', {
      assets: ['CHANGELOG.md', 'package.json'],
      message: 'chore(release): ${nextRelease.version} [skip ci]\n\n${nextRelease.notes}'
    }],
    '@semantic-release/github'
  ]
};
