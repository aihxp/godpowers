---
name: god-build-agent
description: |
  Create a custom specialist agent. Walks through the agent's purpose, tools,
  spawning conditions, gates, and output contract. Generates a new file in
  .claude/agents/ following the Godpowers agent template.

  Triggers on: "god build agent", "/god-build-agent", "create custom agent",
  "new specialist"
---

# /god-build-agent

Create a custom specialist agent for this project's specific needs.

## When to use

- Domain-specific expertise the default agents don't cover (e.g., legal
  reviewer, accessibility auditor, ML model evaluator)
- Repeatable specialist work that doesn't fit existing agents

## Process

1. Ask the user 5 questions:
   - **Name**: What should the agent be called? (kebab-case, prefix `god-`)
   - **Purpose**: One sentence: what does this agent do?
   - **Spawned by**: Which slash command(s) invoke it?
   - **Inputs**: What artifacts/context does it read?
   - **Outputs**: What artifact does it write?

2. Optionally ask:
   - **Gate check**: What must be true upstream before this agent runs?
   - **Have-nots**: What failure modes should it check?
   - **Tools needed**: Read, Write, Edit, Bash, Grep, Glob, Task, WebSearch?
   - **Pause conditions**: When should it return to caller for human input?

3. Generate the agent file at `agents/[name].md` using this template:

```markdown
---
name: [name]
description: |
  [One-sentence purpose.]

  [Trigger description.]

  Spawned by: [/slash-command]
tools: [comma-separated tools]
---

# [Agent Title]

[Detailed instructions for the agent.]

## Gate Check
[What must exist on disk before this agent runs.]

## Process
[Step-by-step what the agent does.]

## Output
[What the agent writes, where.]

## Have-Nots
[Named failure modes specific to this agent's output.]

## Pause Conditions
[When to return to caller for human input.]

## Done Criteria
[How the agent knows it's finished.]
```

4. Show the generated file to the user for approval before saving.

5. After approval, also generate a slash command skill if needed at
   `skills/[command].md` that spawns this agent.

## Output

- New agent at `agents/[name].md`
- Optionally a new skill at `skills/[command].md`

## On Completion

```
Custom agent created: agents/[name].md

To use: invoke from your skill or command, or run /god-build-agent again
to create more.
```
