#!/usr/bin/env bash
# Godpowers SessionStart Hook
# Runs when a Claude Code session begins. Loads .godpowers/PROGRESS.md
# context if a Godpowers project is detected in the working directory.

set -euo pipefail

PROGRESS_FILE=".godpowers/PROGRESS.md"

if [ ! -f "$PROGRESS_FILE" ]; then
  exit 0
fi

# Detect the next pending sub-step from PROGRESS.md
# Looks for the first row with status 'pending' or 'in-flight'
NEXT_SUBSTEP="$(grep -E '\| (pending|in-flight) \|' "$PROGRESS_FILE" | head -1 || true)"

# Map sub-step name to next slash command
NEXT_CMD=""
NEXT_REASON=""
if echo "$NEXT_SUBSTEP" | grep -qi "PRD"; then
  NEXT_CMD="/god-prd"
  NEXT_REASON="Write the PRD"
elif echo "$NEXT_SUBSTEP" | grep -qi "Architecture"; then
  NEXT_CMD="/god-arch"
  NEXT_REASON="Design the architecture (PRD is done)"
elif echo "$NEXT_SUBSTEP" | grep -qi "Roadmap"; then
  NEXT_CMD="/god-roadmap"
  NEXT_REASON="Sequence the work (ARCH is done)"
elif echo "$NEXT_SUBSTEP" | grep -qi "Stack"; then
  NEXT_CMD="/god-stack"
  NEXT_REASON="Pick the tech stack (ARCH is done)"
elif echo "$NEXT_SUBSTEP" | grep -qi "Repo"; then
  NEXT_CMD="/god-repo"
  NEXT_REASON="Scaffold the repo (Stack is done)"
elif echo "$NEXT_SUBSTEP" | grep -qi "Build"; then
  NEXT_CMD="/god-build"
  NEXT_REASON="Build the milestone (Roadmap + Repo done)"
elif echo "$NEXT_SUBSTEP" | grep -qi "Deploy"; then
  NEXT_CMD="/god-deploy"
  NEXT_REASON="Set up deploy pipeline (Build done)"
elif echo "$NEXT_SUBSTEP" | grep -qi "Observe"; then
  NEXT_CMD="/god-observe"
  NEXT_REASON="Wire monitoring (Deploy done)"
elif echo "$NEXT_SUBSTEP" | grep -qi "Harden"; then
  NEXT_CMD="/god-harden"
  NEXT_REASON="Adversarial review (gates Launch)"
elif echo "$NEXT_SUBSTEP" | grep -qi "Launch"; then
  NEXT_CMD="/god-launch"
  NEXT_REASON="Launch the product (Harden clean)"
fi

# Emit context to be included in the session
cat <<EOF
[Godpowers Project Detected]

A Godpowers project is active in this directory. Current state:

$(cat "$PROGRESS_FILE")

EOF

if [ -n "$NEXT_CMD" ]; then
  cat <<EOF
Suggested next: $NEXT_CMD
Why: $NEXT_REASON

Or run /god-mode for the full autonomous arc.
Or /god-next to confirm the suggestion before running.

EOF
else
  cat <<EOF
All planning tiers complete. The project is in steady state.

For ongoing work, route to the right workflow:
  /god-feature       Add a feature to existing project
  /god-hotfix        Urgent production bug fix
  /god-refactor      Safe refactor, no behavior change
  /god-spike         Time-boxed research / proof of concept
  /god-postmortem    Post-incident investigation
  /god-upgrade       Framework or version migration
  /god-docs          Update documentation
  /god-update-deps   Audit and update dependencies
  /god-audit         Score existing artifacts
  /god-debug         Systematic debugging
  /god-status        Show full state

EOF
fi

cat <<EOF
Disk state is authoritative. Run /god-status to re-derive state.
EOF
