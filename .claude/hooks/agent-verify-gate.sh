#!/usr/bin/env bash
set -euo pipefail

# Agent-only verification gate.
# Called from Claude Code Stop/SubagentStop hooks and Codex Stop hooks.
# Runs tsgo + biome + fallow on changed files only.
#
# Agent-only by design:
#   - Claude Code / Codex hooks only fire in agent sessions
#   - Belt-and-suspenders: check for known agent env vars
#
# tsgo is @typescript/native-preview — fast native TS typechecker.
# Installed as devDep, resolved directly from node_modules/.bin (no npx overhead).

# Skip if not in an agent session
IS_AGENT=false
[ -n "${CLAUDE_CODE_SESSION_ID:-}" ] && IS_AGENT=true
[ -n "${CODEX_SESSION_ID:-}" ] && IS_AGENT=true
[ -n "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-}" ] && IS_AGENT=true

if [ "$IS_AGENT" = "false" ]; then
  echo "agent-verify-gate: not in agent session, skipping." >&2
  exit 0
fi

FAILED=()
PROJECT_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

# Resolve binaries directly — no npx overhead
TSGO="$PROJECT_ROOT/node_modules/.bin/tsgo"
BIOME="$PROJECT_ROOT/node_modules/.bin/biome"
FALLOW="$PROJECT_ROOT/node_modules/.bin/fallow"

# --- tsgo typecheck on changed packages ---
if [ -x "$TSGO" ]; then
  CHANGED_TS=$(git diff --name-only --diff-filter=ACM main...HEAD -- '*.ts' '*.tsx' 2>/dev/null | head -50 || true)
  if [ -n "$CHANGED_TS" ]; then
    PACKAGES=$(echo "$CHANGED_TS" | grep -oP '^\K(apps/[^/]+|packages/[^/]+)' | sort -u)
    for pkg in $PACKAGES; do
      if [ -f "$PROJECT_ROOT/$pkg/tsconfig.json" ]; then
        if ! "$TSGO" --noEmit -p "$PROJECT_ROOT/$pkg/tsconfig.json" 2>&1; then
          FAILED+=("tsgo: type errors in $pkg")
        fi
      fi
    done
  fi
fi

# --- biome check on changed files ---
if [ -x "$BIOME" ]; then
  CHANGED_ALL=$(git diff --name-only --diff-filter=ACM main...HEAD 2>/dev/null | head -50 || true)
  if [ -n "$CHANGED_ALL" ]; then
    BIOME_FILES=$(echo "$CHANGED_ALL" | grep -E '\.(ts|tsx|js|jsx|json)$' || true)
    if [ -n "$BIOME_FILES" ]; then
      if ! "$BIOME" check $BIOME_FILES 2>&1; then
        FAILED+=("biome: lint/format issues in changed files")
      fi
    fi
  fi
fi

# --- fallow audit on changed files ---
if [ -x "$FALLOW" ]; then
  if ! "$FALLOW" audit --format json --quiet 2>/dev/null | jq -e '.verdict == "pass"' >/dev/null 2>&1; then
    FAILED+=("fallow: audit verdict not pass")
  fi
fi

# --- Report ---
if [ ${#FAILED[@]} -gt 0 ]; then
  echo "agent-verify-gate: ${#FAILED[@]} check(s) failed:" >&2
  for f in "${FAILED[@]}"; do
    echo "  ✗ $f" >&2
  done
  exit 2
fi

exit 0
