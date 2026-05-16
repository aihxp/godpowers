# Godpowers Glossary

> Canonical vocabulary. Every doc, agent prompt, error message, and command
> must use these consistently.

## Core abstractions

**Tier**: a phase of the development workflow (0: Orchestration, 1: Planning, 2: Building, 3: Shipping).

**Sub-step**: a bounded unit within a tier (PRD, ARCH, Roadmap, Stack, Repo, Build, Deploy, Observe, Launch, Harden).

**Artifact**: a file on disk produced by a sub-step. Has a contract.

**Skill**: a slash command. Thin handle that spawns agents.

**Agent**: a specialist that turns sub-step inputs into the artifact. Fresh context per spawn.

**Gate**: a passing upstream artifact required for a downstream sub-step.

**Have-not**: a named, grep-testable failure mode. 200 in the catalog.

**Mode**: a run flavor (greenfield A, gap-fill B, audit C, multi-repo D-future).

**Scale**: project size (trivial, small, medium, large, enterprise). Drives which tiers and personas activate.

## Quality concepts

**Substitution test**: replace product name with competitor's; if sentence still reads true, it decides nothing. Rewrite.

**Three-label test**: every sentence is exactly DECISION, HYPOTHESIS, or OPEN QUESTION. Anything unlabeled is theater.

**Theater**: sentences that read fine but say nothing measurable, decidable, or testable.

**AI-slop**: output that passes substitution test. Reads generic.

**Paper artifact**: document exists but mechanism does not (e.g., "runbook" never executed, "SLO" with no error budget policy).

**Phantom resume**: agent claims tier is done but artifact is missing from disk.

**Ghost handoff**: tier invoked before its upstream artifact exists.

**Drift**: gap between what state.json claims and what disk actually contains.

## Workflow concepts

**Pause**: a genuine human-in-the-loop checkpoint. Five legitimate categories (ambiguous intent, human-only flip-point, statistical tie, Critical security finding, brand voice).

**YOLO**: auto-resolve all pauses except security Criticals. Logs to YOLO-DECISIONS.md.

**Workstream**: an isolated parallel branch with its own state.

**Vertical slice**: one user-visible behavior end-to-end. Not "set up the database".

**Wave**: a set of slices that can run in parallel within a build phase.

**Reflog**: append-only log of state-changing operations. Enables /god-undo.

**Trash**: recoverable deletion to `.godpowers/.trash/`.

## Agent concepts

**Fresh context**: each spawned agent gets a new context window. Defeats context rot.

**TDD enforcement**: tests written before implementation. Code-before-test triggers rewrite.

**Two-stage review**: god-spec-reviewer (compliance) then god-quality-reviewer (craft). Both must pass for commit.

**Atomic commit**: one slice = one commit. Never multiple slices in one commit.

**Critical-finding gate**: launch is blocked if god-harden-auditor finds Critical. Even --yolo.

## Extension concepts

**Extension**: a skill pack from npm. Adds new agents, skills, workflows, have-nots.

**Lazy activation**: extension files don't load until a slash command from that extension is invoked.

**Capability handshake**: extension declares `engines.godpowers: "^X.Y.0"` and install fails on mismatch.

**Skill pack**: another name for an extension. Same thing.
