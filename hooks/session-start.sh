#!/usr/bin/env bash
# Godpowers SessionStart Hook
# Runs when a Claude Code session begins. Loads .godpowers/PROGRESS.md
# context if a Godpowers project is detected in the working directory.

set -euo pipefail

PROGRESS_FILE=".godpowers/PROGRESS.md"

if [ ! -f "$PROGRESS_FILE" ]; then
  exit 0
fi

# Emit context to be included in the session
cat <<EOF
[Godpowers Project Detected]

A Godpowers project is active in this directory. Current state:

$(cat "$PROGRESS_FILE")

Available slash commands:
  /god-mode      Run full autonomous arc
  /god-status    Re-derive state from disk
  /god-audit     Score artifacts against have-nots
  /god-prd, /god-arch, /god-roadmap, /god-stack
  /god-repo, /god-build
  /god-deploy, /god-observe, /god-launch, /god-harden
  /god-debug, /god-review

Disk state is authoritative. Run /god-status before assuming state.
EOF
