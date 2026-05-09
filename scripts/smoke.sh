#!/usr/bin/env bash
# Godpowers Smoke Test
# Validates the slash command + specialist agent structure

set -euo pipefail

PASS=0
FAIL=0
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"

pass() { echo "  + PASS: $1"; PASS=$((PASS + 1)); }
fail() { echo "  x FAIL: $1"; FAIL=$((FAIL + 1)); }

echo ""
echo "  Godpowers Smoke Test"
echo "  ===================="
echo ""

# 1. SKILL.md exists and has frontmatter
if [ -f "$ROOT/SKILL.md" ]; then
  if head -1 "$ROOT/SKILL.md" | grep -q "^---"; then
    pass "SKILL.md exists with frontmatter"
  else
    fail "SKILL.md missing frontmatter"
  fi
else
  fail "SKILL.md not found"
fi

# 2. All skill files have frontmatter, name, description
for skill in "$ROOT/skills/"*.md; do
  name="$(basename "$skill")"
  if head -1 "$skill" | grep -q "^---"; then
    pass "skills/$name has frontmatter"
  else
    fail "skills/$name missing frontmatter"
  fi
  if grep -q "^name:" "$skill"; then
    pass "skills/$name has name field"
  else
    fail "skills/$name missing name field"
  fi
  if grep -q "^description:" "$skill"; then
    pass "skills/$name has description field"
  else
    fail "skills/$name missing description field"
  fi
done

# 3. All agent files have frontmatter, name, description
for agent in "$ROOT/agents/"*.md; do
  name="$(basename "$agent")"
  if head -1 "$agent" | grep -q "^---"; then
    pass "agents/$name has frontmatter"
  else
    fail "agents/$name missing frontmatter"
  fi
  if grep -q "^name:" "$agent"; then
    pass "agents/$name has name field"
  else
    fail "agents/$name missing name field"
  fi
done

# 4. No em/en dashes
if grep -rn $'[\xe2\x80\x93\xe2\x80\x94]' "$ROOT/SKILL.md" "$ROOT/skills/" "$ROOT/agents/" "$ROOT/README.md" 2>/dev/null; then
  fail "Em/en dashes found in content"
else
  pass "No em/en dashes in content"
fi

# 5. bin/install.js exists and has node shebang
if [ -f "$ROOT/bin/install.js" ]; then
  if head -1 "$ROOT/bin/install.js" | grep -q "node"; then
    pass "bin/install.js has node shebang"
  else
    fail "bin/install.js missing node shebang"
  fi
else
  fail "bin/install.js not found"
fi

# 6. package.json has correct name and bin
if [ -f "$ROOT/package.json" ]; then
  if grep -q '"godpowers"' "$ROOT/package.json"; then
    pass "package.json has correct name"
  else
    fail "package.json has wrong name"
  fi
  if grep -q '"./bin/install.js"' "$ROOT/package.json"; then
    pass "package.json points to install.js"
  else
    fail "package.json missing or wrong bin path"
  fi
fi

# 7. Each tier skill spawns the right specialist agent
# Format: skill_name:agent_name (bash 3.2 compatible)
PAIRS="
god-prd:god-pm
god-arch:god-architect
god-roadmap:god-roadmapper
god-stack:god-stack-selector
god-repo:god-repo-scaffolder
god-build:god-planner
god-deploy:god-deploy-engineer
god-observe:god-observability-engineer
god-launch:god-launch-strategist
god-harden:god-harden-auditor
god-debug:god-debugger
god-mode:god-orchestrator
"

while IFS=: read -r skill_name agent_name; do
  [ -z "$skill_name" ] && continue
  skill_file="$ROOT/skills/${skill_name}.md"
  agent_file="$ROOT/agents/${agent_name}.md"

  if [ -f "$skill_file" ] && grep -q "$agent_name" "$skill_file"; then
    pass "skills/${skill_name}.md spawns ${agent_name}"
  else
    fail "skills/${skill_name}.md does not reference ${agent_name}"
  fi

  if [ -f "$agent_file" ]; then
    pass "agents/${agent_name}.md exists"
  else
    fail "agents/${agent_name}.md missing"
  fi
