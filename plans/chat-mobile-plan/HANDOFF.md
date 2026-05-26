---
title: Mobile Chat v2 — Handoff
date: 2026-05-26
author: Justin Rich
prd: ./README.md
roadmap: ./ROADMAP.md
plan_branch: chat-mobile-plan
---

# Mobile Chat v2 — Handoff

## At a glance

| | |
|---|---|
| **Plan location** | `plans/chat-mobile-plan/` on branch `chat-mobile-plan` |
| **PRD PR (closed, docs-only)** | [#4828 — docs(plans): Mobile Chat v2 PRD](https://github.com/superset-sh/superset/pull/4828) — closed 2026-05-24, never merged. Plan continues to evolve directly on the `chat-mobile-plan` branch (tip: `1c34bc586`) and is the parent of every sprint branch. |
| **Sprint 01** | 🟣 In Review — **7 PRs open** (full stack, see below). ROADMAP marks ✅ Completed since all task work shipped. |
| **Sprint 02** | 🟠 In Flight — **all 17 task commits are on the branch**, but **no PR has been opened yet** and **53 WIP files are uncommitted**. Worktree: `.claude/worktrees/chat-mobile-sprint-2/` (105 commits ahead of `main`). |
| **Sprints 03–07** | 🔵 Planned — task files written, ready for `/kb-run-sprint` dispatch. Total **53 tasks remaining, ~108 hours of estimate**. |
| **PRD scope** | 6 functional groups · 32 use cases · 19 system components · 5 new external deps |

---

## Sprint 01 — In Review (7 PRs, stacked)

**Status:** All implementation shipped. PR stack is open, awaiting review/merge. Each PR targets `main` and stacks onto its predecessor's branch.

| # | PR | Initiative / Wave | Branch | State |
|---|----|-------------------|--------|-------|
| 1 of 7 | [#4874](https://github.com/superset-sh/superset/pull/4874) | **Storybook + ember theme tooling** — RN Storybook scaffold, root toggle, build-time stripping, ember palette in `global.css` + `lib/theme.ts`, Geist fonts | `chat-mobile-sprint-1-tooling` | OPEN |
| 2 of 7 | [#4875](https://github.com/superset-sh/superset/pull/4875) | **Port existing components to ember + Storybook stories** — 8 first-party app components + 28 vendor primitives ingested into Storybook with per-component token-compliance audit | `chat-mobile-sprint-1-ported` | OPEN |
| 3 of 7 | [#4870](https://github.com/superset-sh/superset/pull/4870) | **Wave 1 — chat-view atoms (10)** — `IconButton`, `Pill`, `StatusDot`, `StreamingCursor`, `ToolStatusRule`, `ScrollFade`, `HitTargetWrapper`, `FabBase`, `ProgressDots`, `ToastBase` | `chat-mobile-sprint-1-atoms` | OPEN |
| 4 of 7 | [#4871](https://github.com/superset-sh/superset/pull/4871) | **Wave 2 — chat-view molecules (19)** — composer/picker tier, message tier, pause tier, header tier, code block, banner | `chat-mobile-sprint-1-molecules` | OPEN |
| 5 of 7 | [#4872](https://github.com/superset-sh/superset/pull/4872) | **Wave 3 — chat-view organisms (10)** — `ChatHeader`, `ChatThread`, `Composer`, `SlashCommandPopover`, `PickerPopover`, `PauseApprovalOverlay`, `PlanReviewScreen`, `BottomSheet`, `LoadingSkeleton`, `ConfirmationDialog` | `chat-mobile-sprint-1-organisms` | OPEN |
| 6 of 7 | [#4911](https://github.com/superset-sh/superset/pull/4911) | **Wave 4 — chat-view view stories + REMED-009 router** — `ChatView` orchestrator + 22 view stories (18 chat-shell + 4 modal/sheet) | `chat-mobile-sprint-1-views` | OPEN |
| 7 of 7 | [#4912](https://github.com/superset-sh/superset/pull/4912) | **Wave 5 — sessions-list tier (TS-4 closes)** — 7 molecules + 4 organisms + 10 sessions-list view stories | `chat-mobile-sprint-1-sessions-list` | OPEN |

**Component count as shipped:** 10 atoms · 26 molecules · 14 organisms · 30 view stories.

**Deferred from Sprint 01 → integrated in later sprints:** 9 components (NewChatFab, SessionSearchBar, FilterButton, MessageMarkdown, PlanBlock + ReasoningBlock, SubagentExecutionMessage, TiptapPromptEditor + SlashCommandNode/FileMentionNode, PermissionModePicker, ThinkingLevelPicker, PendingQuestionSheet, PushPrePromptScreen, RebableInSettingsBanner, HostOfflineBanner). See `ROADMAP.md` § "Deferred from Sprint 01" for target sprints.

**Path forward (Sprint 01):**
1. Land the stack root-to-tip: review/merge `#4874 → #4875 → #4870 → #4871 → #4872 → #4911 → #4912`. Each PR's base ref points at the prior sibling — merging downward rebases the chain automatically.
2. After the full stack merges, `chat-mobile-sprint-2` should be rebased onto fresh `main`.

### Precursor / cross-cutting PRs (already merged or closed)

PRs outside the Sprint 01 stack that materially shape this initiative — every one maps to a sprint scope item or a sprint AC.

| PR | State | Maps to | Why it matters |
|----|-------|---------|----------------|
| [#4828](https://github.com/superset-sh/superset/pull/4828) | CLOSED 2026-05-24 (never merged) | **Whole plan** — PRD docs root | Original docs-only PRD PR. PRD content now lives directly on the `chat-mobile-plan` branch (tip `1c34bc586`); every sprint branch is a child of this branch. |
| [#4869](https://github.com/superset-sh/superset/pull/4869) | CLOSED 2026-05-23 | Sprint 01 (superseded) | Original "Sprint 1 / PR 1 of 4" infra branch. Re-split into the current 7-PR stack (`#4874..#4912`); the rewritten stack ships the same scope at smaller review granularity. |
| [#4815](https://github.com/superset-sh/superset/pull/4815) | MERGED 2026-05-21 | **Foundation for every sprint** — `11-technical-requirements/04-dependencies.md` (Expo SDK + uniwind baseline) | Brought `apps/mobile` to Expo SDK 56 + uniwind 1.7 — the Tailwind-class-parity baseline that the whole "parallel RN tree, design-token parity" architecture in `00-overview.md` depends on. Without this, none of the Sprint 01 pixel-perfect work compiles. |
| [#4821](https://github.com/superset-sh/superset/pull/4821) | MERGED 2026-05-21 | **Sprint 02 → MOB-INFRA-003** (Maestro login sub-flow) | Adds the `DevSignInButton` to `apps/mobile` that Sprint 02's Maestro `subflows/login.yaml` drives. AC-wise: Sprint 02 Human Test Step 1 ("Sign in on the mobile app") only works on simulators because this PR exposed a one-tap dev sign-in path. |
| [#4778](https://github.com/superset-sh/superset/pull/4778) | MERGED 2026-05-20 | **Sprint 02 → MOB-INFRA-003** (web parity for dev sign-in) | Web-side sibling of `#4821`. Establishes the dev sign-in pattern that `#4821` mirrors to mobile. Cross-device sign-in shared between web + mobile Maestro infra. |
| [#4786](https://github.com/superset-sh/superset/pull/4786) | CLOSED | Superseded by #4778 | Earlier web dev sign-in attempt; superseded. No live impact. |
| [#4779](https://github.com/superset-sh/superset/pull/4779) | CLOSED | Superseded by `.superset/setup.local.sh` | Earlier `.env.example` default attempt; superseded by the contributor-env scaffolding now in the Sprint 02 WIP (`.superset/lib/setup/steps.sh`, `.superset/scripts/`). |
| [#4791](https://github.com/superset-sh/superset/pull/4791) | MERGED 2026-05-21 | **Sprint 04 → UC-COMP-02 desktop parity** (new-session flicker fix, SUPER-753) | Desktop chat-start flicker fix. Not a mobile change, but it is the desktop-side equivalent of behavior Sprint 04's `MOB-COMP-008` (`chat.sendMessage` optimistic append) and `MOB-NAV-009-INT` (`chat.createSession` from FAB) must mirror — keep the flicker-free invariant on mobile during the optimistic-append step. |

### Out-of-scope authored PRs (not part of chat-mobile-plan)

For completeness, recent authored PRs that are **not** chat-mobile work and should not be conflated with this plan: `#4936` (SUPER-783 automation), `#4893` / `#4848` (desktop diff/xterm), `#4884` / `#4856` / `#4853` / `#4866` / `#4865` / `#4836` / `#4817` / `#4783` / `#4749` / `#4738` / `#4726` / `#4725`. They share a contributor but not a roadmap.

---

## Sprint 02 — In Flight (no PR open yet)

**Worktree:** `/Users/justinrich/Projects/superset/.claude/worktrees/chat-mobile-sprint-2/`
**Branch:** `chat-mobile-sprint-2` (105 commits ahead of `main`)
**Plan:** `plans/chat-mobile-plan/tasks/sprint-02-sessions-list-integration/SPRINT.md`
**Human Test Gate:** Signed-in user uses the full real sessions list backed by Electric collections — project-scoped flat recency list, search, filter sheet, applied-tag chips, empty states; desktop-created session appears in mobile within ~3s.

### Task completion status

All 17 sprint-02 tasks have shipped commits on the branch:

| Wave | Task | Title | Merge commit |
|------|------|-------|--------------|
| 0 | MOB-NAV-004-V2-UI | NewChatFab domain wrapper | `ff36ef931` |
| 0 | MOB-NAV-007-UI | SessionSearchBar domain wrapper | `2495fafe5` |
| 0 | MOB-NAV-017-UI | FilterButton domain wrapper | `f6bade651` |
| 1 | MOB-INFRA-003 | Install Maestro + seed `.maestro/` with login sub-flow | `b203b1f6d` |
| 1 | MOB-INFRA-005-V2 | Add `chat_sessions` + `v2_workspaces` + `v2_projects` Electric collections | `1229c1ad8` |
| 1 | MOB-INFRA-006-V2 | SelectedProjectProvider + `useSelectedProject` + legacy `selectedHostId` migration | `3129b94af` |
| 1 | MOB-INFRA-007-V2 | `useSessionsForProject` derived selector (cache-first) | `0cbb03efc` |
| 1 | MOB-INFRA-011 | `useAccessibleProjects` hook | `d026c646d` |
| 2 | MOB-NAV-001 | Chat tab route layout under `app/(authenticated)/(chat)/_layout.tsx` | `3796bab56` |
| 2 | MOB-NAV-011 | Wire footer to 3-tab bar (Tasks / Chat / More) | `2755d36d8` |
| 3 | MOB-NAV-010-V2 | 5-variant empty-state rendering | `02a163aec` |
| 3 | MOB-NAV-017-V2 | FilterButton `·N` badge wired to `activeFilters` | `5964057d2` |
| 4 | MOB-NAV-005-INT | **Keystone** — SessionsListScreen assembled with real Electric data | `063201f87` |
| 4 | MOB-NAV-008-V2 | Wire `ProjectPickerSheet` to live data | `5df38b427` |
| 4 | MOB-NAV-013-V2 | Wire `SessionFilterSheet` to `activeFilters` | `f0273931f` |
| 4 | MOB-NAV-014-V2 | Wire `AppliedFilterTags` + tombstone cleanup | `9caf3b127` |
| 5 | MOB-PLATF-009 | Multi-device sync Maestro flow | `051bf976c` |

### Outstanding work — Sprint 02

1. **53 WIP files uncommitted** on the worktree — mix of:
   - `.superset/` setup script updates (contributor env scaffolding)
   - Maestro flow updates (`.maestro/*.yaml`, `subflows/login.yaml`, `inject-test-session.*`)
   - Test relocations: `app/(authenticated)/(chat)/_layout.test.tsx` deleted, replaced by `screens/(authenticated)/(chat)/layout.test.tsx` (and `index.test.tsx`)
   - Mobile glue: `collections.ts`, `env.ts`, `metro.config.js`, `package.json`, `bun.lock`, `TabBarView.tsx`, `AuthenticatedTabBar.tsx`, `DevSignInButton.*`, `SelectedProjectProvider.*`
   - All 17 sprint-02 task `.md` files + `SPRINT.md` (status updates from `/kb-run-sprint`)
   - New: `.superset/scripts/`, `apps/mobile/.rnstorybook/disabled.tsx`
2. **No PR opened yet.** SPRINT.md says PR opens "when MOB-NAV-005-INT first builds against real data" — that commit landed `2026-05-26`. Trigger is met.
3. **Tab bar / route folder cleanup** — Planner Concern #2: `MOB-NAV-011` removed only the tab trigger, not the legacy `(home)` route folder. Stale URLs still render. Tracked for follow-up, not Sprint 02 scope.

### Path forward (Sprint 02)

1. Triage the 53 WIP files — commit the substantive changes, discard noise.
2. Open the Sprint 02 PR against `main` (or against the Sprint 01 stack tip if not yet merged). Title convention: `feat(mobile): Sprint 02 sessions-list integration (Sprint 2 / PR 1 of 1)`.
3. Run the Sprint 02 Human Test Gate on iOS Simulator + Android Emulator before requesting review.
4. Update `ROADMAP.md` row for Sprint 02: `🔵 Planned (next)` → `🟠 In flight` → `🟣 In review` with the PR URL.

---

## Sprints 03–07 — Planned (task files written, awaiting dispatch)

All sprint folders live at `plans/chat-mobile-plan/tasks/` and are regenerated by `kb-sprint-tasks-plan` against PRD v2.0.1. Every task file ends with a `REQUIREMENT-CONTRACT v1` JSON sidecar consumed by `/kb-run-sprint`.

| # | Sprint | Branch | Tasks | Est. | Plan path |
|---|--------|--------|-------|------|-----------|
| 3 | **Chat View Read + Session Management** — tap session → lazy `useChatTunnel` opens → real `chat.listMessages` history, streaming cursor, End/Rename/Delete | `chat-mobile-chat-view-int` | 13 (9 + 4 deferred-UI) | 28h 30m | `tasks/sprint-03-chat-view-read-session-management/` |
| 4 | **Compose + Send Integration** — FAB → workspace picker → new session → Tiptap composer with slash commands + model picker → `chat.sendMessage` optimistic + streaming, `chat.stop` swap | `chat-mobile-send-int` | 9 (6 + 3 deferred-UI) | 20h 0m | `tasks/sprint-04-compose-send-integration/` |
| 5 | **Pause Response Integration** — real tool-approval / `ask_user` / plan-approval pauses end-to-end via correct container per shape, all three response procedures wired | `chat-mobile-pause-int` | 6 (5 + 1 deferred-UI) | 12h 30m | `tasks/sprint-05-pause-response-integration/` |
| 6 | **Push Notifications (Server + Mobile)** — host `push:lifecycle` upstream → relay `src/push.ts` Expo Push fanout → APNs/FCM → mobile permission flow + deep-link handler with silent project alignment | `chat-mobile-push` | 21 (19 + 2 deferred-UI) | 39h 30m | `tasks/sprint-06-push-notifications-server-mobile/` |
| 7 | **Offline + Background Resume** — host-offline banner with dispatch-outcome copy variants, auto-reconnect, background→foreground catch-up via `useSessionResume` cursor protocol | `chat-mobile-offline` | 4 (3 + 1 deferred-UI) | 7h 30m | `tasks/sprint-07-offline-background-resume/` |
| | **Total remaining** | | **53 tasks** | **~108h** | |

### Sprint 06 cross-team note

Sprint 06 is the only multi-team sprint: 13 tasks are `node-implementer` against `apps/relay` + `apps/host-service` (`HOST-PLATF-001`, `RELAY-PLATF-001..009`, `RELAY-INFRA-001..002`), 8 tasks are `react-native-ui-implementer` against `apps/mobile`. Plan for parallel dispatch.

### Sprint sequencing

```
Sprint 01 ✅  →  Sprint 02 🟠  →  Sprint 03  →  Sprint 04  →  Sprint 05  →  Sprint 06  →  Sprint 07
                                                                    ↘                  ↗
                                                                       (Sprint 07 also depends on 06)
```

`Sprint 07` depends on `Sprint 04` (ChatInputFooter for Send disable) and `Sprint 06` (push reconnect-detection trigger), per `tasks/sprint-07-offline-background-resume/SPRINT.md`.

---

## File paths reference

| Purpose | Path |
|---------|------|
| PRD root | `/Users/justinrich/Projects/superset/.claude/worktrees/chat-mobile-plan/plans/chat-mobile-plan/` |
| PRD README + version history | `plans/chat-mobile-plan/README.md` |
| ROADMAP (sprint sequence, status, gates) | `plans/chat-mobile-plan/ROADMAP.md` |
| In-flight Sprint 02 worktree | `/Users/justinrich/Projects/superset/.claude/worktrees/chat-mobile-sprint-2/` |
| In-flight Sprint 02 plan | `plans/chat-mobile-plan/tasks/sprint-02-sessions-list-integration/SPRINT.md` |
| Remaining sprint plans (03–07) | `plans/chat-mobile-plan/tasks/sprint-0{3,4,5,6,7}-*/` |
| Token-migration audit (Path A ember commitment) | `plans/chat-mobile-plan/14-token-migration-audit.md` |
| Pixel-perfect manifest (Sprint 01 source of truth) | `apps/mobile/design/manifest.json` |

---

## How Claude can help you enact this plan

The plan is structured so Claude can execute most of it for you on demand. Concretely:

- **`/kb-run-sprint <path-to-sprint-folder>`** — The canonical entry point. Reads `SPRINT.md` + every `TASK-*.md`, orchestrates an implement → review → commit cycle per task in dependency order, blocks on the `REQUIREMENT-CONTRACT v1` sidecar at the bottom of each task file. Already validated on Sprint 02. Drop it on Sprint 03 next: `/kb-run-sprint plans/chat-mobile-plan/tasks/sprint-03-chat-view-read-session-management/`.
- **Sprint 02 cleanup** — Ask Claude to triage the 53 WIP files, group them into logical commits (Maestro flows / contributor setup / test relocations / task-file status updates), and open the Sprint 02 PR with the canonical title format.
- **Sprint 01 stack landing** — Ask Claude to land the 7-PR stack in order. It can rebase chains, repoint base refs, and handle CI re-runs without you driving each `gh pr edit` / `gh pr merge` call.
- **Cross-team Sprint 06** — Use `/kb-run-sprint` with parallel waves; the 13 `node-implementer` (relay + host-service) tasks can run alongside the 8 `react-native-ui-implementer` tasks. Ask Claude to set up the dispatch waves.
- **Iterative PRD/ROADMAP edits** — `/kb-sprint-plan --delta-replan` regenerates ROADMAP rows when scope shifts mid-flight; `/kb-sprint-tasks-plan <sprint-folder>` regenerates per-task `.md` files from the PRD. Both are bot-friendly — describe the scope change and let Claude run the skill.
- **Human Test Gate verification** — Claude can drive Maestro flows on the booted iOS Simulator + Android Emulator (`bun run maestro test apps/mobile/.maestro/<flow>.yaml`) and report back the outcome before you sign off on a sprint.
- **PR review** — `/review` or `/code-review` against each open Sprint 01 PR catches issues before human reviewers do; spawn one per PR in parallel.
- **Status syncing** — Ask Claude to keep `ROADMAP.md`'s Status / Branch / PR columns current as state changes (e.g. flip Sprint 02 from 🔵 Planned (next) → 🟠 In flight → 🟣 In review when the PR opens, → ✅ Completed on merge).
- **Pair-debug** — Stuck on a Maestro race / Electric collection sync edge case? Brief Claude with the failing flow + the relevant `chat_sessions` / `v2_workspaces` collection definitions and let it propose fixes.

A reasonable cadence is: you stay in the loop on Human Test Gate sign-off and PR-merge decisions; Claude handles everything in between via `/kb-run-sprint` per sprint and ad-hoc requests for the cross-cutting concerns above.

---

## Next actions (in order)

1. **Land Sprint 01 PR stack** (`#4874` → `#4912`, 7 PRs root-to-tip). Ask Claude to drive the rebase/merge chain.
2. **Triage Sprint 02 WIP** (53 files): commit substantive changes in logical chunks, discard noise. Ask Claude to group + draft commits.
3. **Open Sprint 02 PR** against `main` (or stack tip if Sprint 01 hasn't merged), run Human Test Gate on both simulators. Ask Claude to drive Maestro flows.
4. **Update ROADMAP.md** to reflect Sprint 02 state (currently still says "🔵 Planned (next)").
5. **Dispatch Sprint 03** via `/kb-run-sprint plans/chat-mobile-plan/tasks/sprint-03-chat-view-read-session-management/`.
6. **Track open follow-ups:** legacy `(home)` route folder cleanup (Planner Concern #2 on Sprint 02).
