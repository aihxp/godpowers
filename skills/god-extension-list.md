---
name: god-extension-list
description: |
  Show all godpowers extension packs currently installed in the
  active runtime. Each entry: name, version, install path, summary
  of what it provides.

  Triggers on: "god extension list", "/god-extension-list", "what
  extensions are installed", "show packs"
---

# /god-extension-list

List installed godpowers extensions.

## Output

```
INSTALLED EXTENSIONS (3)

@godpowers/security-pack  v1.0.0
  Path: ~/.claude/godpowers-extensions/@godpowers/security-pack
  Skills: /god-soc2-audit, /god-hipaa-audit, /god-pci-audit
  Agents: god-soc2-auditor, god-hipaa-auditor, god-pci-auditor
  Workflows: soc2-arc, hipaa-arc, pci-arc

@godpowers/launch-pack    v1.0.0
  Path: ~/.claude/godpowers-extensions/@godpowers/launch-pack
  Skills: /god-show-hn, /god-product-hunt, /god-indie-hackers, /god-oss-release

@godpowers/data-pack      v0.9.0
  Path: ~/.claude/godpowers-extensions/@godpowers/data-pack
  Skills: /god-etl, /god-ml-feature, /god-dashboard
```

## Subcommands

### `/god-extension-list`
List all installed packs (summary view).

### `/god-extension-list --json`
Machine-readable output.

### `/god-extension-list --verbose`
Include manifest activation rules + have-nots prefixes for each pack.

## Implementation

Built-in. Calls `lib/extensions.js list(runtimeConfigDir)`.

## Related

- `/god-extension-add` - install a pack
- `/god-extension-info @x/y` - one pack in detail
- `/god-extension-remove` - uninstall
