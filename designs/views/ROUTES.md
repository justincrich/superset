# Route Topology

## Overview

The 26 mocks in `designs/views/` are organized around 5 routes plus one shared-overlays bucket. Each route corresponds to exactly one production React Native screen whose variants are driven by state, not by separate component files. Overlays (bottom sheets, popovers, dialogs) are components scoped to a screen and are not routes — a user cannot navigate directly to an overlay state.

- Total HTML files: 37 (26 unique design states + 3 combined comparison sheets + 4 chat-view overlays + 3 sessions-list overlays + 2 shared overlays — see §Route Index for exact breakdown)
- Routes: 5
- Shared overlays: 2 (reachable from ≥2 routes)

## Route Index

| # | Route | Expo path | Production component path | Sprint | Status |
|---|---|---|---|---|---|
| 1 | Sessions list | `/(authenticated)/(chat)` | `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen.tsx` | Sprint 02 | planned |
| 2 | Chat view | `/(authenticated)/(chat)/[sessionId]` | `apps/mobile/screens/(authenticated)/(chat)/[sessionId]/ChatScreen.tsx` | Sprint 03 | planned |
| 3 | Plan review modal | `/(authenticated)/(chat)/[sessionId]/plan-review/[planId]` | `apps/mobile/screens/(authenticated)/(chat)/[sessionId]/plan-review/[planId]/PlanReviewScreen.tsx` | Sprint 05 | planned |
| 4 | Push pre-prompt | `/(authenticated)/push-permission` | `apps/mobile/screens/(authenticated)/push-permission/PushPrePromptScreen.tsx` | Sprint 06 | planned |
| 5 | Settings | `/(authenticated)/(more)/settings` | `apps/mobile/screens/(authenticated)/(more)/settings/SettingsScreen.tsx` | exists | active |

---

## Route Details

### 1. Sessions list

**Expo path:** `/(authenticated)/(chat)`
**Production component:** `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen.tsx`

The Chat tab's default landing screen. Renders a flat, recency-sorted list of `chat_sessions` scoped to the user's active organization and selected project. Hosts a search input, a filter button, an optional filter-chip row, and a floating `+` FAB for starting a new chat. Five distinct empty states branch off this same component depending on Electric collection readiness and active filter/search state.

#### States

| State | Mock path | Trigger condition | PRD UC |
|---|---|---|---|
| loaded | `01-sessions-list/states/loaded/loaded.html` | `chat_sessions` non-empty for selected project | UC-NAV-01 §A |
| empty-no-projects | `01-sessions-list/states/empty-no-projects/empty-no-projects.html` | `v2_projects` collection returns zero rows | UC-NAV-06.1 |
| empty-no-workspaces | `01-sessions-list/states/empty-no-workspaces/empty-no-workspaces.html` | `v2_workspaces` for selected project returns zero rows | UC-NAV-06.2 |
| empty-no-sessions | `01-sessions-list/states/empty-no-sessions/empty-no-sessions.html` | `chat_sessions` returns zero rows (workspace exists) | UC-NAV-06.3 |
| search-no-match | `01-sessions-list/states/search-no-match/search-no-match.html` | Search query active, zero title matches | UC-NAV-06.4 / UC-NAV-07 |
| filters-no-match | `01-sessions-list/states/filters-no-match/filters-no-match.html` | Filter active (workspace or status), zero matches | UC-NAV-06.5 / UC-NAV-08 |
| _combined-empty | `01-sessions-list/states/_combined-empty/_combined-empty.html` | Comparison sheet showing all 5 empty variants side-by-side | UC-NAV-06 |

#### Overlays

