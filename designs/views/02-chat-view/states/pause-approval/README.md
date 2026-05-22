# pause-approval-inline-footer

## Purpose

The pause state view for the Superset mobile chat interface. Renders the moment a tool-approval interrupt is triggered mid-turn: the chat thread pauses, an inline `mol-pending-approval-card` appears in the message stream directly below the assistant's explanation text, and a `mol-approval-footer` slides up to replace the composer at the bottom of the viewport. The composer is suppressed for the duration of the approval pause.

## PRD Wireframe Reference

**UC-PAUSE-01 §A** — Inline approval card + sticky footer

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
├──────────────────────────────────────┤
│  [prior messages]                    │
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ⌖ Tool approval required        │ │  ← PendingApprovalCard inline
│ │ bash · run_tests.sh              │ │
│ │ ─────────────────────────────── │ │
│ │ $ bun test --filter billing      │ │
│ └──────────────────────────────────┘ │
│                                      │
├──────────────────────────────────────┤  ← sticky footer slides up
│  1 of 1  ┌────────┐┌──────┐┌──────┐ │
│          │Approve ││Decline││Always│ │  ← ≥44pt
│          └────────┘└──────┘└──────┘ │
├──────────────────────────────────────┤
│ ┌────────────────────────────────┐   │
│ │  (composer hidden during pause)│   │
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:39, signal/wifi/battery indicators |
| App header | `mol-app-header` | Back button, "Fix auth bug" title, "superset · main" subtitle, more-vertical action |
| Thread scroll | `<main role="log">` + `.view-pause-approval-inline-footer__thread` | Scrollable message list, `aria-live="polite"` |
| Scroll fade top | `atom-scroll-fade --top` | Gradient mask, hidden at scroll-top |
| User message | `mol-user-message-bubble` | Right-aligned bubble, 85% max-width, secondary surface |
| Assistant head | `mol-assistant-message-head --idle` | Avatar A (accent), "Assistant" label, timestamp; no streaming status since turn is paused |
| Assistant body | `.view-pause-approval-inline-footer__body .type-body` | Explanation prose preceding the card |
| Pending approval card | `mol-pending-approval-card --default` | Inline in thread; amber `--pending` left rule with glow; target icon; bash · run_tests.sh subtitle; args preview block |
| Scroll fade bottom | `atom-scroll-fade --bottom` | Gradient mask at bottom of scroll region |
| Approval footer | `mol-approval-footer --queued` | Sticky footer with horizontal `--pending` rule, "1 OF 1" counter badge, Decline / Approve / Always buttons at ≥44pt |
| Composer stub | `.view-pause-approval-inline-footer__composer-stub` | `opacity: 0.3`, `pointer-events: none`, `aria-hidden="true"` — signals composer exists but is suppressed |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill, absolute at viewport bottom |

## Composition Table

Every atom and molecule used in this view:

| Atom / Molecule | Class(es) applied | Role |
|---|---|---|
| `atom-device-bezel` | default | iPhone 16 Pro Max device shell |
| `atom-device-bezel__viewport` | — | Clip region, flex column |
| `atom-device-bezel__dynamic-island` | — | OLED-off black decorative pill |
| `atom-device-bezel__status-bar` | — | iOS status bar row |
| `atom-device-bezel__battery` | — | Battery capsule + fill |
| `atom-device-bezel__home-indicator` | — | Home swipe pill |
| `mol-app-header` | default | Session navigation header |
| `mol-app-header__back` | — | Back chevron slot |
| `mol-app-header__title-wrap` | — | Centered title + subtitle |
| `mol-app-header__title` | `type-title` | Session name |
| `mol-app-header__subtitle` | `type-meta` | Repo + branch |
| `mol-app-header__actions` | — | Trailing icon button slot |
| `atom-icon-button` | `--ghost --md` | Back chevron button + more-vertical button |
| `mol-user-message-bubble` | default | Right-aligned user bubble |
| `mol-user-message-bubble__bubble` | `type-body` | Message text container |
| `mol-user-message-bubble__meta` | — | Timestamp row |
| `mol-assistant-message-head` | `--idle` | Head row; no live status since turn is paused |
| `atom-avatar` | `--accent --sm` | "A" accent avatar |
| `mol-pending-approval-card` | `--default` | Inline approval card in thread |
| `atom-tool-status-rule` | `--vertical --pending` | Left amber rule with glow |
| `atom-icon-glyph` | `--sm` (warning color via molecule) | Target/crosshair approval icon |
| `atom-divider` | `--hairline` (as `<hr>`) | Separator between subtitle and args |
| `mol-approval-footer` | `--queued` | Sticky bottom approval controls |
| `atom-tool-status-rule` | `--horizontal --pending` | Top amber rule on footer |
| `atom-badge` | `--neutral --md` | "1 OF 1" queue counter |
| `atom-button` | `--destructive --md` | Decline button |
| `atom-button` | `--primary --md` | Approve button |
| `atom-button` | `--ghost --md` | Always button |
| `atom-scroll-fade` | `--top`, `--bottom` | Thread scroll masks |

## Key Design Decisions

**Approval footer variant**: Uses `mol-approval-footer--queued` (not `--single`) to make the "1 OF 1" counter badge visible. This matches the brief's requirement to show the counter and provides clearer feedback that this is item 1 of 1 in the queue.

**Composer treatment**: Per brief, the composer is shown as a faded stub (`opacity: 0.3`, `pointer-events: none`, `aria-hidden="true"`) rather than omitted entirely. This preserves spatial continuity — the user can see where the composer will reappear after approval resolves — without making it interactive.

**Assistant head state**: Uses `--idle` (not `--streaming`) because the assistant turn is paused pending approval, not actively streaming. The live status indicator is absent.

**Button order**: Decline · Approve · Always — destructive leftmost, primary center, ghost rightmost. This matches the `mol-approval-footer` molecule reference pattern.

## Style Sheet Load Order

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

View-local layout rules are scoped exclusively to `.view-pause-approval-inline-footer__*` — no `.atom-*` or `.mol-*` rules are redefined.

## Token Notes

| Property | Token | Notes |
|---|---|---|
| Pending rule color + glow | `--state-warning-fg` | Applied by `atom-tool-status-rule--pending` |
| Card background | `--surface-raised` | Elevated card base |
| Args background | `--surface-sunken` | Inset code block |
| Footer background | `--surface-page` | Matches page, footer blends with content |
| Composer stub opacity | `0.3` | TOKEN_GAP: no `--opacity-suppressed` token — structural exception |
| Touch target floor | `--touch-target-min` | 44px on all buttons (WCAG 2.5.8 / iOS HIG) |
