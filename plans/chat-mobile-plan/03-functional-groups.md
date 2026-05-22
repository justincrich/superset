---
stability: FEATURE_SPEC
last_validated: 2026-05-22
prd_version: 2.0.1
---

# Mobile Chat v2 — Functional Groups

## Functional Groups

| Group | Prefix | Description |
|-------|--------|-------------|
| Session Lifecycle | **SESS** | List, resume, start, end, delete, and rename chat sessions in a workspace. Backed by the cloud chat router (`chat.createSession`, `chat.updateSession`, `chat.deleteSession`, `chat.updateTitle`) and the ElectricSQL `chat_sessions` shape for realtime listing. |
| Composition + Send | **COMP** | Compose a message in Tiptap (`@10play/tentap-editor` for parity), invoke slash commands from a popover, choose model / thinking-level / permission-mode, submit a message, stop a running turn. Backed by the host-service tRPC chat router via relay. |
| Message Rendering | **RENDER** | Render user/assistant messages, streaming text, markdown, tool call blocks (collapsed), plan blocks, reasoning blocks, subagent execution, auto-scroll, and scroll-back affordance. Built on `@shopify/flash-list` for virtualization. |
| Mid-Turn Interactive Prompts | **PAUSE** | Handle the three session-pausing states with container shape chosen per interaction frequency, content length, and keyboard need: tool approval (inline card + sticky thumb-docked footer), `ask_user` question (`@gorhom/bottom-sheet`), plan approval (full-screen modal pushed as an expo-router route). Plus a floating pending-action indicator when the user scrolls away from an active pause. Backed by `chat.respondToApproval`, `chat.respondToQuestion`, `chat.respondToPlan`. See Design Rationale in `07-uc-pause.md` for evidence citations (Apple HIG, NN/G, Continue.dev, Material Design 3). |
| Platform Integration | **PLATF** | Mobile-specific platform concerns: OS push notifications via Expo push wired to host lifecycle events, session resume after background/foreground using cursor protocol, host-offline UX with automatic reconnect, multi-device session sync via Electric shape. |
| Navigation | **NAV** | Shell-level navigation for the Chat tab — **project-first** model (v2.0.0). Top-level filter axis is project, not host: header carries a project chip (tappable bottom-sheet picker when org has ≥2 projects, static label otherwise). Sessions list is **flat and recency-sorted** with workspace as inline row metadata (no sectioning, no sticky headers, no per-section pagination). Filter UI is a `@gorhom/bottom-sheet` (workspace + status multi-selects) triggered from a ⚙ button next to the search bar; applied filters render as removable chip tags below the search. **Tunnel lifecycle is lazy** — opened on chat-route mount via `workspace.hostId`, dropped on unmount. FAB → workspace picker scoped to the selected project (workspaces across all hosts). Push deep-link aligns project then routes to chat; host resolves lazily on mount with a readiness gate falling back to tRPC `chat.getSnapshot`. Re-resolves Technical Sub-Decision #6 with the project-first model (replacing the v1.6.0 host-first resolution). See `09-uc-nav.md` for canonical wireframes. |

## Use Case Summary

| Group | Prefix | UCs |
|-------|--------|-----|
| Session Lifecycle | SESS | 5 |
| Composition + Send | COMP | 5 |
| Message Rendering | RENDER | 7 |
| Mid-Turn Interactive Prompts | PAUSE | 4 |
| Platform Integration | PLATF | 5 |
| Navigation | NAV | 6 |
| **Total** | | **32** |
