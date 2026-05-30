# Accountability Hardening Plan

## Purpose

- [DECISION] Godpowers should strengthen planning truth, install calm, dependency safety, artifact durability, and repair visibility.
- [DECISION] The work strengthens the Godpowers promise of accountable AI development with receipts on disk.
- [DECISION] The work preserves the public slash-command model, Pillars context, labeled artifacts, reverse sync, host guarantees, and release gates.
- [DECISION] The work does not add a second phase orchestrator or compatibility layer.

## Product Boundary

- [DECISION] Godpowers is a proof and governance layer for AI-built software.
- [DECISION] Borrowed operating patterns must reinforce proof, safety, traceability, and release confidence.
- [DECISION] Borrowed operating patterns must not expand the command surface unless a smaller install surface is introduced at the same time.

## Delivered Capabilities

- [DECISION] Source-grounded planning now has a runtime helper that checks planned existing files and symbols before execution.
- [DECISION] Install profiles now let users choose `core`, `builder`, `maintainer`, `suite`, or `full` command surfaces.
- [DECISION] Package legitimacy checks now classify missing packages, typo risk, stale packages, and missing repository signals.
- [DECISION] Load-bearing state and linkage writes now use atomic replacement for JSON and managed markdown writes.
- [DECISION] Executor repair now has a small taxonomy for retry, decompose, prune, and escalate decisions.
- [DECISION] Package identity now has one runtime seam for package name, version, repository, docs, and npx command text.

## Acceptance

- [DECISION] `scripts/test-source-grounding.js` verifies grounded files, grounded symbols, missing references, unchecked references, and ignored directories.
- [DECISION] `scripts/test-installer-profiles.js` verifies profile parsing, profile selection, profile install output, and unknown-profile rejection.
- [DECISION] `scripts/test-package-legitimacy.js` verifies healthy package metadata, missing packages, typo risk, stale packages, missing repositories, and name normalization.
- [DECISION] `scripts/test-atomic-write.js` verifies failed writes leave prior content untouched and state still round-trips.
- [DECISION] `scripts/test-executor-repair.js` verifies retry, decompose, prune, escalate, and review-visible repair history.
- [DECISION] `scripts/test-package-identity.js` verifies package identity mirrors package metadata.

## Follow-Up Questions

- [OPEN QUESTION] Should source grounding grow tree-sitter or language-server support after the search-based helper proves useful? Owner: maintainer. Due: after dogfood.
- [OPEN QUESTION] Should package legitimacy checks become a CLI helper for CI and local project use? Owner: maintainer. Due: before the next minor release.
- [OPEN QUESTION] Should install profiles filter specialist agents as well as slash commands? Owner: maintainer. Due: after first user feedback on profile installs.
