# 03 — Plan Review Modal

**Expo path:** `/(authenticated)/(chat)/[sessionId]/plan-review/[planId]`
**Production component:** `apps/mobile/screens/(authenticated)/(chat)/[sessionId]/plan-review/[planId]/PlanReviewScreen.tsx`
**Sprint:** Sprint 05
**Status:** planned

## Purpose

Full-screen stack modal overlaying the chat view when the agent's plan gate fires (`displayState.phase === "pause_plan"`). Presents the proposed plan in scrollable markdown, a collapsible feedback input block, and a docked footer with Approve and Reject buttons. The chat view remains mounted in the stack beneath this modal. Dismissing the modal without a decision routes back to the chat view without resolving the plan gate (the plan-required state banner reappears in the thread).

## States

| State | Link | Trigger condition | PRD UC |
|---|---|---|---|
| plan-review-modal | [plan-review-modal/README.md](plan-review-modal/README.md) | `displayState.phase === "pause_plan"` navigates to this route | UC-PAUSE-03 §A |

## Overlays

None — this route is itself the overlay surface presented as a stack modal.

## Data dependencies

| Surface | Source |
|---|---|
| Plan content | `chat.getDisplayState({ sessionId, workspaceId })` → `displayState.plan` (markdown body) |
| Approve plan | `chat.respondToPlan({ sessionId, workspaceId, payload: { planId, response: "approve" } })` host-service tRPC mutation |
| Reject plan | `chat.respondToPlan({ sessionId, workspaceId, payload: { planId, response: "reject" } })` host-service tRPC mutation |
