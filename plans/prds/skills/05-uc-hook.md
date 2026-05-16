---
stability: FEATURE_SPEC
last_validated: 2026-05-16
prd_version: 1.2.0
functional_group: HOOK
---

# Use Cases: Agent-Gated Commit Hooks (HOOK)

Sprint 2 of the initiative. Lefthook-based pre-commit and pre-push gate that runs strict checks for wrapped agents and short-circuits for humans. Sprint 2 status: ✅ Completed. Builds on Sprint 1 (tsgo) — the gate runs `bun run typecheck` and depends on the typechecker being fast enough to be usable.

| ID | Title | Description |
|---|---|---|
| UC-HOOK-01 | Agent commit triggers strict pre-commit gate | A wrapped agent's `git commit` runs lint + typecheck in parallel and blocks on failure. |
| UC-HOOK-02 | Human commit bypasses gate cleanly | A plain-terminal `git commit` skips the entire pre-commit phase with minimal overhead. |
| UC-HOOK-03 | Agent push triggers pre-push test gate | A wrapped agent's `git push` runs the test suite and blocks on failure. |
| UC-HOOK-04 | Agents cannot bypass via --no-verify | Claude Code project settings deny `--no-verify` and hook-tamper paths so agents cannot bypass the gate. |

---

## UC-HOOK-01: Agent commit triggers strict pre-commit gate

When a wrapped agent (claude, codex, opencode, mastracode, cursor, gemini, copilot, droid, pi, amp) spawns `git commit`, the agent's shell inherits `SUPERSET_AGENT_ID="<agent-name>"` from the wrapper layer. Lefthook detects the env var and runs the strict pre-commit phase before the commit lands.

### Acceptance Criteria

- ☐ Underlying Agent (via Superset's wrapper layer) can run `git commit` and observe lefthook execute `bun run lint` and `bun run typecheck` in parallel
- ☐ System blocks the commit with a clear error message and a non-zero exit code when either check fails
- ☐ System allows the commit to land when both checks pass
- ☐ Watcher (lefthook) can detect `SUPERSET_AGENT_ID` exported by the agent wrapper and route execution into the strict gate within ~30ms of process startup
- ☐ System completes the full pre-commit gate (lint + typecheck warm cache) in under 5 seconds on a typical developer machine

---

## UC-HOOK-02: Human commit bypasses gate cleanly

When a developer commits from a plain terminal session without `SUPERSET_AGENT_ID` set, lefthook short-circuits the entire pre-commit phase with no lint or typecheck execution.

### Acceptance Criteria

- ☐ User can `git commit` from a plain terminal (no `SUPERSET_AGENT_ID` exported) and observe lefthook output `(skip) hook setting` followed by the commit landing immediately
- ☐ System adds at most 30ms of lefthook startup overhead to a human commit (no lint, no typecheck)
- ☐ User can opt into the strict gate for a single commit via `SUPERSET_AGENT_ID=manual git commit -m "..."` without exporting the env var to the wider shell session
- ☐ User can disable lefthook entirely for a single commit via `LEFTHOOK=0 git commit -m "..."` (escape hatch for emergency commits)

---

## UC-HOOK-03: Agent push triggers pre-push test gate

When a wrapped agent runs `git push`, lefthook runs the full test suite in the pre-push phase before the push proceeds.

### Acceptance Criteria

- ☐ Underlying Agent can run `git push` and observe lefthook execute `bun test` in the pre-push phase
- ☐ System blocks the push with a clear error and non-zero exit code when any test fails
- ☐ System allows the push to proceed when all tests pass
- ☐ User can `git push` from a plain terminal (no `SUPERSET_AGENT_ID`) and observe the pre-push gate skipped cleanly

---

## UC-HOOK-04: Agents cannot bypass via --no-verify or hook tampering

Claude Code project settings deny `git commit --no-verify` (and variants across `push`, `rebase`, `merge`, `cherry-pick`, `am`) and deny Edit/Write into `.claude/settings.json` and `.claude/hooks/**` so wrapped agents cannot tamper with the deny list or hook scripts.

### Acceptance Criteria

- ☐ Underlying Agent (Claude Code) cannot execute `git commit --no-verify` or `git commit -n` because `.claude/settings.json` `permissions.deny` blocks the command at tool-call time before bash invokes git
- ☐ System rejects every variant in the deny list (`--no-verify`, `-n`) across `git commit`, `git push`, `git rebase`, `git merge`, `git cherry-pick`, `git am`
- ☐ System rejects Edit/Write/MultiEdit attempts against `.claude/settings.json`, `.claude/hooks/**` so agents cannot modify the deny list or replace hook scripts
- ☐ User can observe the deny message immediately when an agent attempts a banned command, and the agent receives the rejection back from the tool call
