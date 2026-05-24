---
sprint: 02
title: Sessions List Integration
sequence: 2
timeline: Phase 2 — Integration
status: In Progress
branch: chat-mobile-sprint-2
worktree: /Users/justinrich/Projects/superset/.claude/worktrees/chat-mobile-sprint-2
roadmap: ../../../../../../chat-mobile-plan/plans/chat-mobile-plan/ROADMAP.md
prd: ../../README.md
generated: 2026-05-24T00:00:00Z
generated_by: kb-sprint-tasks-plan
---

# Sprint 02: Sessions List Integration

**Sequence:** 2
**Timeline:** Phase 2 — Integration
**Status:** 🟠 In Progress
**Branch:** `chat-mobile-sprint-2`
**Worktree:** `/Users/justinrich/Projects/superset/.claude/worktrees/chat-mobile-sprint-2`

---

## Overview

Compose the Sprint 01 sessions-list components (`SessionRow`, `ProjectChipHeader`, `ProjectPickerSheet`, `SessionFilterSheet`, `AppliedFilterTag`, `EmptyState`, etc.) into a live, real-data `SessionsListScreen` mounted under a new Chat tab route. Back the list by a project-first Electric collection model (`chat_sessions` × `v2_workspaces` × `v2_projects`) joined client-side via the new `useSessionsForProject` hook, with project selection persisted by `SelectedProjectProvider`. Add the three small domain wrappers deferred from Sprint 01 (`NewChatFab`, `SessionSearchBar`, `FilterButton`) up front so wiring tasks have all required components. Verify via Maestro flows on iOS Simulator + Android Emulator that a signed-in user can use the full sessions list and that desktop-created sessions appear within ~3 seconds.

This is the first Phase 2 sprint after Sprint 01 shipped the as-built component inventory (10 atoms + 26 molecules + 14 organisms + 30 view stories) via the 7-PR stack #4870..#4912. Sprint 02 transitions the project from pure-UI-in-Storybook to live-data-in-app.

---

## Human Test Deliverable

A signed-in user taps the Chat tab on the mobile app and uses the complete real sessions list — flat recency-sorted list scoped to the selected project (header project chip switching projects via `ProjectPickerSheet` when org has ≥2 projects, static label otherwise), search across all workspaces in the project, filter bottom sheet (workspace + status multi-select) with removable applied-tag chips and `·N` badge, empty-state branches — backed by Electric collections joined client-side, and a session created from desktop appears in the mobile list within three seconds.

