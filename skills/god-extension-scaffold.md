---
name: god-extension-scaffold
description: |
  Create a publishable Godpowers extension pack skeleton from inside the
  slash-command UX. Wraps the same extension authoring helper exposed by
  `npx godpowers extension-scaffold`, then routes to contract testing.

  Triggers on: "god extension scaffold", "/god-extension-scaffold",
  "create extension pack", "author extension pack", "new extension pack",
  "extend godpowers"
---

# /god-extension-scaffold

Create a Godpowers extension pack skeleton.

## Usage

### `/god-extension-scaffold --name=@godpowers/my-pack --output=.`

Optional arguments:

- `--skill=custom-pack-command` sets the generated skill name.
- `--agent=custom-pack-agent` creates a generated agent contract.
- `--workflow=my-pack-workflow` creates a generated workflow YAML.
- `--overwrite` allows replacing existing scaffold files.

## Process

1. Parse the requested package name, output root, optional skill, optional
   agent, and optional workflow.
2. Call `lib/extension-authoring.js scaffold(...)`.
3. Validate the generated `manifest.yaml` against the extension manifest
   contract.
4. Report the created pack path and written files.
5. Suggest `/god-test-extension <pack-dir>` before install or publish.

## Output

```
Extension scaffold created: ./godpowers-my-pack

Written:
  manifest.yaml
  package.json
  README.md
  skills/custom-pack-command.md

Suggested next: /god-test-extension ./godpowers-my-pack
```

## Implementation

Built-in. Calls `lib/extension-authoring.js scaffold(...)`.

The terminal equivalent remains:

```bash
npx godpowers extension-scaffold --name=@godpowers/my-pack --output=.
```

## Related

- `/god-test-extension <path>` - contract test the pack before install or publish
- `/god-extension-add <path>` - install a passing pack
- `/god-extension-list` - verify the pack is visible in the runtime
