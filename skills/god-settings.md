---
name: god-settings
description: |
  View or modify project settings stored in .godpowers/intent.yaml.
  Get/set yolo mode, conservative mode, executor preferences, etc.

  Triggers on: "god settings", "/god-settings", "config", "preferences"
---

# /god-settings

View or modify project configuration.

## Subcommands

### `/god-settings list`
Show all settings from intent.yaml.

### `/god-settings get <key>`
Show a specific setting.
Example: `/god-settings get config.yolo`

### `/god-settings set <key> <value>`
Set a value. Validates against schema before writing.
Example: `/god-settings set config.yolo true`

## Available settings

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| config.yolo | boolean | false | Auto-resolve pauses by default |
| config.conservative | boolean | false | Pause more often |
| config.trash-retention-days | int | 30 | When to gc .trash/ |
| executors.default | string | claude-code | Preferred AI tool |
| executors.fallback | string | -- | Backup AI tool |

## Output

```
Settings updated: config.yolo = true
.godpowers/intent.yaml saved.

Note: this is the project default. Per-command flags still override.
```
