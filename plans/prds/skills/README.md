---
title: Multi-Harness Skill Import & Sync
version: 1.3.0
scope_posture: full
human_signal_count: 4
human_signal_last_elicited: 2026-05-15
sprint_count: 8
---

# Multi-Harness Skill Import & Sync — PRD

Bring every coding-agent harness's skills (Claude Code, plugins, project-local, future OpenCode/Mastracode) into Superset chat as typeable slash commands AND auto-invokable model tools, with a unified DB-backed registry, automatic filesystem sync, and per-harness exporters that preserve native skill semantics where supported.

**This PRD is the umbrella for an 8-sprint initiative.** Sprints 1–3 are enabling tooling work (typechecker, agent-gated CI hooks, agent dead-code gate) that the skills implementation depends on. Sprints 4–8 deliver the skills feature itself in 5 user-testable phases.

> 📍 **Live PR / merge tracking**: see [`STATUS.md`](./STATUS.md) for which sprint is in flight right now.

## HUMAN SIGNAL: The Broken Thing

*Elicited 2026-05-15 via `kb-prd-plan` — prompt: "In one sentence: what is broken today that this fixes?"*

> I have skills scattered across `~/.claude/skills/`, plugin caches, project `.agents/skills/`, and on disk in mastracode/OpenCode formats — none of them are usable when I'm chatting through Superset against an agent like Cursor or Codex that doesn't natively know about them, and even the agents that do (Claude Code, mastra) only see their own slice. Superset already owns the unified chat surface; it should also own the unified skill surface.

## HUMAN SIGNAL: North-Star User

*Elicited 2026-05-15 via `kb-prd-plan` — prompt: "Name one user who will notice this, and what they'll do differently after."*

> Me, on a Friday afternoon when I'm switching between a Claude Code workspace and a Codex workspace on the same repo. Today I retype the same instructions or copy a SKILL.md body into the prompt because Codex doesn't see my Claude skills. After this ships, I type `/kb-sprint-plan` in either workspace and the body is inlined for Codex while Claude Code's native skill mechanism gets the same skill via the exporter — one authoring location, every harness benefits.

## HUMAN SIGNAL: Explicit Non-Goals

*Elicited 2026-05-15 via `kb-prd-plan` — prompt: "What would you deliberately NOT build, even if obvious?"*

> Cross-source merge / conflict UI. If two source roots both define `/foo`, the resolver picks one deterministically (custom > priority > age) and the other is reachable via `source:foo`. No diff viewer, no "which one wins" picker, no content-hash dedup. Also no two-way sync — if a user edits the symlinked file inside `~/.claude/skills/superset-skills/`, we don't propagate it back to the Superset DB. Authoring lives in Superset; everything else is read-only mirror.

## HUMAN SIGNAL: Cut Rules

*Elicited 2026-05-15 via `kb-prd-plan` — prompt: "Full-feature scope is assumed. If reality forces you to cut, what gets cut first and why?"*

> The MastraExporter and OpenCodeExporter ship as stubs (NoopExporter behavior) before the typed-command path goes. The universal `/skill-name` typed-command fallback is non-negotiable because it's the only path that works for the 7 harnesses without native skill support; native exporters are a power-user nicety we can land in a follow-up sprint. Settings UI polish (badges, source toggles look-and-feel) gets cut second — the skill list can be plain text rows for v1.

## Sprint Roadmap

This initiative is delivered as **8 stacked PRs**, each its own branch for independent review. Sprints 1–3 are enabling tooling work that unblocks the skills implementation in Sprints 4–8. **No implementation has landed yet**; this PR (`skills-pr`) is documentation-only.

