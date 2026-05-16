---
title: Multi-Harness Skill Import & Sync
version: 1.1.0
scope_posture: full
human_signal_count: 4
human_signal_last_elicited: 2026-05-15
sprint_count: 4
---

# Multi-Harness Skill Import & Sync — PRD

Bring every coding-agent harness's skills (Claude Code, plugins, project-local, future OpenCode/Mastracode) into Superset chat as typeable slash commands AND auto-invokable model tools, with a unified DB-backed registry, automatic filesystem sync, and per-harness exporters that preserve native skill semantics where supported.

**This PRD is the umbrella for a 4-sprint initiative.** Sprints 1–3 are enabling tooling work (typechecker, agent-gated CI hooks, agent observability) that the skills implementation depends on. Sprint 4 is the actual product feature documented in the use-case files below.

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

This initiative is delivered as **4 stacked sprints**, each its own PR for independent review. Earlier sprints unlock the later ones:

| Sprint | Title | Status | Human Testing Gate | PR |
|---|---|---|---|---|
| **1** | tsgo migration | ✅ DONE in this PR | `bun run typecheck` completes in ≤5s on a clean cache and every package reports 0 errors | `tooling/tsgo` |
| **2** | Agent-gated commit hooks + init-project guardrails | ✅ DONE in next PR | A wrapped-agent `git commit` runs `bun run lint && bun run typecheck`; a plain-terminal `git commit` skips the gate cleanly | `tooling/commit-hooks` (stacked on `tooling/tsgo`) |
| **3** | Fallow integration (agent telemetry / observability) | 🟡 PROPOSED — scope TBD | (to be defined during Sprint 3 planning) | `tooling/fallow` (stacked on `tooling/commit-hooks`) |
| **4** | Multi-Harness Skill Import & Sync — the feature itself | 🔵 FUTURE | The use cases in `04-uc-*.md` are demonstrable end-to-end: import skills from a Claude plugin, author a custom skill, type `/skill-name` in chat across multiple agent harnesses | `skills` (stacked on `tooling/fallow`) |

### Why this sequencing

- **Sprint 1 (tsgo)** is foundational because Sprint 2's pre-commit gate runs `bun run typecheck`; a fast typechecker keeps the gate under a few seconds per commit. Without tsgo the gate is unusably slow.
- **Sprint 2 (commit hooks)** establishes the agent-discipline floor. By the time Sprint 4 implementation starts, every agent commit goes through `lint + typecheck` automatically, catching regressions early.
- **Sprint 3 (Fallow)** — TBD scope. Likely an agent observability / telemetry layer that integrates with the lefthook hook system from Sprint 2. Scope and human testing gate will be defined when Sprint 3 begins.
- **Sprint 4 (skills)** — the product feature documented in this PRD's use-case files. Depends on the typechecker (Sprint 1) for fast iteration, the agent-gated hooks (Sprint 2) for safety while implementing across the monorepo, and (if landed) the Fallow observability (Sprint 3) for production monitoring.

### Branch / PR stack

```
main
  └─ tooling/tsgo                 ← Sprint 1 PR  (this commit)
       └─ tooling/commit-hooks    ← Sprint 2 PR  (stacked)
            └─ tooling/fallow     ← Sprint 3 PR  (stacked, scope TBD)
                 └─ skills        ← Sprint 4 PR  (stacked, implementation)
```

Each downstream branch inherits all upstream content. The skills branch (downstream-most) has the full picture; earlier branches contain a focused slice for review.

## PRD Metadata

| Field | Value |
|---|---|
| Version | 1.1.0 |
| Scope Posture | Full feature (default) |
| Sprint Count | 4 (1 done, 1 in flight, 1 proposed, 1 future) |
| Created | 2026-05-15 |
| Last Updated | 2026-05-16 |
| Lead | product-manager |
| EM | node-planner |
| UI Designer | design-planner |
| Path | `.spec/prds/skills/` |

## Document Index

| File | Section | Stability |
|---|---|---|
| [00-overview.md](./00-overview.md) | Product description, problem statement, solution | PRODUCT_CONTEXT |
| [01-scope.md](./01-scope.md) | In scope / out of scope | FEATURE_SPEC |
| [02-roles.md](./02-roles.md) | User and system roles | PRODUCT_CONTEXT |
| [03-functional-groups.md](./03-functional-groups.md) | Functional group overview and UC summary | FEATURE_SPEC |
| [04-uc-src.md](./04-uc-src.md) | UC-SRC-01 through UC-SRC-03 — Source Configuration | FEATURE_SPEC |
| [05-uc-sync.md](./05-uc-sync.md) | UC-SYNC-01 through UC-SYNC-04 — Discovery & Auto-Sync | FEATURE_SPEC |
| [06-uc-auth.md](./06-uc-auth.md) | UC-AUTH-01 through UC-AUTH-03 — Custom Skill Authoring | FEATURE_SPEC |
| [07-uc-chat.md](./07-uc-chat.md) | UC-CHAT-01 through UC-CHAT-03 — Chat-Time Resolution | FEATURE_SPEC |
| [08-uc-export.md](./08-uc-export.md) | UC-EXPORT-01 through UC-EXPORT-03 — Harness Exporters | FEATURE_SPEC |
| [09-team-contributions.md](./09-team-contributions.md) | Phase outputs from product-manager, node-planner, design-planner | — |
| [10-technical-requirements.md](./10-technical-requirements.md) | Components, schema, API, deps, diagram, phases | CONSTITUTION |
| [scenarios/](./scenarios/) | 32 holdout scenarios across 16 UC directories | — |

## Quick Stats

| Metric | Value |
|---|---|
| Functional Groups | 5 |
| Use Cases | 16 |
| Acceptance Criteria | 102 |
| System Components | 16 |
| External Dependencies | 3 (1 already present) |
| Sprint 4 Implementation Phases | 5 (per `10-technical-requirements.md`) |
| Holdout Scenarios | 32 (in `./scenarios/`) |

## Version History

| Version | Date | Changes | Trigger |
|---|---|---|---|
| 1.0.0 | 2026-05-15 | Initial PRD — 5 groups, 16 UCs, full architecture from brainstorm + 3-specialist team ceremony | New initiative |
| 1.1.0 | 2026-05-16 | Reframed as a 4-sprint umbrella initiative. Sprint 1 (tsgo) and Sprint 2 (commit-hooks) merged into this PRD as enabling pre-sprints. Sprint 3 (Fallow) proposed. Sprint 4 = skills feature. Path moved from `.spec/prd/` to `.spec/prds/skills/`. | Multi-sprint scoping decision |

## Next Steps

- `/kb-sprint-plan` — Build the human-test-gated sprint roadmap from this PRD (will generate `ROADMAP.md` covering all 4 sprints)
- `/test-plan` — Expand sprint 4 acceptance criteria into Given-When-Then test cases (use scenarios in `./scenarios/` as starting points)
- `/pixel-perfect:design` — Generate UI design artifacts for the Skills settings surface (sprint 4)
- `/trd-plan` — Generate detailed TRD with implementation contracts (sprint 4)