| Overlay | Mock path | Trigger | PRD UC |
|---|---|---|---|
| project-picker-sheet | `01-sessions-list/overlays/project-picker-sheet/project-picker-sheet.html` | Tap project chip (▾) in header | UC-NAV §B |
| filter-sheet | `01-sessions-list/overlays/filter-sheet/filter-sheet.html` | Tap ⚙ filter button | UC-NAV-08 §C |
| new-chat-sheet | `01-sessions-list/overlays/new-chat-sheet/new-chat-sheet.html` | Tap FAB `+` button | UC-NAV-04 |
| session-overflow-sheet | `../shared-overlays/session-overflow-sheet/session-overflow-sheet.html` | Long-press session row | UC-SESS-04 |
| delete-confirmation-dialog | `../shared-overlays/delete-confirmation-dialog/delete-confirmation-dialog.html` | Tap Delete in session overflow sheet | UC-SESS-05 |

#### Data dependencies

| Surface | Source |
|---|---|
| `chat_sessions` | Electric shape `chat_sessions` org-scoped; client-side filter by `selectedProjectId` via join through `v2_workspaces` |
| `v2_projects` | Electric shape `v2_projects` org-scoped; used to populate project chip + project picker |
| `v2_workspaces` | Electric shape `v2_workspaces`; used in filter sheet workspace rows and new-chat workspace picker |

---

### 2. Chat view

**Expo path:** `/(authenticated)/(chat)/[sessionId]`
**Production component:** `apps/mobile/screens/(authenticated)/(chat)/[sessionId]/ChatScreen.tsx`

The primary conversation screen. Displays the message thread for a single session, a sticky composer footer, and a toolbar row for model/thinking/permission pickers. This single component covers all thread-rendering states (loading, streaming, markdown, tool calls, reasoning, subagent nesting, scroll-back), all composer states (idle, typing, streaming-stop), all pause states (approval card, pending pill), and all platform error banners (host-offline, dispatch-failed, plan-required).

#### States

| State | Mock path | Trigger condition | PRD UC |
|---|---|---|---|
| loading | `02-chat-view/states/loading/loading.html` | Session opened; `chat.listMessages` in-flight or Electric not ready | UC-SESS-02 §A |
| error-retry | `02-chat-view/states/error-retry/error-retry.html` | `chat.listMessages` or snapshot fetch fails | UC-SESS-02 §B |
| streaming | `02-chat-view/states/streaming/streaming.html` | `displayState.phase === "streaming"` — canonical hero | UC-RENDER-01 §A |
| markdown | `02-chat-view/states/markdown/markdown.html` | Completed assistant turn with code/markdown content | UC-RENDER-03 §A |
| tool-calls | `02-chat-view/states/tool-calls/tool-calls.html` | `displayState` contains tool-call entries in running/done/error states | UC-RENDER-04 §A |
| reasoning-plan | `02-chat-view/states/reasoning-plan/reasoning-plan.html` | PlanBlock + ReasoningBlock in thread | UC-RENDER-05 §A |
| subagent | `02-chat-view/states/subagent/subagent.html` | Nested subagent execution block in thread | UC-RENDER-06 §A |
| scroll-back-visible | `02-chat-view/states/scroll-back-visible/scroll-back-visible.html` | User has scrolled up; scroll position > threshold | UC-RENDER-07 §A |
| host-offline | `02-chat-view/states/host-offline/host-offline.html` | Relay tunnel offline / host unreachable | UC-PLATF-03 §A |
| plan-required | `02-chat-view/states/plan-required/plan-required.html` | Plan gate: session cannot proceed without an approved plan | UC-PAUSE-03 §A (entry) |
| dispatch-failed | `02-chat-view/states/dispatch-failed/dispatch-failed.html` | `displayState.status === "dispatch_failed"` | UC-PLATF-03 §B |
| pause-approval | `02-chat-view/states/pause-approval/pause-approval.html` | `displayState.phase === "pause_approval"` | UC-PAUSE-01 §A |
| pause-pending-pill | `02-chat-view/states/pause-pending-pill/pause-pending-pill.html` | Pause-approval card scrolled off-screen | UC-PAUSE-04 §A |
| _platform-errors-combined | `02-chat-view/states/_platform-errors-combined/_platform-errors-combined.html` | Comparison sheet: host-offline + dispatch-failed + plan-required | UC-PLATF-03 |

