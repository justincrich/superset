# chat-view-scroll-back

## Purpose

Renders the Superset mobile chat thread in the **scrolled-up state** — the user has paged back through earlier messages and the scroll-back FAB is visible. This is the design reference for UC-RENDER-07 §A: the Reanimated FadeIn of `mol-scroll-back-button` above the composer bar.

## PRD Wireframe Reference

**UC-RENDER-07 §A** — Scroll-back FAB visible

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
├──────────────────────────────────────┤
│  [older messages visible]            │
│                                      │
│  Aug 12, 2025  ─────────────────     │  ← user has scrolled up
│                                      │
│  User: Can you refactor billing?     │
│                                      │
│                      ┌────────────┐  │
│                      │ ↓ Latest  │  │  ← scroll-back FAB, Reanimated FadeIn
│                      └────────────┘  │
├──────────────────────────────────────┤
│ ┌──────────────────────────────── ┐  │
│ │  Type a message…         [ ▶ ] │  │
│ └──────────────────────────────── ┘  │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962) |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative OLED-off pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery |
| App header | `mol-app-header` | Back button, "Fix auth bug" title, "superset · main" subtitle, more-vertical action |
| Thread scroll | `<main role="log">` + `.view-chat-view-scroll-back__thread` | Scrollable, `position: relative` for FAB anchor |
| Scroll fade top | `atom-scroll-fade --top --on-page` | Visible — user has scrolled away from top |
| User message (8:45 AM) | `mol-user-message-bubble` | "Can you refactor billing to use tRPC?" |
| Assistant reply (8:46 AM) | `mol-assistant-message-head --idle` + body | Truncated response, idle (turn complete) |
| Date separator | `.view-chat-view-scroll-back__date-sep` | `atom-section-label --faint` "Aug 12, 2025" + hairline rule |
| User message (9:30 AM) | `mol-user-message-bubble` | "Let's pick this up where we left off" |
| Assistant reply (9:31 AM) | `mol-assistant-message-head --idle` + body | Truncated continuation, idle |
| Scroll-back FAB | `mol-scroll-back-button --idle` | Absolute bottom-right, above composer — is-entering state (opacity:1) |
| Scroll fade bottom | `atom-scroll-fade --bottom --on-page` | Visible — content continues below viewport |
| Composer footer | `.view-chat-view-scroll-back__composer` | Sticky footer, border-top, safe-area-bottom |
| Composer toolbar | `mol-composer-toolbar` | 3 picker-trigger pills: model / thinking / permission |
| Composer row | `mol-composer-row --idle` | Idle: textarea with placeholder, send button disabled |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill |

## Composition Table

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-icon-button --ghost --md` | Atom | Back button, more-vertical button |
| `atom-icon-button --primary --md --pill` | Atom | Send button (disabled in idle state) |
| `atom-avatar --accent --sm` | Atom | "A" accent circle in assistant head rows |
| `atom-section-label --faint` | Atom | Date separator label ("Aug 12, 2025") |
| `atom-section-label --strong` | Atom | "Assistant" label in message head rows |
| `atom-section-label` (default) | Atom | Timestamp labels in message head rows |
| `atom-scroll-fade --top / --bottom` | Atom | Gradient masks at top and bottom of thread |
| `atom-pill --default --md --leading-icon` | Atom | Each composer toolbar picker trigger |
| `atom-textarea --composer` | Atom | Idle composer input |
| `atom-fab-base --overlay --md` | Atom | 56 px circular FAB shell for scroll-back button |
| `atom-icon-glyph --md` | Atom | Chevron-down icon inside scroll-back FAB |
| `mol-app-header` | Molecule | Back + title/subtitle + actions header |
| `mol-user-message-bubble` | Molecule | Right-aligned user message bubbles (×2) |
| `mol-assistant-message-head --idle` | Molecule | Avatar + label + time, idle state (×2) |
| `mol-scroll-back-button --idle` | Molecule | Floating scroll-back FAB, is-entering state |
| `mol-composer-toolbar` | Molecule | Scrollable toolbar with 3 triggers |
| `mol-composer-row --idle` | Molecule | Idle textarea + disabled send button |

**Distinct atom classes composed: 15**
**Distinct molecule classes composed: 6**

## Scroll-back FAB Positioning

The `mol-scroll-back-button` uses `position: absolute` with:
- `right: var(--space-4)`
- `bottom: calc(var(--composer-min-height) + var(--space-4))`

Its positioning context is `.view-chat-view-scroll-back__thread`, which sets `position: relative`. This places the FAB above the composer bar's natural height without overlapping the input.

The button is shown in its **is-entering** state (opacity: 1, no `is-hidden` class) — the static HTML snapshot captures the moment after the Reanimated FadeIn has completed.

## Date Separator Pattern

The date separator is composed inline from existing atoms rather than a dedicated molecule (first and only use in this view — Rule of 2 not met):

```html
<div class="view-chat-view-scroll-back__date-sep" role="separator" aria-label="August 12, 2025">
  <span class="atom-section-label atom-section-label--faint">Aug 12, 2025</span>
  <hr class="view-chat-view-scroll-back__date-rule" aria-hidden="true">
