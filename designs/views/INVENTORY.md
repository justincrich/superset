# Chat Views — Phase 5 (pivoted: atoms→views, skip molecules+organisms)

**Pivot direction (2026-05-22):** Build chat-view interfaces directly from the chat-mobile-plan PRD wireframes using maximum reuse of the existing atomic system. Skip the remaining molecules + organisms layers.

**Reusable inventory available:**
- **Tokens** (`designs/tokens/tokens.css`) — full unified ember palette + mobile chrome
- **Type modules** (`designs/typography/type-modules.css`) — `.type-h1/h2/title/body/body-sm/meta/label/code`
- **Atoms** (`designs/molecules/_atoms.css`) — 25 atoms, 386 CSS rules. Reference: `designs/atoms/INVENTORY.md`
- **Molecules already built** (`designs/molecules/`) — 12 compose-by-class molecules:
  `session-row · workspace-section-header · host-chip · search-bar · load-more-pill · host-picker-row · empty-state · user-message-bubble · assistant-message-head · tool-call-card · collapsed-block · scroll-back-button`

**Composition principle:** When the view needs a pattern not yet a molecule (composer-toolbar, picker-popover, approval-card-with-sticky-footer, ask-user-bottom-sheet, plan-review-modal, pending-action-pill, etc.), INLINE the composition using atoms directly. Don't bottle up new molecules — go straight to view-level integration.

**Frame:** Every view renders inside the `atom-device-bezel` (iPhone 16 Pro Max, 444×962) so mocks are mobile-accurate.

## View Inventory

### Chat-tree views (UC-RENDER)

| # | View | PRD wireframe | Composes |
|---|------|---------------|----------|
| 1 | `chat-view-thread` | UC-RENDER-01 §A | app-header (inline) · user-message-bubble · assistant-message-head + body · streaming-cursor · composer-toolbar (inline) · composer textarea · icon-button (send/stop) |
| 2 | `chat-view-markdown` | UC-RENDER-03 §A | assistant body with code block + inline code; reuse tokens for code-block surface |
| 3 | `chat-view-tool-calls` | UC-RENDER-04 §A | 3 × tool-call-card molecules (running/done/error) |
| 4 | `chat-view-reasoning-plan` | UC-RENDER-05 §A | 3 × collapsed-block (plan collapsed + expanded + reasoning) |
| 5 | `chat-view-subagent` | UC-RENDER-06 §A | nested collapsed-block (subagent variant) with inner tool-call-card |
| 6 | `chat-view-scroll-back` | UC-RENDER-07 §A | scroll-back-button molecule above composer |

### Composer-state views (UC-COMP)

| # | View | PRD wireframe | Composes |
|---|------|---------------|----------|
| 7 | `composer-states` | UC-COMP-01 §A/B + UC-COMP-03 §A | idle + typing + streaming-stop, stacked sections |
| 8 | `composer-slash-menu` | UC-COMP-01 §C | composer with `@rn-primitives/popover`-style slash menu above input |
| 9 | `composer-model-picker` | UC-COMP-04 §A | model picker popover with section divider (Anthropic / OpenAI) |
| 10 | `composer-thinking-picker` | UC-COMP-05 §A | thinking-level popover with token-budget hints |

### Pause-state views (UC-PAUSE)

| # | View | PRD wireframe | Composes |
|---|------|---------------|----------|
| 11 | `pause-approval-inline` | UC-PAUSE-01 §A | PendingApprovalCard inline + sticky PendingApprovalFooter with Approve/Decline/Always |
| 12 | `pause-question-sheet` | UC-PAUSE-02 §A | bottom sheet w/ question + suggested-answer pills + BottomSheetTextInput + keyboard panel |
| 13 | `pause-plan-review` | UC-PAUSE-03 §A | full-screen modal: header + scrollable markdown + expandable feedback + docked Approve/Reject |
| 14 | `pause-action-pill` | UC-PAUSE-04 §A | floating pending-action pill above composer when pause is off-screen |

## Composition rules

1. **Atoms first** — every interactive element (button, icon-button, pill, status-dot, etc.) must be an existing atom class composition.
2. **Tokens always** — every color / spacing / typography value resolves to `var(--*)` from `tokens.css`.
3. **Type modules** — body / heading / meta typography always uses `.type-*` classes from `type-modules.css`.
4. **Mobile frame** — each view is rendered inside `atom-device-bezel` (444×962) at 100% scale so the design is visually accurate.
5. **Two themes** — every view renders BOTH in dark (default) and light, as stacked sections (NOT side-by-side per the skill's view-rendering rule).
6. **Real content** — every text element uses Superset-context content (relay tunnel reconnect, JWT rotation, billing refactor, etc.), never lorem ipsum.

## Missing-atom escape

If a view needs an atom that doesn't exist, emit at top of subagent reply:
```
ATOM_GAP: <atom-name> — <rationale>
```

The orchestrator will create the atom and resume the view. (For Phase 5 this is rare — the 25-atom set should cover everything.)
