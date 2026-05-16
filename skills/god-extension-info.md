---
name: god-extension-info
description: |
  Show details of one installed godpowers extension pack: manifest,
  provided surface, activation rules, install path, version
  compatibility.

  Triggers on: "god extension info", "/god-extension-info", "show
  pack details", "what does X pack do"
---

# /god-extension-info

Show details for one installed extension.

## Usage

### `/god-extension-info <pack-name>`

Example:
- `/god-extension-info @godpowers/security-pack`

## Output

```
EXTENSION: @godpowers/security-pack v0.1.0
Path: ~/.claude/godpowers-extensions/@godpowers/security-pack
Description:
  Compliance-aware security agents for SOC 2, HIPAA, and PCI-DSS
  audits. Layers on top of god-harden-auditor with regulation-
  specific checks.

Engines:
  godpowers: >=2.0.0 <3.0.0  (compatible with running v2.0.0? YES)

Provides:
  Agents (3):
    - god-soc2-auditor
    - god-hipaa-auditor
    - god-pci-auditor
  Skills (3):
    - /god-soc2-audit
    - /god-hipaa-audit
    - /god-pci-audit
  Workflows (3):
    - soc2-arc, hipaa-arc, pci-arc
  Have-nots prefixes:
    - SOC2  (SOC 2 Common Criteria)
    - HIPAA (Security Rule 164.308/310/312)
    - PCI   (PCI-DSS 4.0)

Activation (lazy; loads on first call):
  - /god-soc2-audit
  - /god-hipaa-audit
  - /god-pci-audit
  - /god-extension-list
```

## Subcommands

### `/god-extension-info <name>`
Single pack details.

### `/god-extension-info <name> --json`
Machine-readable.

## Implementation

Built-in. Calls `lib/extensions.js info(runtimeConfigDir, packName)`.

## Related

- `/god-extension-list` - all installed packs
- `/god-extension-add` - install
- `/god-extension-remove` - uninstall