| Sprint | Title | UC Group | Status | Human Testing Gate | PR Branch |
|---|---|---|---|---|---|
| **1** | tsgo migration | [TSGO](./04-uc-tsgo.md) (3 UCs) | 🔵 Planned | `bun run typecheck` completes in ≤5s on warm cache; all 28 packages succeed | `skills-tsgo` |
| **2** | Agent-gated commit hooks + init-project guardrails | [HOOK](./05-uc-hook.md) (4 UCs) | 🔵 Planned | Wrapped-agent `git commit` runs strict lint+typecheck; plain-terminal commit skips clean | `skills-hooks` |
| **3** | Fallow dead-code gate | [FALLOW](./06-uc-fallow.md) (3 UCs) | 🟡 Proposed | TBD — defined in Sprint 3 planning kickoff | `skills-fallow` |
| **4** | Skills · Walking Skeleton (custom-only) | [AUTH](./09-uc-auth.md) + part of [CHAT](./10-uc-chat.md) | 🔵 Planned | User authors a custom skill, types `/skill-name` in chat, sees the body inlined | `skills-walking-skeleton` |
| **5** | Skills · Filesystem Import (external) | [SRC](./07-uc-src.md) + [SYNC](./08-uc-sync.md) (partial) + part of [CHAT](./10-uc-chat.md) | 🔵 Planned | User clicks Refresh in Settings; Claude/plugin/project skills appear with source badges | `skills-filesystem-import` |
| **6** | Skills · Live Watch + Subscriptions | rest of [SYNC](./08-uc-sync.md) + rest of [CHAT](./10-uc-chat.md) | 🔵 Planned | User edits a SKILL.md externally; Settings list reflects the change within 2s without refresh | `skills-live-watch` |
| **7** | Skills · Claude + Noop Exporters | [EXPORT-01 + EXPORT-03](./11-uc-export.md) | 🔵 Planned | A fresh `claude` CLI session auto-invokes a Superset-authored skill via Claude Code's native Skill tool | `skills-claude-exporters` |
| **8** | Skills · Mastra + OpenCode Exporters | [EXPORT-02 + EXPORT-03 promotion](./11-uc-export.md) | 🔵 Planned | A mastracode session calls `load_skill({name})` and receives the body from Superset's registry | `skills-extended-exporters` |

### Why this sequencing

