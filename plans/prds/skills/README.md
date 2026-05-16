---
title: Multi-Harness Skill Import & Sync
version: 1.2.0
scope_posture: full
human_signal_count: 4
human_signal_last_elicited: 2026-05-15
sprint_count: 8
---

# Multi-Harness Skill Import & Sync — PRD

Bring every coding-agent harness's skills (Claude Code, plugins, project-local, future OpenCode/Mastracode) into Superset chat as typeable slash commands AND auto-invokable model tools, with a unified DB-backed registry, automatic filesystem sync, and per-harness exporters that preserve native skill semantics where supported.

**This PRD is the umbrella for an 8-sprint initiative.** Sprints 1–3 are enabling tooling work (typechecker, agent-gated CI hooks, agent observability) that the skills implementation depends on. Sprints 4–8 deliver the skills feature itself in 5 user-testable phases.

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

This initiative is delivered as **8 stacked sprints**, each its own PR for independent review. Sprints 1–3 are enabling tooling work that unblocks the skills implementation in Sprints 4–8.

| Sprint | Title | UC Group | Status | Human Testing Gate | PR Branch |
|---|---|---|---|---|---|
| **1** | tsgo migration | [TSGO](./04-uc-tsgo.md) (3 UCs) | ✅ DONE | `bun run typecheck` completes in ≤5s on warm cache; all 28 packages succeed | `tooling/tsgo` |
| **2** | Agent-gated commit hooks + init-project guardrails | [HOOK](./05-uc-hook.md) (4 UCs) | ✅ DONE | Wrapped-agent `git commit` runs strict lint+typecheck; plain-terminal commit skips clean | `tooling/commit-hooks` |
| **3** | Fallow integration (agent observability) | [FALLOW](./06-uc-fallow.md) (1 placeholder) | 🟡 PROPOSED | TBD — defined in Sprint 3 planning kickoff | `tooling/fallow` |
| **4** | Skills · Walking Skeleton (custom-only) | [AUTH](./09-uc-auth.md) + part of [CHAT](./10-uc-chat.md) | 🔵 FUTURE | User authors a custom skill, types `/skill-name` in chat, sees the body inlined | `skills` (continued) |
| **5** | Skills · Filesystem Import (external) | [SRC](./07-uc-src.md) + [SYNC](./08-uc-sync.md) (partial) + part of [CHAT](./10-uc-chat.md) | 🔵 FUTURE | User clicks Refresh in Settings; Claude/plugin/project skills appear with source badges | `skills` (continued) |
| **6** | Skills · Live Watch + Subscriptions | rest of [SYNC](./08-uc-sync.md) + rest of [CHAT](./10-uc-chat.md) | 🔵 FUTURE | User edits a SKILL.md externally; Settings list reflects the change within 2s without refresh | `skills` (continued) |
| **7** | Skills · Claude + Noop Exporters | [EXPORT-01 + EXPORT-03](./11-uc-export.md) | 🔵 FUTURE | A fresh `claude` CLI session auto-invokes a Superset-authored skill via Claude Code's native Skill tool | `skills` (continued) |
| **8** | Skills · Mastra + OpenCode Exporters | [EXPORT-02 + EXPORT-03 promotion](./11-uc-export.md) | 🔵 FUTURE | A mastracode session calls `load_skill({name})` and receives the body from Superset's registry | `skills` (continued) |

### Why this sequencing

- **Sprint 1 (tsgo)** is foundational because Sprint 2's pre-commit gate runs `bun run typecheck`; a fast typechecker keeps the gate usable. Without tsgo the gate is too slow to be a default.
- **Sprint 2 (commit hooks)** establishes the agent-discipline floor. By the time Sprint 4 starts, every agent commit goes through lint + typecheck automatically, catching regressions early.
- **Sprint 3 (Fallow)** — TBD scope. Likely an agent observability layer that integrates with the lefthook hooks from Sprint 2. Sprint 3 kickoff defines concrete acceptance criteria.
- **Sprints 4–8 (skills)** — the product feature documented in the SRC/SYNC/AUTH/CHAT/EXPORT use case groups. Each sprint maps to one user-testable implementation phase from `13-technical-requirements.md`.

### Branch / PR stack

```
main
  └─ tooling/tsgo                 ← Sprint 1 PR  (DONE locally)
       └─ tooling/commit-hooks    ← Sprint 2 PR  (DONE locally, stacked)
            └─ tooling/fallow     ← Sprint 3 PR  (PROPOSED, scope TBD)
                 └─ skills        ← Sprints 4–8 PRs (FUTURE, may further split per phase)
```

