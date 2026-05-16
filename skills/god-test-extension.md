---
name: god-test-extension
description: |
  Run contract tests against an extension pack BEFORE publishing.
  Validates the manifest, checks every declared skill/agent/workflow
  exists in the pack directory, verifies the engines.godpowers range
  resolves, and reports findings. Use during pack development.

  Triggers on: "god test extension", "/god-test-extension", "contract
  test pack", "validate pack"
---

# /god-test-extension

Run contract tests on a godpowers extension pack source.

## Usage

### `/god-test-extension <source-dir>`

Example:
- `/god-test-extension ./extensions/security-pack`

## What it checks

| Check | What it asserts |
|---|---|
| Manifest exists | `<source-dir>/manifest.yaml` is present |
| Manifest parses | Valid YAML |
| apiVersion + kind | `godpowers/v1` + `Extension` |
| metadata.name | Scoped npm-style: `@org/name` |
| metadata.version | SemVer `X.Y.Z` |
| engines.godpowers | Resolves to a non-empty SemVer range |
| provides | Has at least one of agents/skills/workflows |
| Provided agents exist | Each `provides.agents[i]` has a file at `<source-dir>/agents/<name>.md` |
| Provided skills exist | Each `provides.skills[i]` is a slash command with a matching `<source-dir>/skills/<name>.md` |
| Skill frontmatter | Each declared skill has valid frontmatter (name + description) |
| Agent frontmatter | Each declared agent has valid frontmatter (name + description + tools) |
| have-nots prefixes | Each prefix matches `[A-Z][A-Z0-9]*` |
| Activation | At least one activation rule |
| No prohibited code | No top-level `child_process` calls in pack scripts |

## Output

```
EXTENSION CONTRACT TEST: ./extensions/security-pack

Manifest: ./extensions/security-pack/manifest.yaml  [OK]
apiVersion: godpowers/v1                            [OK]
metadata.name: @godpowers/security-pack             [OK]
metadata.version: 1.0.0                             [OK]
engines.godpowers: >=2.0.0 <3.0.0                  [OK]

Provided surface:
  agents/god-soc2-auditor.md   [OK]
  agents/god-hipaa-auditor.md  [OK]
  agents/god-pci-auditor.md    [OK]
  skills/god-soc2-audit.md     [OK]
  skills/god-hipaa-audit.md    [OK]
  skills/god-pci-audit.md      [OK]

Have-nots prefixes: SOC2 HIPAA PCI                  [OK]

Result: 14 checks passed, 0 failed
Ready to publish.
```

## Subcommands

### `/god-test-extension <dir>`
Full contract check.

### `/god-test-extension <dir> --json`
Machine-readable findings.

### `/god-test-extension <dir> --strict`
Treat warnings as errors. Use in CI.

## Implementation

Built-in. Calls `lib/extensions.js` and `lib/agent-validator.js`.
No agent spawn.

## Related

- `/god-agent-audit` - validate agents in the main repo
- `/god-extension-add` - install a passing pack
