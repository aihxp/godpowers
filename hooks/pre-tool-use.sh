#!/usr/bin/env bash
# Godpowers PreToolUse Safety Hook
# Runs before destructive tool calls in a Godpowers project.
# Warns on: rm -rf, git reset --hard, force push to main, deleting .godpowers/

set -euo pipefail

TOOL_NAME="${CLAUDE_TOOL_NAME:-}"
TOOL_INPUT="${CLAUDE_TOOL_INPUT:-}"

if [ ! -d ".godpowers" ]; then
  exit 0
fi

# Pattern matches that should warn
case "$TOOL_INPUT" in
  *"rm -rf .godpowers"*)
    echo "WARNING: About to delete the .godpowers/ directory."
    echo "This destroys all PROGRESS, PRD, ARCH, ROADMAP, and other artifacts."
    echo "If this is intentional, confirm in chat before proceeding."
    exit 1
    ;;
  *"git reset --hard"*)
    echo "WARNING: git reset --hard discards uncommitted work."
    echo "If you have artifacts not yet committed, they will be lost."
    echo "Consider git stash first."
    exit 1
    ;;
  *"git push --force"*)
    echo "WARNING: Force pushing. If pushing to main/master, this can"
    echo "destroy collaborators' work."
    exit 1
    ;;
  *"rm -rf node_modules"*)
    # Allowed: this is just cache
    exit 0
    ;;
esac

exit 0
