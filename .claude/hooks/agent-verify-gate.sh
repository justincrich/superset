#!/usr/bin/env bash
set -euo pipefail

# Agent-only verification gate.
# Called from Claude Code Stop and SubagentStop hooks.
# These hooks ONLY fire inside Claude Code sessions, but this guard provides
# belt-and-suspenders agent detection via env vars.

# Claude Code sets these env vars in every session.
# If neither is set, we're not in an agent session — skip.
if [ -z "${CLAUDE_CODE_SESSION_ID:-}" ] && [ -z "${CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS:-}" ]; then
  echo "agent-verify-gate: not in Claude Code session, skipping." >&2
  exit 0
fi

# Run the verify pipeline from lefthook.yml
exec lefthook run verify
