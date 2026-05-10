---
name: god-extension-add
description: |
  Install a godpowers extension pack from a local directory or
  scaffolded extensions/. Validates the manifest, checks the engines
  compatibility range against the running godpowers version, then
  copies the pack into <runtime>/godpowers-extensions/.

  Triggers on: "god extension add", "/god-extension-add", "install
  pack", "install extension"
---

# /god-extension-add

Install a godpowers extension pack.

## Usage

### `/god-extension-add <source>`

Where `<source>` is either:
- An absolute or relative path to a directory containing `manifest.yaml`
  (e.g. `./extensions/security-pack`)
- A scoped npm package name (e.g. `@godpowers/security-pack`).
  In v0.13.0 only local directories are supported; npm install is on
  the v0.14 ramp.

## Process

1. Resolve `<source>` to a directory with `manifest.yaml`.
2. Parse the manifest. Reject on parse errors.
3. Validate against `schema/extension-manifest.v1.json`:
   - apiVersion, kind, metadata.name (scoped), metadata.version (semver)
   - engines.godpowers range
   - provides block
4. **Capability handshake**: verify the manifest's
   `engines.godpowers` range includes the running godpowers version
   (read from `<runtime>/GODPOWERS_VERSION` or `package.json`).
   Reject on mismatch with a clear message.
5. Copy the pack contents to
   `<runtime>/godpowers-extensions/<pack-name>/`:
   - manifest.yaml
   - agents/, skills/, workflows/, references/ (if present)
6. Append `op:extension.install` to reflog + emit
   `extension.install` event.
7. **Lazy activation**: do NOT load the pack's agents/skills now.
   They're loaded on first invocation of one of their slash commands.
8. Report: pack installed, list provided agents/skills/workflows.

## Subcommands

### `/god-extension-add <source>`
Install with capability check.

### `/god-extension-add <source> --force`
Skip the capability handshake. Use only when you know what you're doing
and accept that the pack may misbehave on a mismatched godpowers.

### `/god-extension-add <source> --dry-run`
Validate the manifest; do not copy.

## Safety

- Never installs a pack that fails the capability handshake without
  `--force`.
- Never executes scripts from the pack at install time. Pack code only
  runs when one of its slash commands is invoked.

## Implementation

Built-in. Calls `lib/extensions.js install(...)`.

## Related

- `/god-extension-list` - show installed extensions
- `/god-extension-info @x/y` - details of one extension
- `/god-extension-remove @x/y` - uninstall
- `/god-test-extension <path>` - run contract tests on a pack before
  publishing
