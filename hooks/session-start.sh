#!/usr/bin/env bash
# Godpowers SessionStart Hook
#
# Runs when an AI session begins. Detects a Godpowers project and emits
# a short context block. Defers all routing logic to /god-next so this
# hook stays a single source of truth: "if you see a Godpowers project,
# ask /god-next for the next step."
#
# The hook intentionally does NOT do its own sub-step -> command
# mapping. That logic lives in lib/recipes.js + /god-next + the
# orchestrator. Keeping it out of the hook prevents three independent
# copies of the routing knowledge drifting apart (a real risk
# identified in the 2026-05-10 deep audit).

set -euo pipefail

PROGRESS_FILE=".godpowers/PROGRESS.md"
STATE_FILE=".godpowers/state.json"
CHECKPOINT_FILE=".godpowers/CHECKPOINT.md"

# Exit silently if not in a Godpowers project
if [ ! -f "$PROGRESS_FILE" ] && [ ! -f "$STATE_FILE" ] && [ ! -f "$CHECKPOINT_FILE" ]; then
  exit 0
fi

# Print a short context banner
cat <<'EOF'
[Godpowers Project Detected]

A Godpowers project is active in this directory.
EOF

# Prefer CHECKPOINT.md (the orient-a-new-session pin) when present
if [ -f "$CHECKPOINT_FILE" ]; then
  echo ""
  echo "Checkpoint ($CHECKPOINT_FILE) - read this FIRST:"
  echo ""
  # Print the "Where you are" section + Next suggested command
  sed -n '/^## Where you are/,/^## Last actions/p' "$CHECKPOINT_FILE" | head -20
  sed -n '/^## Next suggested command/,/^##/p' "$CHECKPOINT_FILE" | head -6
  echo ""
  echo "Run /god-locate for full orientation."
  echo ""
fi

# Show the state summary, preferring state.json (authoritative)
if [ -f "$STATE_FILE" ]; then
  echo ""
  echo "State snapshot ($STATE_FILE):"
  # Extract just project/mode/phase if jq is available; otherwise tail
  if command -v jq >/dev/null 2>&1; then
    jq -r '
      "  project: " + (.project.name // "(unnamed)"),
      "  mode: " + (.mode // "?") + (if ."mode-d-suite" then " (in suite)" else "" end),
      "  lifecycle: " + (."lifecycle-phase" // "in-arc")
    ' "$STATE_FILE" 2>/dev/null || head -20 "$STATE_FILE"
  else
    head -20 "$STATE_FILE"
  fi
elif [ -f "$PROGRESS_FILE" ]; then
  echo ""
  echo "Progress ($PROGRESS_FILE):"
  cat "$PROGRESS_FILE"
fi

cat <<'EOF'

Next step: run /god-next  (it inspects disk state and proposes the next command)
Or:       /god-mode for the full autonomous arc
Or:       /god-help to see the catalog
Or:       /god-status for the full project snapshot

Disk state is authoritative. Conversation memory is not.
EOF
