# Godpowers MCP Companion

- [DECISION] `@godpowers/mcp` is the first-party MCP companion package for read-only Godpowers runtime tools.
- [DECISION] The main `godpowers` package does not depend on the MCP SDK at runtime.
- [DECISION] The companion server exposes `status`, `next`, `gate_check`, `lint_artifact`, and `trace_requirement`.
- [DECISION] Mutation tools, artifact writes, state advancement, and route changes are intentionally out of scope.
- [DECISION] Host MCP registration is opt-in and must be requested by the user.

## Install

```bash
npm install -g @godpowers/mcp
```

## Run

```bash
godpowers-mcp --project /path/to/project
```

## Host Config Shape

```json
{
  "command": "godpowers-mcp",
  "args": ["--project", "/path/to/project"]
}
```

- [DECISION] Use `npx godpowers mcp-info --project=.` from the main package to print the current setup shape.