#### Composer states

| State | Mock path | Trigger | PRD UC |
|---|---|---|---|
| idle | `02-chat-view/composer-states/idle/idle.html` | Composer mounted, no input, not streaming | UC-COMP-01 §A |
| typing-send-enabled | `02-chat-view/composer-states/typing-send-enabled/typing-send-enabled.html` | User has typed ≥1 character | UC-COMP-01 §B |
| streaming-stop | `02-chat-view/composer-states/streaming-stop/streaming-stop.html` | `displayState.phase === "streaming"` | UC-COMP-03 §A |
| _combined | `02-chat-view/composer-states/_combined/_combined.html` | Comparison sheet: idle + typing + streaming-stop stacked | UC-COMP-01/03 |

#### Overlays

| Overlay | Mock path | Trigger | PRD UC |
|---|---|---|---|
| slash-command-popover | `02-chat-view/overlays/slash-command-popover/slash-command-popover.html` | Composer input begins with `/` | UC-COMP-01 §C |
| model-picker-popover | `02-chat-view/overlays/model-picker-popover/model-picker-popover.html` | Tap model pill in composer toolbar | UC-COMP-04 §A |
| thinking-level-popover | `02-chat-view/overlays/thinking-level-popover/thinking-level-popover.html` | Tap thinking pill in composer toolbar | UC-COMP-05 §A |
| ask-user-sheet | `02-chat-view/overlays/ask-user-sheet/ask-user-sheet.html` | `displayState.phase === "pause_question"` | UC-PAUSE-02 §A |
| session-overflow-sheet | `../shared-overlays/session-overflow-sheet/session-overflow-sheet.html` | Tap `···` in app header | UC-SESS-04 |
| delete-confirmation-dialog | `../shared-overlays/delete-confirmation-dialog/delete-confirmation-dialog.html` | Tap Delete in session overflow sheet | UC-SESS-05 |

#### Data dependencies

| Surface | Source |
|---|---|
| Message thread | `chat.listMessages({ sessionId, workspaceId })` via host-service tRPC relay |
| Display state | `chat.getDisplayState({ sessionId, workspaceId })` polled at ~4 FPS |
| Slash commands | `chat.getSlashCommands({ workspaceId })` query |
| Model list | `chat.getModels` cloud tRPC query |
| Send message | `chat.sendMessage(...)` mutation |
| Stop | `chat.stop(...)` mutation |
| Approval | `chat.respondToApproval(...)` mutation |
| Ask-user answer | `chat.respondToQuestion(...)` mutation |

---

### 3. Plan review modal

**Expo path:** `/(authenticated)/(chat)/[sessionId]/plan-review/[planId]`
**Production component:** `apps/mobile/screens/(authenticated)/(chat)/[sessionId]/plan-review/[planId]/PlanReviewScreen.tsx`

Full-screen modal overlaying the chat view when the agent's plan gate fires. Presents the proposed plan in scrollable markdown, a collapsible feedback block, and a docked footer with Approve and Reject buttons. Rendered as a stack modal on top of the chat route.

#### States

| State | Mock path | Trigger condition | PRD UC |
|---|---|---|---|
| plan-review-modal | `03-plan-review-modal/plan-review-modal/plan-review-modal.html` | `displayState.phase === "pause_plan"` routes to plan-review | UC-PAUSE-03 §A |

#### Overlays

None — this route is itself the overlay surface.

#### Data dependencies

| Surface | Source |
|---|---|
| Plan content | `chat.getDisplayState(...)` → `displayState.plan` |
| Approve / Reject | `chat.respondToPlan({ sessionId, workspaceId, payload: { planId, response } })` mutation |

---

### 4. Push pre-prompt

**Expo path:** `/(authenticated)/push-permission`
**Production component:** `apps/mobile/screens/(authenticated)/push-permission/PushPrePromptScreen.tsx`

