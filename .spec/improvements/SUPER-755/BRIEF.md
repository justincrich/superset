---
source: ticket
improvement_id: SUPER-755
ticket_id: SUPER-755
ticket_url: https://linear.app/superset-sh/issue/SUPER-755/collapse-chat-composer-model-settings-into-one-menu
tracker: linear
title: "Collapse chat composer model settings into one menu"
labels: []
project: "Justin"
project_milestone: "Chat UI"
priority: "Low"
status: "Todo"
created_by: "Satya Patel"
created_at: "2026-05-16T17:21:06.439Z"
fetched_at: "2026-05-22T00:00:00Z"
user_directive: "have frontend-designer look at and propose a cleaner interface that follows the request"
---

# SUPER-755: Collapse chat composer model settings into one menu

## Context

The v2 chat composer footer renders three separate pill buttons in a row — permission mode, model picker, and thinking level. It looks cluttered. Collapse these into a single consolidated menu so the composer reads cleaner, while keeping every setting reachable.

> Reference screenshots in Linear ticket show the current multi-pill layout and the desired collapsed-menu direction. (Image URLs are pre-signed, short-lived.)
>
> - Screenshot 1: https://uploads.linear.app/b0f36e38-dbb9-4fe9-b7d0-303dc3e0e252/7c91601e-52a3-49e7-b7ad-6edb3fbdba45/e3acb867-2a85-4bbe-931b-ba44ed0929d8
> - Screenshot 2: https://uploads.linear.app/b0f36e38-dbb9-4fe9-b7d0-303dc3e0e252/7c0a5c43-f944-4d71-bc9f-cb7485bb3890/d9d1911d-0027-41c7-857f-159985c5d34c

## References

Internal — Satya Patel, created 2026-05-16. Project "Justin", milestone "Chat UI". Reference screenshots above show the current multi-pill layout and the desired collapsed-menu direction.

## Implementation notes (HINTS — not constraints; investigator may revise)

### Files

- `apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/ChatPane/components/WorkspaceChatInterface/components/ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx` — renders the three in-a-row controls inside `PromptInputTools`: `PermissionModePicker`, `ModelPicker`, and `ThinkingToggle`. This is the component to restructure.
- `.../WorkspaceChatInterface/components/ModelPicker/ModelPicker.tsx` — the model selector (provider groups, API-key dialogs); the heaviest of the three controls.
- `apps/desktop/src/renderer/components/Chat/ChatInterface/components/PermissionModePicker/PermissionModePicker.tsx` — permission mode pill.
- `@superset/ui/ai-elements/thinking-toggle` — `ThinkingToggle`, the thinking-level pill.
- `apps/desktop/src/renderer/components/Chat/ChatInterface/styles.ts` — `PILL_BUTTON_CLASS`, shared pill styling.

### Approach

Replace the three sibling pills in `ChatComposerControls` with one trigger button that opens a single popover/menu containing all model settings — model, permission mode, and thinking level — as grouped sections. The trigger should surface the current model (and likely the active permission mode) at a glance, with the rest revealed on open. Reuse the existing `ModelPicker`, `PermissionModePicker`, and `ThinkingToggle` internals as menu sections rather than rewriting their logic; only the composition/layout changes. Check the v1 chat composer (`renderer/components/Chat/ChatInterface/.../ChatComposerControls`) for whether it should adopt the same consolidated menu for consistency.

### Gotchas

- This is a presentation-only refactor — no change to model/permission/thinking state or the props plumbed through `ChatInputFooter`.
- `ModelPicker` owns its own open/close state (`open`/`onOpenChange`) and triggers navigation for API-key setup; nesting it inside a parent menu must not create competing popover layers — verify focus and dismiss behavior.

## User directive (for the investigation team)

The slash command was invoked with:

> have frontend-designer look at and propose a cleaner interface that follows the request

The investigator must bring `frontend-designer` in as a design consultant. The proposed cleaner interface (trigger appearance + grouped-menu layout) should be authored by `frontend-designer` working from the reference screenshots and current component structure, then folded into the scope options. The investigator owns SCOPE.md; the frontend-designer owns the visual proposal embedded inside it.
