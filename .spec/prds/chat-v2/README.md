---
title: Chat UI V2
status: research
version: 0.0.1
prd_authored: false
research_complete: 2026-05-19
brainstorm_complete: false
---

# Chat UI V2 — PRD folder

Re-architect the desktop chat experience so it (a) competes with Codex / Conductor on quality, (b) protects user privacy by keeping conversation content on-host, and (c) ships a protocol that scales to web and React Native without a second rewrite.

## Status

Pre-PRD. The Notion source has been digested and the V1 implementation has been crawled — both captured under `research/`. The next step is a brainstorm that lands the open decisions in `research/04-open-decisions.md`, after which the PRD proper (`00-overview.md`, `01-scope.md`, `02-roles.md`, …) gets authored alongside the team-contribution and technical-requirement sections.

## Layout

```
.spec/prds/chat-v2/
├── README.md                  ← you are here
└── research/
    ├── README.md              ← research index
    ├── 00-method.md           ← sources, scope, what's covered
    ├── 01-prd-digest.md       ← V2 PRD as authored in Notion
    ├── 02-v1-state.md         ← current chat implementation crawl
    ├── 03-delta.md            ← V1 → V2 change table
    ├── 04-open-decisions.md   ← decisions to land before designing
    └── 05-file-pointers.md    ← code map for designers / implementers
```

## Sources

- **PRD draft (authoritative source):** [Chat UI V2 — Notion](https://www.notion.so/Chat-UI-V2-365b9d5bf61681f1908bf98108d80e2d)
- **V1 implementation:** this branch's working tree, rebased onto `fork/main` (`5da928183`)
- **Compare:** parallel chat-polish work in `.claude/worktrees/chat-polish-spec/.spec/prd/` (different scope — V2-GA blockers vs this clean-slate V2)

## What this is not

- Not a plan. The brainstorm + the PRD-proper produce the plan.
- Not a commitment. The PRD-proper authors the contract; this folder is exploratory until then.
- Not exhaustive. Crawl focused on the chat surface (`packages/chat`, `packages/host-service/.../chat`, `apps/desktop/.../ChatPane`, related schemas). Surrounding systems (workspaces, MCP, auth-storage internals) only covered where they touch the chat boundary.