**Test Steps:**
1. Sign in on the mobile app on iOS Simulator and Android Emulator and confirm the bottom navigation shows three tabs: Tasks, Chat, More.
2. Tap **Chat** and confirm the sessions list shows YOUR REAL sessions in a flat list sorted by `lastActiveAt` descending across every workspace in the currently-selected project; each row shows the two-line layout (title + `🌿 branch · 💻 host · time`).
3. On an org with ≥2 projects, tap the project chip in the header — confirm the **ProjectPickerSheet** opens listing your real projects with workspace + session counts; tap a different project and confirm the list re-scopes. On an org with exactly 1 project, confirm the project name renders as a static label (no chevron, no tap target).
4. Type a query into the search bar — confirm only sessions whose title contains the query (case-insensitive) remain visible across every workspace in the selected project; tap **✕** to clear.
5. Tap the **⚙** filter button to open the **SessionFilterSheet** — confirm two stacked multi-select sections: Workspaces (rows showing `{branch} · {hostIcon} {hostName}` with host suffix disambiguating duplicates) and Status (Streaming / Pause pending / Idle); toggle selections, tap **Apply** — confirm the sheet closes and a `·N` badge appears on the ⚙ button.
6. Confirm an **AppliedFilterTags** row appears below the search bar with one chip per applied workspace (`🌿 branch · host`) and per applied status (`{icon} {label}`), plus a trailing `Clear ✕` chip; tap an individual chip's `✕` to remove only that filter.
7. Delete one of the workspaces referenced by an applied chip on desktop — confirm the stale chip silently drops from the mobile applied-tag row on next render (Electric-tombstone cleanup).
8. Create a chat session on desktop — confirm it appears in the mobile sessions list within ~3 seconds via the Electric shape.
9. Sign in as a user with zero accessible projects in the active org — confirm the "No projects yet" empty state appears with the project chip omitted from the header.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| MOB-NAV-004-V2-UI | Build NewChatFab domain wrapper (FabBase + lucide `+` icon, 56pt size, shadow) | react-native-ui-implementer | 30 min |
| MOB-NAV-007-UI | Build SessionSearchBar domain wrapper (Input + search/clear icons, project-scoped placeholder) | react-native-ui-implementer | 30 min |
| MOB-NAV-017-UI | Build FilterButton domain wrapper (IconButton + `·N` badge state hidden when count is 0) | react-native-ui-implementer | 30 min |
| MOB-INFRA-003 | Install Maestro and seed apps/mobile/.maestro/ with login sub-flow | react-native-ui-implementer | 90 min |
| MOB-INFRA-005-V2 | Add chat_sessions, v2_workspaces, v2_projects Electric collections (project-first) | react-native-ui-implementer | 120 min |
| MOB-INFRA-006-V2 | Build SelectedProjectProvider + useSelectedProject hook with expo-secure-store persistence; one-shot idempotent migration drops legacy `selectedHostId` and seeds `selectedProjectId` | react-native-ui-implementer | 150 min |
| MOB-INFRA-007-V2 | Build useSessionsForProject derived selector over chat_sessions + v2_workspaces (cache-first per AGENTS.md TanStack DB rule) | react-native-ui-implementer | 120 min |
| MOB-INFRA-011 | Build useAccessibleProjects hook (Electric collection query over v2_projects scoped to activeOrganizationId) | react-native-ui-implementer | 60 min |
| MOB-NAV-001 | Create Chat tab route layout under app/(authenticated)/(chat)/_layout.tsx | react-native-ui-implementer | 90 min |
| MOB-NAV-005-INT | Assemble SessionsListScreen composing Phase 1 components with real Electric data, in-memory `searchQuery` + `activeFilters: { workspaceIds[], statuses[] }` state, both cleared on screen exit | react-native-ui-implementer | 240 min |
| MOB-NAV-008-V2 | Wire ProjectPickerSheet to useAccessibleProjects + SelectedProjectProvider; renders only when org has ≥2 projects; project rows show workspace + session counts via cache-first `useLiveQuery` | react-native-ui-implementer | 120 min |
| MOB-NAV-010-V2 | Build empty-state rendering for the five UC-NAV-06 variants (no-projects, no-workspaces, no-sessions, search-no-match, filters-no-match) | react-native-ui-implementer | 90 min |
| MOB-NAV-011 | Wire SessionsListScreen footer to 3-tab bar (Tasks, Chat, More) | react-native-ui-implementer | 60 min |
| MOB-NAV-013-V2 | Wire SessionFilterSheet to activeFilters state on SessionsListScreen | react-native-ui-implementer | 120 min |
| MOB-NAV-014-V2 | Wire AppliedFilterTags below search bar; per-chip removal + Clear all; silently drop stale workspace chips on Electric tombstone | react-native-ui-implementer | 90 min |
| MOB-NAV-017-V2 | Wire FilterButton badge: `·N` count = `activeFilters.workspaceIds.length + activeFilters.statuses.length`; badge hidden when 0 | react-native-ui-implementer | 45 min |
| MOB-PLATF-009 | Verify multi-device sync via existing chat_sessions Electric shape (test + Maestro) | react-native-ui-implementer | 90 min |

> **Deferred-UI carryover:** The first 3 rows (MOB-NAV-004-V2-UI, MOB-NAV-007-UI, MOB-NAV-017-UI) are domain wrappers around Sprint 01 primitives that were not built standalone. They must complete BEFORE the assembly task (MOB-NAV-005-INT) so the SessionsListScreen has every required component.

**Total tasks:** 17 · **Estimated time:** 24h 15min

---

## Human Testing Gate

**Gate:** A signed-in user taps the Chat tab on the mobile app and uses the complete real sessions list — flat recency-sorted list scoped to the selected project (header project chip switching projects via `ProjectPickerSheet` when org has ≥2 projects, static label otherwise), search across all workspaces in the project, filter bottom sheet (workspace + status multi-select) with removable applied-tag chips and `·N` badge, empty-state branches — backed by Electric collections joined client-side, and a session created from desktop appears in the mobile list within three seconds.

---

## Source Coverage