Each downstream branch inherits all upstream content. The skills branch (downstream-most) has the full picture; earlier branches contain a focused slice for review.

## PRD Metadata

| Field | Value |
|---|---|
| Version | 1.2.0 |
| Scope Posture | Full feature (default) |
| Sprint Count | 8 (2 done, 1 proposed, 5 future) |
| Created | 2026-05-15 |
| Last Updated | 2026-05-16 |
| Lead | product-manager |
| EM | node-planner |
| UI Designer | design-planner |
| Path | `plans/prds/skills/` |

## Document Index

| File | Section | Stability |
|---|---|---|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User and system roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and UC summary | FEATURE_SPEC |
| [04-uc-tsgo.md](./04-uc-tsgo.md) | UC-TSGO-01 through UC-TSGO-03 — Typechecker Migration (Sprint 1) | FEATURE_SPEC |
| [05-uc-hook.md](./05-uc-hook.md) | UC-HOOK-01 through UC-HOOK-04 — Agent-Gated Commit Hooks (Sprint 2) | FEATURE_SPEC |
| [06-uc-fallow.md](./06-uc-fallow.md) | UC-FALLOW-01 — Agent Observability via Fallow (Sprint 3 placeholder) | FEATURE_SPEC |
| [07-uc-src.md](./07-uc-src.md) | UC-SRC-01 through UC-SRC-03 — Source Configuration (Sprint 5) | FEATURE_SPEC |
| [08-uc-sync.md](./08-uc-sync.md) | UC-SYNC-01 through UC-SYNC-04 — Discovery & Auto-Sync (Sprints 5–6) | FEATURE_SPEC |
| [09-uc-auth.md](./09-uc-auth.md) | UC-AUTH-01 through UC-AUTH-03 — Custom Skill Authoring (Sprint 4) | FEATURE_SPEC |
| [10-uc-chat.md](./10-uc-chat.md) | UC-CHAT-01 through UC-CHAT-03 — Chat-Time Resolution (Sprints 4–6) | FEATURE_SPEC |
| [11-uc-export.md](./11-uc-export.md) | UC-EXPORT-01 through UC-EXPORT-03 — Harness Exporters (Sprints 7–8) | FEATURE_SPEC |
| [12-team-contributions.md](./12-team-contributions.md) | Phase outputs from product-manager, node-planner, design-planner | — |
| [13-technical-requirements.md](./13-technical-requirements.md) | Components, schema, API, deps, diagram, phases | CONSTITUTION |

## Quick Stats

| Metric | Value |
|---|---|
| Functional Groups | 8 (3 tooling + 5 product) |
| Use Cases | 24 (8 tooling + 16 product) |
| Acceptance Criteria | ~136 |
| System Components | 16 |
| External Dependencies | 3 (1 already present) |
| Implementation Phases | 5 (Sprint 4–8 product phases per `13-technical-requirements.md`) |

## Version History

| Version | Date | Changes | Trigger |
|---|---|---|---|
| 1.0.0 | 2026-05-15 | Initial PRD — 5 groups, 16 UCs, full architecture from brainstorm + 3-specialist team ceremony | New initiative |
| 1.1.0 | 2026-05-16 | Reframed as a 4-sprint umbrella initiative. Sprint 1 (tsgo) and Sprint 2 (commit-hooks) merged in as enabling pre-sprints. Sprint 3 (Fallow) proposed. Sprint 4 = skills feature. Path moved from `.spec/prd/` to `.spec/prds/skills/`. | Multi-sprint scoping decision |
| 1.2.0 | 2026-05-16 | Expanded to 8 sprints (5 user-testable skills phases instead of 1 lumped sprint). Added TSGO/HOOK/FALLOW functional groups with 8 UCs documenting the tooling work for team coordination. Deleted premature `scenarios/` (regenerate JIT via `test-plan` per sprint). Path moved from `.spec/prds/skills/` to `plans/prds/skills/` to align with project AGENTS.md convention. | Team coordination + scope refinement |

## Next Steps

- `/kb-sprint-plan plans/prds/skills/README.md` — Build the human-test-gated sprint roadmap from this PRD (will generate `ROADMAP.md` covering all 8 sprints)
- `/test-plan` — Expand acceptance criteria into Given-When-Then test cases JIT per sprint (NOT done at PRD level)
- `/pixel-perfect:design` — Generate UI design artifacts for the Skills settings surface (Sprints 4–8)
- `/trd-plan` — Generate detailed TRD with implementation contracts (Sprints 4–8)
