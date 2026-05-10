---
name: god-test-runtime
description: |
  Run headless browser verification of the running app: design audit
  (rendered styles vs DESIGN.md tokens, real-DOM WCAG contrast) and
  functional tests (PRD acceptance criteria as user flows). Uses
  Playwright (local) or Vercel Browser API (cloud).

  Triggers on: "god test runtime", "/god-test-runtime", "browser test",
  "design audit", "verify rendering", "run e2e", "run tests"
---

# /god-test-runtime

Drive a headless browser to verify the app actually matches what
artifacts say it should be. The third axis of verification (after
static lint and linkage drift).

## Forms

| Form | Action |
|---|---|
| `/god-test-runtime` | Full pipeline: audit + functional tests |
| `/god-test-runtime audit [url]` | Design audit only |
| `/god-test-runtime test [url]` | Functional tests only |
| `/god-test-runtime --backend agent-browser` | Force vercel-labs/agent-browser CLI (preferred) |
| `/god-test-runtime --backend playwright` | Force Playwright (local) |
| `/god-test-runtime --backend vercel` | Force Vercel Browser (cloud) |
| `/god-test-runtime --backend auto` | Default cascade: agent-browser -> Playwright -> Vercel |
| `/god-test-runtime --strict` | Promote warnings to errors |
| `/god-test-runtime --no-runtime` | Skip; surface as warning (use sparingly) |

## Default URL resolution

If `[url]` not given:
1. Read `state.json.deploy.url` if present (production / preview)
2. Else read `state.json.dev-server.url` if dev server is running
3. Else default to `http://localhost:3000`

## Process

1. Verify `.godpowers/` exists.
2. Spawn `god-browser-tester` agent in fresh context with the requested
   mode (audit / test / both) and resolved URL.
3. god-browser-tester:
   - Detects backend (Playwright or Vercel Browser)
   - Launches headless browser (NEVER `headless: false`)
   - Navigates, extracts computed styles, runs flows, captures screenshots
   - Aggregates findings
   - Writes reports to `.godpowers/runtime/<run-id>/`
   - Critical findings -> critical-finding gate (pauses default + --yolo)
   - Other findings -> REVIEW-REQUIRED.md batch
4. Report results to user.

## Headless contract

Non-negotiable. The bridge layer (`lib/browser-bridge.js`) refuses to
pass `headless: false`. There is no opt-out flag for that. If you want
a visual session, use a separate Playwright instance outside Godpowers.

`--no-runtime` skips the entire runtime step (e.g., for backend-only
projects with no UI to verify). It does NOT mean "show me the browser."

## Output

Per run, in `.godpowers/runtime/<run-id>/`:
- `audit-report.json` - design verification findings with severity
- `test-report.json` - functional verification with pass/fail per requirement
- `screenshots/<name>.png` - reference screenshots
- `summary.md` - human-readable summary

State updates:
- `state.json.runtime.last-run-id` <- runId
- `state.json.runtime.backend` <- 'playwright' | 'vercel-browser'
- `state.json.runtime.audit.summary` <- { errors, warnings, infos }
- `state.json.runtime.test.summary` <- { passed, failed, total }

Events to events.jsonl:
- `runtime.start`, `runtime.audit-complete`, `runtime.test-complete`,
  `runtime.critical`, `runtime.end`

## Critical findings (gate triggers)

- Any P-MUST-* requirement fails its acceptance flow
- WCAG AA fail on text-on-background components
- Component drift > 10% (more than 1 in 10 selectors mismatch DESIGN.md)

These pause both default mode AND --yolo. Lint errors and runtime
critical findings have the same gate semantics.

## When this runs automatically

| Workflow | Mode | Gate semantics |
|---|---|---|
| `/god-build` (post-wave, opt-in) | audit | warning |
| `/god-launch` | full pipeline | hard gate; criticals block |
| `/god-harden` | a11y portion | warning |
| `/god-design` (post-change) | audit | warning |

## Output to events.jsonl

```json
{ "name": "runtime.start", "url": "https://...", "backend": "playwright" }
{ "name": "runtime.audit-complete", "errors": 0, "warnings": 2, "infos": 1 }
{ "name": "runtime.test-complete", "passed": 5, "failed": 1, "total": 6 }
{ "name": "runtime.critical", "trigger": "P-MUST-01-failed" }
{ "name": "runtime.end", "runId": "..." }
```

## Backend choice in detail

Three native backends supported, with a preference cascade:

### 1. agent-browser (preferred) - vercel-labs/agent-browser

[github.com/vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser).
Native Rust CLI built specifically for AI agents. Features:

- Accessibility-tree-first interface with stable refs (`@e1`, `@e2`)
- Semantic locators (`find role button --name "Submit"`)
- No Node.js daemon required (single binary)
- Headless by default; optimized for AI workflows
- Built-in `chat` mode for natural-language control

Install:
```bash
npm install -g agent-browser
agent-browser install   # Downloads Chrome from Chrome for Testing
```

This is our preferred backend. Maps better to PRD acceptance phrasing
("user clicks Submit" -> `find role button click --name "Submit"`).

### 2. Playwright - microsoft/playwright

Full programmatic browser automation. Used when agent-browser absent.
Headless launch only (`headless: true` enforced by bridge).

### 3. Vercel Browser API - hosted

For projects deployed to Vercel with `@vercel/browser-api` configured.
Browser runs in cloud; API is HTTP. Headless by definition.

## Alternative backends (not bundled, easy to swap)

The bridge layer (`lib/browser-bridge.js`) is structured so additional
backends can be added with a small adapter. Notable alternatives users
have integrated:

| Tool | Repo | Strength |
|---|---|---|
| Stagehand | github.com/browserbase/stagehand | AI-first observe/act/extract API over Playwright |
| browser-use | github.com/browser-use/browser-use | Vision + DOM hybrid (Python) |
| Steel | github.com/steel-dev/steel-browser | Open-source Browserbase alternative |
| AgentQL | github.com/tinyfish-io/agentql | Stable query language over Playwright |
| Skyvern | github.com/skyvern-ai/skyvern | Screenshot-driven workflow automation |

We don't ship adapters for these; the bridge pattern (detect-and-delegate)
makes it straightforward to write your own.

## See also

- `lib/browser-bridge.js` - cascade detection + launch (agent-browser, Playwright, Vercel Browser)
- `lib/agent-browser-driver.js` - vercel-labs/agent-browser CLI wrapper
- `lib/runtime-audit.js` - design verification on rendered DOM (backend-aware)
- `lib/runtime-test.js` - PRD acceptance to user-flow assertions (backend-aware)
- `agents/god-browser-tester.md` - lifecycle owner of runtime checks