One-time interstitial screen shown before the OS push-permission dialog. Explains the value of notifications and includes an "Enable notifications" CTA that fires `requestPermissionsAsync()` followed by token registration at `POST /push/register`. If the user dismisses the screen, the session is remembered so the prompt does not re-appear.

#### States

| State | Mock path | Trigger condition | PRD UC |
|---|---|---|---|
| push-pre-prompt | `04-push-pre-prompt/push-pre-prompt/push-pre-prompt.html` | First eligible launch after sign-in, permission not yet requested | UC-PLATF-01 §A |

#### Overlays

None.

#### Data dependencies

| Surface | Source |
|---|---|
| Token registration | `POST /push/register` relay endpoint with Expo push token + deviceId |
| Token deregistration (logout) | `DELETE /push/register/:deviceId` relay endpoint |

---

### 5. Settings

**Expo path:** `/(authenticated)/(more)/settings`
**Production component:** `apps/mobile/screens/(authenticated)/(more)/settings/SettingsScreen.tsx`

General settings screen under the More tab. Currently active in production. The sprint-1 design scope adds a permission-denied banner state shown when push notifications have been denied at the OS level.

#### States

| State | Mock path | Trigger condition | PRD UC |
|---|---|---|---|
| permission-denied-banner | `05-settings-screen/states/permission-denied-banner/permission-denied-banner.html` | `getPermissionsAsync()` returns `denied` on cold launch | UC-PLATF-01 §B |

#### Overlays

None.

#### Data dependencies

| Surface | Source |
|---|---|
| Push permission status | `expo-notifications` `getPermissionsAsync()` on screen mount |
| Deep-link to OS Settings | `Linking.openSettings()` |

---

## Shared Overlays

Overlays reachable from two or more routes. Implemented as a single shared component with multiple trigger surfaces — not one component per trigger location.

| Overlay | Mock path | Routes that trigger it | UC |
|---|---|---|---|
| session-overflow-sheet | `shared-overlays/session-overflow-sheet/session-overflow-sheet.html` | Chat view (tap `···` in header) · Sessions list (long-press session row) | UC-SESS-04 |
| delete-confirmation-dialog | `shared-overlays/delete-confirmation-dialog/delete-confirmation-dialog.html` | Chat view (via session overflow) · Sessions list (via session overflow) | UC-SESS-05 |

---

## Cross-Reference Index

Mapping from the original flat mock names (pre-topology reorganization) to new paths under `designs/views/`.

