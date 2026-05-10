---
name: god-suite-release
description: |
  Coordinate a release across siblings in a Mode D suite. When repo A
  bumps version, scan all dependents for impact and propagate updates.

  Triggers on: "god suite release", "/god-suite-release",
  "coordinated release", "bump and propagate"
---

# /god-suite-release

A version bump that knows about dependents. Different from `/god-launch`
(per-repo); this coordinates ACROSS repos.

## Process

1. Verify suite is registered.
2. Prompt for: which repo, new version, release notes.
3. Spawn `god-coordinator` in `release` mode.
4. god-coordinator:
   - Scans suite version-table for repos that depend on the bumped repo
   - For each dependent: spawns its `god-orchestrator` with a
     `version-bump` directive (NOT a full arc)
   - Aggregates results per-repo
   - Updates `.godpowers/suite-config.yaml` version-table to match
   - Appends to `.godpowers/suite/SYNC-LOG.md`
5. Reports aggregated outcome (bumped + propagated repos).

## Forms

| Form | Action |
|---|---|
| `/god-suite-release <repo> <version>` | Bump and propagate |
| `/god-suite-release <repo> <version> --dry-run` | Show impact; no changes |
| `/god-suite-release <repo> <version> --no-propagate` | Bump only the named repo |

## What this does

- Updates the bumped repo's version (via its orchestrator)
- For each dependent: updates its package.json declared version
- Updates suite-config.yaml version-table
- Appends release entry to SYNC-LOG.md
- Triggers per-repo `/god-launch` (or equivalent) only when the user
  explicitly confirms each launch

## What this does NOT do

- Auto-launch all dependents (each repo's launch gate still runs;
  user confirms)
- Bypass per-repo critical-finding gates
- Modify code beyond what version bumps require

## Quarterback rule preserved

Each repo's `god-orchestrator` retains full control over its own
release. The coordinator orchestrates the cross-repo coordination
without bypassing per-repo gates.
