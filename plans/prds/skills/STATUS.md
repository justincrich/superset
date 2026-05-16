# Sprint Status — Multi-Harness Skill Import & Sync

**Last updated:** 2026-05-16

Each row reflects the most recent state of one sprint's PR. Update on every PR open / merge / scope change. This file is the **living index** — separate from [`ROADMAP.md`](./ROADMAP.md) (the stable planning artifact) so frequent status churn doesn't pollute the planning diff.

## At a glance

| Sprint | Status | Branch | PR | Commit | Merged | Notes |
|---|---|---|---|---|---|---|
| 1 — tsgo migration | 🔵 Planned | `skills-tsgo` | — | — | — | Stacked on `skills-pr` |
| 2 — Agent-gated commit hooks | 🔵 Planned | `skills-hooks` | — | — | — | Stacked on `skills-tsgo` |
| 3 — Fallow dead-code gate | 🟡 Proposed | `skills-fallow` | — | — | — | Scope locks in Sprint 3 kickoff; stacked on `skills-hooks` |
| 4 — Skills · Walking Skeleton | 🔵 Planned | `skills-walking-skeleton` | — | — | — | Stacked on `skills-fallow` |
| 5 — Skills · Filesystem Import | 🔵 Planned | `skills-filesystem-import` | — | — | — | Stacked on `skills-walking-skeleton` |
| 6 — Skills · Live Watch | 🔵 Planned | `skills-live-watch` | — | — | — | Stacked on `skills-filesystem-import` |
| 7 — Skills · Claude + Noop Exporters | 🔵 Planned | `skills-claude-exporters` | — | — | — | Stacked on `skills-live-watch` |
| 8 — Skills · Mastra + OpenCode Exporters | 🔵 Planned | `skills-extended-exporters` | — | — | — | Stacked on `skills-claude-exporters` |

This PR (`skills-pr`) merges the PRD documentation onto `main`. All other sprints are downstream stacks; their rows above will gain PR URLs and merge SHAs as they ship.

## Status legend

| Glyph | Meaning |
|---|---|
| 🔵 Planned | Acceptance criteria written, no work started |
| 🟡 Proposed | Scope still being defined |
| 🟠 In flight | Branch active, PR draft open |
| 🟣 In review | PR open, awaiting review |
| ✅ Merged | Landed on `main` |
| 🔴 Blocked | See Notes column |

## Update protocol

- **PR opened**: change Status to `🟣 In review`; fill `PR` column with the URL.
- **PR merged**: change Status to `✅ Merged`; fill `Merged` column with the ISO date and merge-commit SHA; flip the corresponding UC file's frontmatter `status:` field.
- **Scope shift mid-sprint**: do NOT edit `ROADMAP.md` or per-sprint UC files directly. Run `/kb-prd-plan --feedback "<one-line summary>"` to push the change into the PRD (auto-bumps PRD version), then `/kb-sprint-plan --delta-replan` to regenerate `ROADMAP.md` in place, then update this `STATUS.md` row's Notes column with what changed.
- **Branch renamed / abandoned**: update the Branch column; if abandoned, change Status to `🔴 Blocked` and explain in Notes.

## Why this file is separate from ROADMAP.md

- `ROADMAP.md` is the *planning contract* — should stay stable across status churn so reviewers comparing PRs can diff against a stable base.
- `STATUS.md` is the *living index* — updated on every PR open/merge.
- `/kb-sprint-plan --delta-replan` regenerates `ROADMAP.md` but never overwrites `STATUS.md`, so re-planning is safe even when sprints are in flight.
- The split mirrors the project convention of separating planning artifacts (`plans/`) from runtime state — the team is already used to this.
