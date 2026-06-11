---
name: god-surface
description: |
  Preview or apply a runtime command surface profile after install. Lets users
  switch between core, builder, maintainer, suite, and full without reinstalling
  from scratch.

  Triggers on: "god surface", "/god-surface", "switch command surface",
  "change profile", "show fewer commands"
---

# /god-surface

Preview or apply a runtime command surface profile after install. Use the
existing installer profiles: `core`, `builder`, `maintainer`, `suite`, and
`full`.

## Process

1. Resolve `<runtimeRoot>/lib/surface-profile.js`.
2. Default to dry-run preview.
3. Require an explicit runtime target such as `--codex`, `--claude`,
   `--runtime=codex`, or `--all` before applying.
4. Apply only when the user passes `--apply`.
5. End with `Next commands:`.

## Examples

```bash
/god-surface --profile=core --dry-run
/god-surface --profile=builder --runtime=codex --dry-run
/god-surface --profile=maintainer --runtime=claude --apply
```

Terminal equivalent:

```bash
npx godpowers surface --profile=builder --codex --global --dry-run
npx godpowers surface --profile=builder --codex --global --apply
```

## Output Shape

```text
The builder profile would install the product-building command surface for Codex.

Attention:
- Dry-run only. No installed skills changed.

Next commands:
- /god-surface --profile=builder --runtime=codex --apply: Apply the previewed Codex surface.
- /god-help: Open the compact help view after switching.
- /god-help all: Show the complete catalog.
```

## Rules

- Do not apply a profile unless the user explicitly asks with `--apply`.
- Do not change project `.godpowers/` state.
- Do not invent new profile names.
- Keep the profile source of truth in `<runtimeRoot>/lib/install-profiles.js`.