</div>
```

The `__date-rule` is a view-local `<hr>` with `flex: 1` and `border-top: 1px solid var(--border-subtle)` — equivalent to an `atom-divider--horizontal` but kept inline because no dedicated `atom-divider` class is imported in this view. If this pattern appears in 2+ views, extract to `atom-section-label--with-rule` (which already has `::after` pseudo-element support).

**ATOM_GAP note**: `atom-section-label--with-rule` already provides a label + trailing rule via `::after` pseudo-element (documented in atom spec). That modifier could replace the `__date-sep` + `__date-rule` pattern if the label precedes the rule direction matches. Used here as inline composition to maintain view-local clarity.

## Token Recipe

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--space-half)` | Inline code vertical padding |
| `var(--line-height-normal)` | `p` line-height in assistant body |
| `var(--surface-page)` | Composer footer background, body background |
| `var(--surface-sunken)` | Inline code background |
| `var(--border-subtle)` | Composer footer top border, date-rule hairline |
| `var(--accent-primary)` | Inline code text color |
| `var(--radius-subtle)` | Inline code border radius |
| `var(--safe-area-bottom)` | Composer footer bottom padding |
| `var(--font-mono)` | `.crumb` font in preview plate |
| `var(--font-size-meta)` | `.crumb` font size |
| `var(--text-muted)` | `.crumb` color, pane-label color |
| `var(--tracking-mono)` | `.crumb` letter spacing |

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Thread live region | `<main role="log" aria-live="polite">` |
| User message articles | `role="article"` + `aria-label` with timestamp |
| Assistant message articles | `<article aria-label="...">` |
| Date separator | `role="separator"` + `aria-label="August 12, 2025"` |
| Date rule hairline | `aria-hidden="true"` — decorative |
| App header landmark | `<header role="banner">` |
| Scroll-back FAB | `aria-label="Scroll to latest message"` on the button |
| Composer footer | `<footer aria-label="Message composer">` |
| Composer toolbar | `role="toolbar" aria-label="Composer options"` |
| Disabled send button | `disabled` + `aria-disabled="true"` |
| Status bar / Dynamic Island | `aria-hidden="true"` |
| Scroll fade gradients | `aria-hidden="true"` |

## Layout Choices

- **Viewport flex column**: `atom-device-bezel__viewport` is `display:flex; flex-direction:column`. The thread `<main>` receives `flex: 1` via the view-local class.
- **FAB anchor**: `.view-chat-view-scroll-back__thread` sets `position: relative` so `mol-scroll-back-button`'s `position: absolute` anchors inside the scroll region, floating above the composer.
- **Scroll fade state**: Both top and bottom scroll fades are `is-visible` (no `is-hidden`) to convey the mid-scroll position — content exists above and below the visible viewport window.
- **Composer idle state**: The `--idle` modifier on `mol-composer-row` sets `opacity: 0.6` on the action slot (send button), matching the pattern when no text has been entered.
- **Composer safe area**: Uses `padding-block-end: var(--safe-area-bottom)` so the composer clears the home indicator on real hardware.
