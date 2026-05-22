# 02 — Chat View

**Expo path:** `/(authenticated)/(chat)/[sessionId]`
**Production component:** `apps/mobile/screens/(authenticated)/(chat)/[sessionId]/ChatScreen.tsx`
**Sprint:** Sprint 03
**Status:** planned

## Purpose

The primary conversation screen. Displays the message thread for a single `chat_session`, a sticky composer footer, and a toolbar row for model, thinking-level, and permission pickers. A single `ChatScreen` component covers every visible state of the thread (loading through streaming), every composer variant, all pause-gate states (approval card, pending pill), and all platform-error banners. Display state is derived from `chat.getDisplayState(...)` polled at approximately 4 FPS; the `[sessionId]` param drives all queries on mount. The relay tunnel is opened lazily from `workspace.hostId` on route mount and torn down on unmount.

## States

| State | Link | Trigger condition | PRD UC |
|---|---|---|---|
| loading | [states/loading/README.md](states/loading/README.md) | Messages fetch in-flight; Electric not yet ready | UC-SESS-02 §A |
| error-retry | [states/error-retry/README.md](states/error-retry/README.md) | `chat.listMessages` or snapshot fetch fails | UC-SESS-02 §B |
| streaming | [states/streaming/README.md](states/streaming/README.md) | `displayState.phase === "streaming"` — canonical hero | UC-RENDER-01 §A |
| markdown | [states/markdown/README.md](states/markdown/README.md) | Completed assistant turn with code / markdown content | UC-RENDER-03 §A |
| tool-calls | [states/tool-calls/README.md](states/tool-calls/README.md) | `displayState` contains tool-call entries | UC-RENDER-04 §A |
| reasoning-plan | [states/reasoning-plan/README.md](states/reasoning-plan/README.md) | PlanBlock + ReasoningBlock in thread | UC-RENDER-05 §A |
| subagent | [states/subagent/README.md](states/subagent/README.md) | Nested subagent execution block in thread | UC-RENDER-06 §A |
| scroll-back-visible | [states/scroll-back-visible/README.md](states/scroll-back-visible/README.md) | User scrolled up; scroll position > threshold | UC-RENDER-07 §A |
| host-offline | [states/host-offline/README.md](states/host-offline/README.md) | Relay tunnel offline / host unreachable | UC-PLATF-03 §A |
| plan-required | [states/plan-required/README.md](states/plan-required/README.md) | Session plan gate; plan not yet approved | UC-PAUSE-03 §A (entry) |
| dispatch-failed | [states/dispatch-failed/README.md](states/dispatch-failed/README.md) | `displayState.status === "dispatch_failed"` | UC-PLATF-03 §B |
| pause-approval | [states/pause-approval/README.md](states/pause-approval/README.md) | `displayState.phase === "pause_approval"` | UC-PAUSE-01 §A |
| pause-pending-pill | [states/pause-pending-pill/README.md](states/pause-pending-pill/README.md) | Approval card scrolled off-screen | UC-PAUSE-04 §A |
| _platform-errors-combined | [states/_platform-errors-combined/README.md](states/_platform-errors-combined/README.md) | Comparison sheet — host-offline + dispatch-failed + plan-required | UC-PLATF-03 |

## Composer states

| State | Link | Trigger | PRD UC |
|---|---|---|---|
| idle | [composer-states/idle/README.md](composer-states/idle/README.md) | Composer mounted, no input, not streaming | UC-COMP-01 §A |
| typing-send-enabled | [composer-states/typing-send-enabled/README.md](composer-states/typing-send-enabled/README.md) | User has typed ≥1 character | UC-COMP-01 §B |
| streaming-stop | [composer-states/streaming-stop/README.md](composer-states/streaming-stop/README.md) | `displayState.phase === "streaming"` | UC-COMP-03 §A |
| _combined | [composer-states/_combined/README.md](composer-states/_combined/README.md) | Comparison sheet — idle + typing + streaming-stop | UC-COMP-01/03 |

## Overlays

| Overlay | Link | Trigger | PRD UC |
|---|---|---|---|
| slash-command-popover | [overlays/slash-command-popover/README.md](overlays/slash-command-popover/README.md) | Composer input begins with `/` | UC-COMP-01 §C |
| model-picker-popover | [overlays/model-picker-popover/README.md](overlays/model-picker-popover/README.md) | Tap model pill in composer toolbar | UC-COMP-04 §A |
| thinking-level-popover | [overlays/thinking-level-popover/README.md](overlays/thinking-level-popover/README.md) | Tap thinking pill in composer toolbar | UC-COMP-05 §A |
| ask-user-sheet | [overlays/ask-user-sheet/README.md](overlays/ask-user-sheet/README.md) | `displayState.phase === "pause_question"` | UC-PAUSE-02 §A |

## Shared overlays triggered from this route

| Overlay | Path | Trigger | PRD UC |
|---|---|---|---|
| session-overflow-sheet | [../shared-overlays/session-overflow-sheet/README.md](../shared-overlays/session-overflow-sheet/README.md) | Tap `···` in app header | UC-SESS-04 |
| delete-confirmation-dialog | [../shared-overlays/delete-confirmation-dialog/README.md](../shared-overlays/delete-confirmation-dialog/README.md) | Tap Delete in session overflow sheet | UC-SESS-05 |

## Data dependencies

| Surface | Source |
|---|---|
| Message history | `chat.listMessages({ sessionId, workspaceId })` host-service tRPC via relay |
| Session snapshot | `chat.getSnapshot({ sessionId, workspaceId })` host-service tRPC |
| Display state | `chat.getDisplayState({ sessionId, workspaceId })` polled at ~4 FPS |
| Slash commands | `chat.getSlashCommands({ workspaceId })` query |
| Slash command preview | `chat.previewSlashCommand({ workspaceId, text })` mutation |
| Slash command resolve | `chat.resolveSlashCommand({ workspaceId, text })` mutation |
| Model list | `chat.getModels` cloud tRPC query |
| Send message | `chat.sendMessage({ sessionId, workspaceId, payload, metadata })` mutation |
| Stop streaming | `chat.stop({ sessionId, workspaceId })` mutation |
| Approval response | `chat.respondToApproval({ sessionId, workspaceId, payload: { decision } })` mutation |
| Ask-user answer | `chat.respondToQuestion({ sessionId, workspaceId, payload: { questionId, answer } })` mutation |
| Update session metadata | `chat.updateSession({ sessionId, lastActiveAt })` cloud tRPC mutation |
| Rename session | `chat.updateTitle({ sessionId, title })` cloud tRPC mutation (via session overflow) |
| Delete session | `chat.deleteSession({ sessionId })` cloud tRPC mutation (via delete confirmation) |