done <<EOF
$PAIRS
EOF

# 8. Tier 1+ agents document have-nots (the actual quality definitions)
for tier_agent in god-pm god-architect god-roadmapper god-stack-selector god-repo-scaffolder god-deploy-engineer god-observability-engineer god-launch-strategist god-harden-auditor; do
  agent_file="$ROOT/agents/${tier_agent}.md"
  if [ -f "$agent_file" ]; then
    if grep -qi "have-not" "$agent_file"; then
      pass "agents/${tier_agent}.md documents have-nots"
    else
      fail "agents/${tier_agent}.md missing have-nots section"
    fi
  fi
done

# 9. Tier 1+ agents document gate checks
for gated_agent in god-architect god-roadmapper god-stack-selector god-repo-scaffolder god-planner god-deploy-engineer god-observability-engineer god-launch-strategist god-harden-auditor; do
  agent_file="$ROOT/agents/${gated_agent}.md"
  if [ -f "$agent_file" ]; then
    if grep -qi "gate check" "$agent_file"; then
      pass "agents/${gated_agent}.md has gate check"
    else
      fail "agents/${gated_agent}.md missing gate check"
    fi
  fi
done

# 10. Hooks present and executable
if [ -f "$ROOT/hooks/session-start.sh" ]; then
  if [ -x "$ROOT/hooks/session-start.sh" ]; then
    pass "hooks/session-start.sh is executable"
  else
    fail "hooks/session-start.sh not executable"
  fi
fi

if [ -f "$ROOT/hooks/pre-tool-use.sh" ]; then
  if [ -x "$ROOT/hooks/pre-tool-use.sh" ]; then
    pass "hooks/pre-tool-use.sh is executable"
  else
    fail "hooks/pre-tool-use.sh not executable"
  fi
fi

# 11. god-mode autonomous routing: orchestrator references every tier's agent
ORCH="$ROOT/agents/god-orchestrator.md"
for required_agent in god-pm god-architect god-roadmapper god-stack-selector god-repo-scaffolder god-planner god-executor god-spec-reviewer god-quality-reviewer god-deploy-engineer god-observability-engineer god-harden-auditor god-launch-strategist; do
  if grep -q "$required_agent" "$ORCH"; then
    pass "orchestrator routes to $required_agent"
  else
    fail "orchestrator does not route to $required_agent"
  fi
done

# 12. Build phase orchestration: orchestrator documents the 4-agent build chain
if grep -qi "build phase orchestration" "$ORCH"; then
  pass "orchestrator documents Build phase multi-agent chain"
else
  fail "orchestrator missing Build phase orchestration section"
fi

# 13. YOLO handling: every pause-capable agent documents YOLO behavior
for yolo_agent in god-pm god-architect god-roadmapper god-stack-selector god-launch-strategist god-harden-auditor; do
  agent_file="$ROOT/agents/${yolo_agent}.md"
  if [ -f "$agent_file" ]; then
    if grep -qi "yolo" "$agent_file"; then
      pass "agents/${yolo_agent}.md documents YOLO handling"
    else
      fail "agents/${yolo_agent}.md missing YOLO handling"
    fi
  fi
done

# 14. Critical-finding carve-out: harden auditor must NOT auto-resolve Criticals
if grep -qi "Critical findings.*cannot.*auto" "$ROOT/agents/god-harden-auditor.md" || \
   grep -qi "yolo CANNOT auto-resolve" "$ROOT/agents/god-harden-auditor.md"; then
  pass "harden-auditor preserves Critical-finding pause under --yolo"
else
  fail "harden-auditor missing Critical-finding --yolo carve-out"
fi

echo ""
echo "  Results: $PASS passed, $FAIL failed"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
