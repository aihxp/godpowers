---
pillar: security
status: active
always_load: false
covers: [security review, dependency audit, command execution, release gates]
triggers: [security, harden, audit, exec, shell, dependency, vulnerability]
must_read_with: [repo, quality]
see_also: [deploy]
---

## Scope

- [DECISION] This pillar captures security boundaries for Godpowers runtime and release work.

## Rules

- [DECISION] Treat shell execution helpers and install target paths as security-sensitive code.
- [DECISION] Prefer argument-array process execution over shell-interpolated command strings.
- [DECISION] Run `npm audit --omit=dev` through `npm run test:audit` before release work completes.
- [DECISION] Treat unresolved Critical harden findings as launch blockers.

## Watchouts

- [HYPOTHESIS] Installer and bridge code are the highest-risk surfaces because they write runtime files into multiple AI tool directories.
