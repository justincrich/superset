---
stability: FEATURE_SPEC
last_validated: 2026-05-16
prd_version: 1.2.0
functional_group: FALLOW
status: proposed
---

# Use Cases: Fallow Dead-Code Gate (FALLOW)

Sprint 3 of the initiative. **🟡 PROPOSED — scope outline below; concrete acceptance criteria locked in Sprint 3 planning kickoff.**

[Fallow](https://docs.fallow.tools/) is a TypeScript/JavaScript static analyzer that detects unused files, unused exports, unused dependencies, and code duplication. Sprint 3 integrates Fallow into the multi-agent workflow so dead code agents leave behind is caught at commit time, queryable during planning, and blocked at CI. See the rationale in [`00-overview.md` § Why the tooling investments → Sprint 3](./00-overview.md#sprint-3--fallow-integration--proposed--catches-the-cruft-agents-leave-behind) for the full case.

| ID | Title | Description |
|---|---|---|
| UC-FALLOW-01 | Block agent commits that regress dead-code count | Lefthook's agent-gated pre-commit phase from Sprint 2 also runs `fallow dead-code`. The commit fails if the unused-export count regresses relative to the tracked baseline. |
| UC-FALLOW-02 | Query Fallow via MCP during agent planning | Agents (Claude Code, Cursor, others with MCP support) can query Fallow's MCP server during their planning phase to identify existing dead exports and avoid creating new ones. |
| UC-FALLOW-03 | CI gate blocks PRs with dead-code regression | The CI pipeline runs `fallow dead-code` and fails PRs whose unused-file or unused-export count increased without an explicit override note in the PR body. |

---

## UC-FALLOW-01: Block agent commits that regress dead-code count

When a wrapped agent commits, the Sprint 2 pre-commit phase additionally runs `npx fallow dead-code --json` and compares the count of unused exports against a tracked baseline file in the repo. If the count regressed, the commit is blocked.

### Acceptance Criteria

- ☐ Underlying Agent (via Superset wrapper) can run `git commit` and observe lefthook execute `fallow dead-code` as part of the strict gate alongside `bun run lint` and `bun run typecheck`
- ☐ System reads the tracked dead-code baseline from a versioned file (e.g., `.fallow/baseline.json`) and computes the diff
- ☐ System blocks the commit when the new dead-code count exceeds the baseline, with an error message listing the new unused exports and their file paths
- ☐ System allows the commit when the dead-code count is equal to or below the baseline
- ☐ User can update the baseline intentionally by running `npx fallow baseline --update` (a separate, human-only command not on the hot path)
- ☐ Human commits in plain terminals continue to skip the entire gate (UC-HOOK-02 invariant preserved)

### Open scope question

Should the baseline be **strict** (zero new dead exports allowed) or **budget-based** (allow N new exports per PR for in-flight refactors)? Sprint 3 planning decides.

---

## UC-FALLOW-02: Query Fallow via MCP during agent planning

Fallow exposes an MCP server that agent CLIs (Claude Code, Cursor, others with MCP support) can connect to. Agents query this MCP during planning to understand the dead-code landscape *before* writing new code, so they don't recreate existing utilities or export functions that already exist unused.

### Acceptance Criteria

- ☐ User can configure Fallow's MCP server in their project's `.mcp.json` (or per-harness equivalent)
- ☐ Underlying Agent (Claude Code, Cursor, mastracode if it adopts MCP) can query Fallow's MCP and receive a list of unused files, exports, and dependencies as tool results
- ☐ Underlying Agent can reference Fallow's findings in its planning output (e.g., "before writing this new utility, I checked Fallow and confirmed the existing `formatDate` in `packages/shared` is unused — I'll resurrect that instead of creating a new one")
- ☐ System documents the MCP setup in `plans/prds/skills/13-technical-requirements.md` and in the project's main README so the integration is reproducible by new team members

### Open scope question

Does Sprint 3 ship the MCP integration as a project-level `.mcp.json` entry (every workspace gets it) or as a per-harness wrapper integration (only Superset-managed agents get it)? Sprint 3 planning decides.

---

## UC-FALLOW-03: CI gate blocks PRs with dead-code regression

The CI workflow (GitHub Actions or equivalent) runs `fallow dead-code` against the PR's head ref and compares against `main`. PRs whose dead-code count increased fail the check, blocking merge.

### Acceptance Criteria

- ☐ User can open a PR that introduces new unused exports and observe the CI dead-code check fail with a clear delta report (e.g., "+3 unused exports across 2 files: …")
- ☐ User can override the gate with an explicit PR-body note (e.g., `fallow-allow: <one-line reason>`) for in-flight refactors that intentionally introduce dead code mid-stack
- ☐ System runs the Fallow check in CI in under 60 seconds for the full monorepo (acceptable CI overhead)
- ☐ System reports the Fallow check status alongside lint and typecheck in the PR check list

### Open scope question

Does Sprint 3 ship the GitHub Actions workflow file in this PR, or does the user's CI team own the CI config (with Sprint 3 only providing the recipe)? Sprint 3 planning decides based on the team's CI ownership convention.

---

## Sprint 3 Pre-Kickoff Checklist

When Sprint 3 starts:

1. **Resolve the three open scope questions above** (baseline strictness, MCP scope, CI ownership).
2. **Re-run `/kb-prd-plan --feedback "Fallow scope decisions: <answers>"`** to lock the decisions into this file and bump PRD to 1.3.0.
3. **Re-run `/kb-sprint-plan plans/prds/skills/README.md --delta-replan`** to regenerate Sprint 3's gate and test steps in the roadmap with concrete content.
4. **Run a spike** to verify Fallow's MCP server is stable enough for daily agent use before committing to UC-FALLOW-02 in the locked acceptance criteria.
