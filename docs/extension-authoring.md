# Extension Authoring

## Purpose

- [DECISION] Godpowers ships a first-party extension scaffold helper so
  external extension authors start from the same manifest and package contract
  as the built-in packs.
- [DECISION] The helper creates files only when they do not already exist
  unless overwrite is requested.
- [DECISION] The scaffold validates its manifest before reporting success.

## CLI

```bash
npx godpowers extension-scaffold --name=@godpowers/my-pack --output=.
```

Optional arguments:

- [DECISION] `--skill=god-my-pack` sets the generated skill name.
- [DECISION] `--agent=god-my-pack-agent` creates a generated agent contract.
- [DECISION] `--workflow=my-pack-workflow` creates a generated workflow YAML.

## Generated Files

- [DECISION] `manifest.yaml` uses `apiVersion: godpowers/v1` and
  `kind: Extension`.
- [DECISION] `package.json` declares `peerDependencies.godpowers` and
  `publishConfig.access: public`.
- [DECISION] `README.md` lists generated extension contents.
- [DECISION] `skills/<skill>.md` contains command frontmatter and placeholder
  three-label guidance.
- [DECISION] Optional `agents/<agent>.md` and `workflows/<workflow>.yaml`
  files are generated when requested.

## Tests

```bash
node scripts/test-extension-authoring.js
node scripts/test-extensions-publish.js
```

- [DECISION] The scaffold helper is package-guarded by
  `scripts/check-package-contents.js`.
- [DECISION] Release-surface sync checks that the authoring test remains wired
  into the release gate.
