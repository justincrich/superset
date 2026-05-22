# 01 — Sessions List

**Expo path:** `/(authenticated)/(chat)`
**Production component:** `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen.tsx`
**Sprint:** Sprint 02
**Status:** planned

## Purpose

The Chat tab's default landing screen. Renders a flat, recency-sorted list of `chat_sessions` scoped to the user's active organization and selected project. The screen hosts a project-chip header (switches active project), a search input, a filter button (⚙), an optional filter-chip tag row, and a floating FAB for new chats. Five distinct empty states branch off this same component based on Electric collection readiness, search query, and active filter state. All tunnel lifecycle is deferred — no relay connections are opened from the list; connections are established lazily when navigating into a chat view.

## States

| State | Link | Trigger condition | PRD UC |
|---|---|---|---|
| loaded | [loaded/README.md](states/loaded/README.md) | `chat_sessions` non-empty for selected project | UC-NAV-01 §A |
| empty-no-projects | [empty-no-projects/README.md](states/empty-no-projects/README.md) | `v2_projects` returns zero rows | UC-NAV-06.1 |
| empty-no-workspaces | [empty-no-workspaces/README.md](states/empty-no-workspaces/README.md) | `v2_workspaces` for selected project returns zero rows | UC-NAV-06.2 |
| empty-no-sessions | [empty-no-sessions/README.md](states/empty-no-sessions/README.md) | `chat_sessions` returns zero rows, workspace exists | UC-NAV-06.3 |
| search-no-match | [search-no-match/README.md](states/search-no-match/README.md) | Search query active, zero title matches | UC-NAV-06.4 / UC-NAV-07 |
| filters-no-match | [filters-no-match/README.md](states/filters-no-match/README.md) | Filter active (workspace or status), zero matches | UC-NAV-06.5 / UC-NAV-08 |
| _combined-empty | [_combined-empty/README.md](states/_combined-empty/README.md) | Comparison sheet — all 5 empty variants | UC-NAV-06 |

## Overlays

| Overlay | Link | Trigger | PRD UC |
|---|---|---|---|
| project-picker-sheet | [overlays/project-picker-sheet/README.md](overlays/project-picker-sheet/README.md) | Tap project chip (▾) in header | UC-NAV §B |
| filter-sheet | [overlays/filter-sheet/README.md](overlays/filter-sheet/README.md) | Tap ⚙ filter button | UC-NAV-08 §C |
| new-chat-sheet | [overlays/new-chat-sheet/README.md](overlays/new-chat-sheet/README.md) | Tap FAB `+` | UC-NAV-04 |

## Shared overlays triggered from this route

| Overlay | Path | Trigger | PRD UC |
|---|---|---|---|
| session-overflow-sheet | [../shared-overlays/session-overflow-sheet/README.md](../shared-overlays/session-overflow-sheet/README.md) | Long-press session row | UC-SESS-04 |
| delete-confirmation-dialog | [../shared-overlays/delete-confirmation-dialog/README.md](../shared-overlays/delete-confirmation-dialog/README.md) | Tap Delete in session overflow sheet | UC-SESS-05 |

## Data dependencies

| Surface | Source |
|---|---|
| `chat_sessions` | Electric shape `chat_sessions` org-scoped; client-side filter by `selectedProjectId` via join through `v2_workspaces.project_id`; sorted by `lastActiveAt` desc |
| `v2_projects` | Electric shape `v2_projects` org-scoped; populates project chip header and project picker sheet |
| `v2_workspaces` | Electric shape `v2_workspaces`; used for workspace filter rows and new-chat workspace picker |
| Rename session title | `chat.updateTitle({ sessionId, title })` cloud tRPC mutation (via session overflow) |
| Delete session | `chat.deleteSession({ sessionId })` cloud tRPC mutation (via delete confirmation) |
