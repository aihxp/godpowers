---
pillar: stack
status: active
always_load: false
covers: [runtime stack, package manager, dependencies, tooling]
triggers: [stack, node, npm, package, dependency, runtime]
must_read_with: [repo]
see_also: [quality, deploy]
---

## Scope

- [DECISION] This pillar captures technology choices for Godpowers.

## Stack

- [DECISION] Godpowers uses Node.js with CommonJS runtime modules.
- [DECISION] Godpowers uses npm as package manager and package distribution mechanism.
- [DECISION] Runtime helpers intentionally avoid production dependencies.
- [DECISION] GitHub Actions is the CI and publish automation surface.

## Watchouts

- [HYPOTHESIS] Adding a YAML dependency would simplify parsing but would increase package footprint and installation risk.