- **Sprint 1 (tsgo)** is foundational because Sprint 2's pre-commit gate will run `bun run typecheck`; a fast typechecker keeps the gate usable. Without tsgo the gate is too slow to be a default.
- **Sprint 2 (commit hooks)** establishes the agent-discipline floor. By the time Sprint 4 starts, every agent commit will go through lint + typecheck automatically, catching regressions early.
- **Sprint 3 (Fallow)** integrates [Fallow](https://docs.fallow.tools/) — a TypeScript codebase-level static analyzer — into the agent-gated pre-commit gate, the agent MCP surface, and CI. Catches the dead-code agents tend to leave behind. Concrete acceptance criteria lock in Sprint 3 kickoff.
- **Sprints 4–8 (skills)** — the product feature documented in the SRC/SYNC/AUTH/CHAT/EXPORT use case groups. Each sprint maps to one user-testable implementation phase from `13-technical-requirements.md`.

### Branch / PR stack

```
main
  └─ skills-pr                     ← THIS PR  (PRD-only documentation)
       └─ skills-tsgo              ← Sprint 1 PR (next)
            └─ skills-hooks        ← Sprint 2 PR (stacked)
                 └─ skills-fallow  ← Sprint 3 PR (proposed)
                      └─ skills-walking-skeleton  ← Sprint 4 PR (and so on for 5–8)
```

Each downstream branch inherits all upstream content. Reviewers see a focused slice per PR.

### Change gating philosophy

Each sprint's PR documents its own **Change gating & blast radius** section so reviewers can see, without searching, how the change is contained and how to roll back if it regresses. The rollup of all sprints' gating defaults lives in [`00-overview.md` § Change gating summary](./00-overview.md#change-gating-summary).

## PRD Metadata

| Field | Value |
|---|---|
| Version | 1.3.0 |
| Scope Posture | Full feature (default) |
| Sprint Count | 8 (1 proposed, 7 planned, 0 in flight) |
| Created | 2026-05-15 |
| Last Updated | 2026-05-16 |
| Lead | product-manager |
| EM | node-planner |
| UI Designer | design-planner |
| Path | `plans/prds/skills/` |

## Document Index

| File | Section | Stability |
|---|---|---|
| [STATUS.md](./STATUS.md) | Live PR / merge tracking per sprint | — |
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution, tooling rationale, change gating summary | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User and system roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and UC summary | FEATURE_SPEC |
| [04-uc-tsgo.md](./04-uc-tsgo.md) | UC-TSGO-01 through UC-TSGO-03 — Typechecker Migration (Sprint 1) | FEATURE_SPEC |
| [05-uc-hook.md](./05-uc-hook.md) | UC-HOOK-01 through UC-HOOK-04 — Agent-Gated Commit Hooks (Sprint 2) | FEATURE_SPEC |
| [06-uc-fallow.md](./06-uc-fallow.md) | UC-FALLOW-01 through UC-FALLOW-03 — Fallow Dead-Code Gate (Sprint 3) | FEATURE_SPEC |
| [07-uc-src.md](./07-uc-src.md) | UC-SRC-01 through UC-SRC-03 — Source Configuration (Sprint 5) | FEATURE_SPEC |
| [08-uc-sync.md](./08-uc-sync.md) | UC-SYNC-01 through UC-SYNC-04 — Discovery & Auto-Sync (Sprints 5–6) | FEATURE_SPEC |
| [09-uc-auth.md](./09-uc-auth.md) | UC-AUTH-01 through UC-AUTH-03 — Custom Skill Authoring (Sprint 4) | FEATURE_SPEC |
| [10-uc-chat.md](./10-uc-chat.md) | UC-CHAT-01 through UC-CHAT-03 — Chat-Time Resolution (Sprints 4–6) | FEATURE_SPEC |
| [11-uc-export.md](./11-uc-export.md) | UC-EXPORT-01 through UC-EXPORT-03 — Harness Exporters (Sprints 7–8) | FEATURE_SPEC |
| [12-team-contributions.md](./12-team-contributions.md) | Phase outputs from product-manager, node-planner, design-planner | — |
| [13-technical-requirements.md](./13-technical-requirements.md) | Components, schema, API, deps, diagram, phases | CONSTITUTION |
| [ROADMAP.md](./ROADMAP.md) | Per-sprint gate sentences, test steps, tasks, dependencies | — |

## Quick Stats

| Metric | Value |
|---|---|
| Functional Groups | 8 (3 tooling + 5 product) |
| Use Cases | 26 (10 tooling + 16 product) |
| Acceptance Criteria | ~150 |
| System Components | 16 |
| External Dependencies | 3 (1 already present in repo) |
| Implementation Phases | 5 (Sprint 4–8 product phases per `13-technical-requirements.md`) |

## Version History

| Version | Date | Changes | Trigger |
|---|---|---|---|
| 1.0.0 | 2026-05-15 | Initial PRD — 5 groups, 16 UCs, full architecture from brainstorm + 3-specialist team ceremony | New initiative |
| 1.1.0 | 2026-05-16 | Reframed as a 4-sprint umbrella initiative. Sprint 1 (tsgo) + Sprint 2 (commit-hooks) added as enabling pre-sprints. Sprint 3 (Fallow) proposed. Path moved from `.spec/prd/` to `.spec/prds/skills/`. | Multi-sprint scoping decision |
| 1.2.0 | 2026-05-16 | Expanded to 8 sprints (5 user-testable skills phases instead of 1 lumped sprint). Added TSGO/HOOK/FALLOW functional groups with 8 UCs documenting the tooling work. Deleted premature `scenarios/` (regenerated JIT via `test-plan` per sprint). Path moved to `plans/prds/skills/` per project AGENTS.md convention. | Team coordination + scope refinement |
| 1.3.0 | 2026-05-16 | PRD split into 8 stacked PR branches (`skills-pr`, `skills-tsgo`, `skills-hooks`, `skills-fallow`, `skills-walking-skeleton`, etc.). Added `STATUS.md` for live PR/merge tracking and per-sprint **Change gating & blast radius** sections so reviewers see containment + rollback path up front. This PR (`skills-pr`) ships documentation only — all sprints in Planned status. | Stacked-PR review protocol |

## Next Steps

- Land this PR (`skills-pr`) to merge the PRD documentation onto `main`.
- Open the next PR in the stack (`skills-tsgo`) — Sprint 1 implementation.
- Track per-PR progress in [`STATUS.md`](./STATUS.md) — update on every PR open / merge / scope change.
- Re-plan after PRD edits via `/kb-sprint-plan plans/prds/skills/README.md --delta-replan` (regenerates `ROADMAP.md` in place without touching `STATUS.md`).
- Expand sprint-level work into per-task files JIT via `/kb-sprint-tasks-plan plans/prds/skills/ROADMAP.md` when each sprint becomes active.