- UC-SESS-01 (sessions list with real Electric, project-scoped)
- UC-NAV-01 (Chat tab landing — project-first header composition)
- UC-NAV-04 (FAB → workspace picker scoped to selected project — deferred wiring to Sprint 04)
- UC-NAV-06 (empty-state branching — five variants)
- UC-NAV-07 (project-scoped title search across all workspaces)
- UC-NAV-08 (workspace + status filter sheet, applied chip tags, filter badge — full wiring)
- UC-PLATF-05 (multi-device session sync via Electric)
- 11-technical-requirements/02-api-design.md (Electric collections — project-first scoping)
- 11-technical-requirements/06-open-sub-decisions.md (re-resolved sub-decision #6 — project-first model)

---

## Blocks

- Sprint 03 (Chat View Read + Session Management) — depends on this sprint shipping a working Chat tab + tappable session rows + Electric collections + SelectedProjectProvider

---

## Dependencies

- **Depends on:** Sprint 01 ✅ Completed 2026-05-24 (7-PR stack #4870..#4912)
- **Blocks:** Sprint 03

---

## Worktree + PR Plan

- Worktree at `.claude/worktrees/chat-mobile-sprint-2/` based on Sprint 01 tip (`f8d698151`) — has all Sprint 01 UI components present so wiring tasks have something to wire against
- Branch: `chat-mobile-sprint-2`
- Target: one Sprint 02 PR opened against `main` per `~/Projects/brain/docs/PR-SEQUENCING.md` convention, opened when MOB-NAV-005-INT (SessionsListScreen assembly) first builds against real data
- Rebase: when Sprint 01 PR stack lands on main, rebase `chat-mobile-sprint-2` onto fresh main

---

## Task Detail Files

Generated by `react-native-ui-planner` on 2026-05-24 via `/kb-sprint-tasks-plan`. All 17 files meet the 115-pt rubric (avg ~104/115). Every file ends with a `<!-- REQUIREMENT-CONTRACT v1 -->` JSON sidecar consumed by `/kb-run-sprint`.

**Wave 0 — Deferred-UI carryover (build first, no deps):**
- [MOB-NAV-004-V2-UI](./MOB-NAV-004-V2-UI-build-newchatfab-domain-wrapper.md) — NewChatFab domain wrapper
- [MOB-NAV-007-UI](./MOB-NAV-007-UI-build-sessionsearchbar-domain-wrapper.md) — SessionSearchBar domain wrapper
- [MOB-NAV-017-UI](./MOB-NAV-017-UI-build-filterbutton-domain-wrapper.md) — FilterButton domain wrapper

**Wave 1 — Infra (Electric collections + provider + hooks):**
- [MOB-INFRA-003](./MOB-INFRA-003-install-maestro-seed-login-flow.md) — Install Maestro + seed login sub-flow
- [MOB-INFRA-005-V2](./MOB-INFRA-005-V2-add-electric-collections.md) — Add chat_sessions, v2_workspaces, v2_projects Electric collections
- [MOB-INFRA-006-V2](./MOB-INFRA-006-V2-build-selectedprojectprovider.md) — SelectedProjectProvider + useSelectedProject + secure-store migration
- [MOB-INFRA-007-V2](./MOB-INFRA-007-V2-build-usesessionsforproject.md) — useSessionsForProject derived selector
- [MOB-INFRA-011](./MOB-INFRA-011-build-useaccessibleprojects.md) — useAccessibleProjects hook

**Wave 2 — Routing shell:**
- [MOB-NAV-001](./MOB-NAV-001-create-chat-tab-route-layout.md) — Chat tab route layout
- [MOB-NAV-011](./MOB-NAV-011-wire-chat-tab-to-3-tab-bar.md) — 3-tab bar wiring (Tasks/Chat/More)

**Wave 3 — Empty-state + small wiring:**
- [MOB-NAV-010-V2](./MOB-NAV-010-V2-empty-state-rendering.md) — 5-variant empty-state rendering
- [MOB-NAV-017-V2](./MOB-NAV-017-V2-wire-filterbutton-badge.md) — FilterButton badge wiring

**Wave 4 — SessionsListScreen assembly + sheet wiring:**
- [MOB-NAV-005-INT](./MOB-NAV-005-INT-assemble-sessionslistscreen.md) — Assemble SessionsListScreen (240-min keystone)
- [MOB-NAV-008-V2](./MOB-NAV-008-V2-wire-projectpickersheet.md) — Wire ProjectPickerSheet to live data
- [MOB-NAV-013-V2](./MOB-NAV-013-V2-wire-sessionfiltersheet.md) — Wire SessionFilterSheet to activeFilters
- [MOB-NAV-014-V2](./MOB-NAV-014-V2-wire-applied-filter-tags.md) — Wire AppliedFilterTags + tombstone cleanup

**Wave 5 — Verification:**
- [MOB-PLATF-009](./MOB-PLATF-009-verify-multi-device-sync.md) — Multi-device sync Maestro flow

## Planner Concerns (surface to implementer)

1. **MOB-NAV-001 ↔ MOB-INFRA-006-V2 ordering** — MOB-NAV-001 imports `SelectedProjectProvider`; land MOB-INFRA-006-V2 first or in the same wave-cluster.
2. **Legacy `(home)` route folder** — MOB-NAV-011 removes only the tab trigger, not the route folder. Stale URLs still render. Tracked for future cleanup, not Sprint 02 scope.
3. **`SUPERSET_E2E_JWT` minting** — MOB-PLATF-009 + MOB-INFRA-003 assume a dev-mintable JWT; minting path unspecified in PRD. May need a small dev-mint script or 1Password manual flow.
4. **`useChatTunnel` is Sprint 03** — no Sprint 02 task assumes the tunnel exists.
5. **SF Symbol `message.fill`** — MOB-NAV-011 assumes availability; fallback to `bubble.fill` documented.
6. **MOB-NAV-005-INT keystone refactored by 3 follow-ups** — MOB-NAV-005-INT mounts initial inline wiring; MOB-NAV-008-V2 / MOB-NAV-013-V2 / MOB-NAV-014-V2 then carve it into connected wrappers. Intentional smaller-slice approach over one monolithic task.
