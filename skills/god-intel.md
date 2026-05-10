---
name: god-intel
description: |
  Query, inspect, or refresh codebase intelligence in .godpowers/codebase/.
  Lightweight alternative to /god-map-codebase; reads existing intelligence
  rather than regenerating.

  Triggers on: "god intel", "/god-intel", "codebase intel", "codebase info"
---

# /god-intel

Query the codebase intelligence files.

## Subcommands

### `/god-intel show [focus]`
Display contents. `focus` is one of: tech, architecture, quality, concerns.
Default: all.

### `/god-intel refresh [focus]`
Re-run a specific mapper. Updates that file only. Faster than
/god-map-codebase.

### `/god-intel age`
Show how stale each intel file is. Suggests refresh if >30 days old.

## When to use

- During /god-feature: "what's the existing pattern for auth?"
- During /god-debug: "where might this bug live?"
- During /god-refactor: "what's the impact surface?"

## Pre-requisite

`/god-map-codebase` must have run at least once.
