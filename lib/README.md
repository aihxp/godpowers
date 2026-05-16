# lib/ - Runtime Library

This directory contains the JavaScript runtime modules that support Godpowers
validation, routing, workflow execution, state management, observability, and
package-level integrations.

## Core state and intent

| Module | Purpose |
|--------|---------|
| `state.js` | Read, initialize, validate, and write `.godpowers/state.json`. |
| `state-lock.js` | Coordinate state writes with a lock file. |
| `intent.js` | Read and validate `intent.yaml` from project roots or `.godpowers/`. |
| `checkpoint.js` | Create and inspect resumable checkpoint artifacts. |
| `feature-awareness.js` | Detect and refresh existing-project awareness after runtime upgrades. |
| `repo-doc-sync.js` | Detect and refresh mechanical repository documentation surfaces. |
| `repo-surface-sync.js` | Detect structural drift across commands, routes, packages, agents, workflows, recipes, extensions, and release policy. |
| `budget.js` | Read and enforce configured budget controls. |
| `cost-tracker.js` | Track token and cost estimates from event streams. |

## Events and observability

| Module | Purpose |
|--------|---------|
| `events.js` | Append structured runtime events. |
| `event-reader.js` | Read and aggregate event streams. |
| `otel-exporter.js` | Export Godpowers events in an OpenTelemetry-shaped format. |
| `runtime-audit.js` | Audit runtime health and expected project state. |
| `runtime-test.js` | Provide runtime checks used by package tests. |

## Routing and execution

| Module | Purpose |
|--------|---------|
| `router.js` | Resolve user intent to skills, agents, recipes, and workflows. |
| `recipes.js` | Load and validate routing recipes. |
| `workflow-parser.js` | Parse workflow YAML into executable steps. |
| `workflow-runner.js` | Execute workflow steps with validation hooks. |
| `agent-cache.js` | Cache agent metadata for faster routing. |
| `agent-validator.js` | Validate agent frontmatter and contracts. |

## Artifact quality

| Module | Purpose |
|--------|---------|
| `artifact-linter.js` | Check artifacts for required labels, evidence, and domain precision. |
| `artifact-diff.js` | Compare artifact changes for review and release workflows. |
| `have-nots-validator.js` | Check artifacts against known failure modes. |
| `meta-linter.js` | Validate Godpowers documentation and skill metadata. |
| `story-validator.js` | Validate story artifacts and story lifecycle state. |

## Design, context, and integrations

| Module | Purpose |
|--------|---------|
| `context-writer.js` | Produce tool-specific context files. |
| `context-budget.js` | Keep generated context within budget. |
| `planning-systems.js` | Detect and import GSD, BMAD, and Superpowers planning context. |
| `source-sync.js` | Write managed Godpowers progress back to source-system companion files. |
| `design-detector.js` | Detect design-system conventions. |
| `design-spec.js` | Normalize design specifications. |
| `awesome-design.js` | Validate design guidance against awesome-design rules. |
| `browser-bridge.js` | Connect browser verification flows. |
| `agent-browser-driver.js` | Drive browser-backed agent checks. |
| `skillui-bridge.js` | Bridge skill metadata into UI surfaces. |
| `impeccable-bridge.js` | Bridge runtime checks into impeccable quality workflows. |
| `extensions.js` | Load and validate extension packs. |

## Repository and graph helpers

| Module | Purpose |
|--------|---------|
| `code-scanner.js` | Scan source trees for routing and quality evidence. |
| `cross-artifact-impact.js` | Detect relationships between changed artifacts. |
| `cross-repo-linkage.js` | Track suite-level repository relationships. |
| `drift-detector.js` | Detect context drift between artifacts and implementation. |
| `impact.js` | Summarize expected impact of proposed changes. |
| `linkage.js` | Connect artifacts, stories, and implementation files. |
| `multi-repo-detector.js` | Detect multi-repository workspaces. |
| `reverse-sync.js` | Reflect implementation changes back into artifacts. |
| `review-required.js` | Decide when review gates should block progress. |
| `suite-state.js` | Manage state across registered project suites. |

See `../ARCHITECTURE.md` for system design and `../docs/ROADMAP.md` for planned
runtime work.