| Original mock | New path |
|---|---|
| sessions-list-loaded | `01-sessions-list/states/loaded/loaded.html` |
| sessions-list-empty-states | split into 5 states + 1 combined (see rows below) |
| sessions-list-empty-no-projects | `01-sessions-list/states/empty-no-projects/empty-no-projects.html` |
| sessions-list-empty-no-workspaces | `01-sessions-list/states/empty-no-workspaces/empty-no-workspaces.html` |
| sessions-list-empty-no-sessions | `01-sessions-list/states/empty-no-sessions/empty-no-sessions.html` |
| sessions-list-search-no-match | `01-sessions-list/states/search-no-match/search-no-match.html` |
| sessions-list-filters-no-match | `01-sessions-list/states/filters-no-match/filters-no-match.html` |
| sessions-list-empty-states (_combined) | `01-sessions-list/states/_combined-empty/_combined-empty.html` |
| project-picker-sheet | `01-sessions-list/overlays/project-picker-sheet/project-picker-sheet.html` |
| filter-sheet | `01-sessions-list/overlays/filter-sheet/filter-sheet.html` |
| new-chat-workspace-picker | `01-sessions-list/overlays/new-chat-sheet/new-chat-sheet.html` |
| chat-view-thread | `02-chat-view/states/streaming/streaming.html` |
| chat-view-loading | `02-chat-view/states/loading/loading.html` |
| chat-view-error-retry | `02-chat-view/states/error-retry/error-retry.html` |
| chat-view-markdown | `02-chat-view/states/markdown/markdown.html` |
| chat-view-tool-calls | `02-chat-view/states/tool-calls/tool-calls.html` |
| chat-view-reasoning-plan | `02-chat-view/states/reasoning-plan/reasoning-plan.html` |
| chat-view-subagent | `02-chat-view/states/subagent/subagent.html` |
| chat-view-scroll-back | `02-chat-view/states/scroll-back-visible/scroll-back-visible.html` |
| chat-view-host-offline-and-dispatch | split into 3 states + 1 combined (see rows below) |
| chat-view-host-offline | `02-chat-view/states/host-offline/host-offline.html` |
| chat-view-plan-required | `02-chat-view/states/plan-required/plan-required.html` |
| chat-view-dispatch-failed | `02-chat-view/states/dispatch-failed/dispatch-failed.html` |
| chat-view-host-offline-and-dispatch (_combined) | `02-chat-view/states/_platform-errors-combined/_platform-errors-combined.html` |
| composer-states | split into 3 states + 1 combined (see rows below) |
| composer-states-idle | `02-chat-view/composer-states/idle/idle.html` |
| composer-states-typing | `02-chat-view/composer-states/typing-send-enabled/typing-send-enabled.html` |
| composer-states-streaming | `02-chat-view/composer-states/streaming-stop/streaming-stop.html` |
| composer-states (_combined) | `02-chat-view/composer-states/_combined/_combined.html` |
| composer-slash-menu | `02-chat-view/overlays/slash-command-popover/slash-command-popover.html` |
| composer-model-picker | `02-chat-view/overlays/model-picker-popover/model-picker-popover.html` |
| composer-thinking-picker | `02-chat-view/overlays/thinking-level-popover/thinking-level-popover.html` |
| pause-ask-user-sheet | `02-chat-view/overlays/ask-user-sheet/ask-user-sheet.html` |
| pause-approval-inline | `02-chat-view/states/pause-approval/pause-approval.html` |
| pause-pending-action-pill | `02-chat-view/states/pause-pending-pill/pause-pending-pill.html` |
| pause-plan-review-modal | `03-plan-review-modal/plan-review-modal/plan-review-modal.html` |
| push-pre-prompt-screen | `04-push-pre-prompt/push-pre-prompt/push-pre-prompt.html` |
| settings-permission-denied-banner | `05-settings-screen/states/permission-denied-banner/permission-denied-banner.html` |
| session-overflow-menu | `shared-overlays/session-overflow-sheet/session-overflow-sheet.html` |
| delete-session-dialog | `shared-overlays/delete-confirmation-dialog/delete-confirmation-dialog.html` |

---

## Production-Component Architecture Notes

- **Each route is ONE screen component with state-driven branches.** Do not ship one component per mock. The 14 chat-view state mocks (loading, streaming, markdown, tool-calls, etc.) are all branches inside `ChatScreen.tsx` — not 14 files.
- **Overlays are reusable components imported by the screen.** The same `<SessionOverflowSheet>` opens from both the `ChatScreen` header `···` button and the `SessionsListScreen` row long-press handler.
- **Composer states (idle/typing/streaming) are props on a single `<Composer>` component inside `ChatScreen`.** The `composer-states/` mocks are visual documentation of prop variants, not separate screens.
- **Empty states (UC-NAV-06.1–06.5) are conditional renders inside `SessionsListScreen`** based on the Electric collection readiness state and active filter/search values. They branch off a single `isReady` + data-count check, not separate components.
- **Plan review is a stack modal.** The plan-review route mounts on top of the chat route as a stack-presented modal; the chat view remains in the stack beneath it.
- **The `app/ → screens/` re-export pattern applies to all new routes.** Each `app/(authenticated)/(chat)/...` file is a one-line default-export re-export pointing to the corresponding `screens/(authenticated)/(chat)/...` component. Routing logic (redirects, guards) stays in `app/`; all component logic lives in `screens/`.
