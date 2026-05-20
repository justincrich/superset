---
ticket_id: SUPER-753
ticket_url: https://linear.app/superset-sh/issue/SUPER-753/nail-the-start-flow-for-new-chat-sessions-kill-the-message-flicker
tracker: linear
title: Nail the start flow for new chat sessions — kill the message flicker
labels: []
fetched_at: 2026-05-20
fetched_method: user-pasted-body (linear CLI unavailable; body provided via /kb-improvement-plan args)
project: Justin project
milestone: Chat UI
authors_in_thread:
  - Avi Peltz
  - Kiet Ho
  - Satya Patel
slack_ref_date: 2026-04-21
created_date: 2026-05-16
base_branch: local-setup-no-env
base_github_url: https://github.com/superset-sh/superset/tree/local-setup-no-env
---

# SUPER-753 — Nail the start flow for new chat sessions, kill the message flicker

## Context (verbatim from ticket)

Starting a new chat session is visibly janky: when you send a message the assistant
message flickers and briefly shows a duplicated message before self-healing. The root
cause is that the chat pane polls two separate state sources (getDisplayState +
listMessages) and they disagree for a poll cycle, which we paper over with
dedupe/optimistic-reconciliation logic. This is a first-impression surface and should
feel airtight; Claude's chat has solved this and we can too.

## References

| Source | Who | Date |
|---|---|---|
| Slack #founders thread (chat polling → flicker) | Avi Peltz / Kiet Ho / Satya Patel | 2026-04-21 |

Internal — Satya Patel, created 2026-05-16 (Justin project / Chat UI milestone). Avi's
earlier thread diagnosed the exact mechanism: polling `getDisplayState` and
`listMessages` at 4fps produces turn-boundary race conditions; he proposed moving to a
push-based event stream (host service forwards the mastracode harness event stream over
a tRPC WS subscription, reducer on the client) the way OpenCode / t3code do.

## Implementation notes (HINTS, not constraints — per kb-improvement-plan)

### Files (suspect surface, per ticket author)

- `packages/chat/src/client/hooks/use-chat-display/use-chat-display.ts:128-152` —
  `useChatDisplay` runs two `useQuery`s (`session.getDisplayState`,
  `session.listMessages`) both on a 4fps `refetchInterval` (`fps = 4`). The two
  responses can land on different ticks.
- `use-chat-display.ts:64-97` — `withoutActiveTurnAssistantHistory()` filters the
  in-flight assistant message out of history to avoid showing it twice while
  `currentMessage` still references it. This is the dedupe band-aid for the
  duplicate-message flicker.
- `use-chat-display.ts:170-217` — optimistic user-message state +
  `useEffect` reconciliation against polled history; another layer compensating
  for the race.
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/TabView/ChatPane/ChatPaneInterface/ChatPaneInterface.tsx` —
  consumes the hook for the chat pane.

### Proposed approach (ticket author's hint)

Replace the dual-poll model with a single, push-based stream so the client never has
two sources to reconcile. The host service already subscribes to the mastracode
harness event stream — forward those events over a tRPC WS subscription (observables,
per the desktop tRPC-electron constraint) and fold them into a client-side reducer;
this lets `withoutActiveTurnAssistantHistory` and the optimistic-reconciliation logic
be deleted rather than tuned. Tighten the new-session startup specifically: ensure the
session id is established before the first send so there's no "session still starting"
gap, and the first assistant message renders directly from the stream with no flash.
Reference Claude's chat, OpenCode, and t3code for the start-flow and streaming model.

### Gotchas

- Desktop tRPC subscriptions must use the **observable pattern** — trpc-electron
  rejects async generators (see `apps/desktop/AGENTS.md`).
- Polling is also the heaviest traffic over the relay for remote workspaces; removing
  it is a bandwidth win, not just a UX one.

---

> The above approach is a HINT from the ticket author. The investigator role is
> obligated to evaluate smaller alternatives (e.g., fix the dedupe/optimistic logic in
> place, single-poll consolidation) before recommending the full push-based rewrite.
> Per kb-improvement-plan: ticket implementation notes are hints, never constraints.
