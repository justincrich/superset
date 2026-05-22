# chat-view-error-retry

## Purpose

The error recovery state for the Superset mobile chat interface. Rendered when the chat history fetch fails after navigating into a session. The thread region is replaced entirely by a centered error empty-state with a Retry CTA; the composer footer is rendered at opacity 0.5 with `pointer-events: none` because the session itself has not loaded. This is the composition reference for UC-SESS-02 §B.

## PRD Wireframe Reference

**UC-SESS-02 §B** — Chat history fetch error + retry

```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
├──────────────────────────────────────┤
│                                      │
│        ⚠                             │  ← alert-triangle --xl, danger color
│                                      │
│   Couldn't load history              │
│                                      │
│   Check your connection or           │
│   try again.                         │
│                                      │
│        ┌──────────────┐              │
│        │   Retry      │              │  ← atom-button --primary --md
│        └──────────────┘              │
│                                      │
├──────────────────────────────────────┤
│ [Sonnet 4.6] [⚡ low] [🔐 default]   │
│ ┌────────────────────────────────┐   │
│ │  Type a message…         [▶]  │   │  ← composer disabled (opacity 0.5)
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery indicators |
| App header | `mol-app-header` | Back button, "Fix auth bug" title, "superset · main" subtitle, more-vertical action |
| Error body | `<main role="main">` + `.view-chat-view-error-retry__body` | `flex: 1`, centers `mol-empty-state` vertically + horizontally |
| Error empty state | `mol-empty-state` | Alert-triangle hero icon, "Couldn't load history" heading, body copy, Retry CTA |
| Alert icon | `atom-icon-glyph --xl --danger` | alert-triangle SVG, `var(--state-danger-fg)` fill via `--danger` modifier |
| Retry CTA | `atom-button --primary --md` | "Retry" label, full touch target |
| Composer footer | `.view-chat-view-error-retry__composer` | `opacity: 0.5`, `pointer-events: none` — session not loaded |
| Composer toolbar | `mol-composer-toolbar is-disabled` | `.is-disabled` sets `opacity: 0.4` on all triggers |
| Composer row | `mol-composer-row --idle` | Textarea (disabled), send icon-button (disabled primary pill) |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill, absolute at viewport bottom |

## Composition Table

Every atom and molecule used in this view:

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-icon-button --ghost --md` | Atom | Back button, more-vertical button |
| `atom-icon-button --primary --md --pill` | Atom | Send button in composer (disabled) |
| `atom-icon-glyph --xl --danger` | Atom | Alert-triangle hero icon in error state |
| `atom-button --primary --md` | Atom | Retry CTA |
| `atom-pill --default --md --leading-icon` | Atom | Each composer toolbar picker trigger (disabled) |
| `atom-textarea --composer` | Atom | Disabled composer input |
| `mol-app-header` | Molecule | Back + title/subtitle + actions header row |
| `mol-empty-state` | Molecule | Centered error content: icon, heading, body, CTA |
| `mol-composer-toolbar` | Molecule | Scrollable toolbar with 3 triggers (`is-disabled`) |
| `mol-composer-row --idle` | Molecule | Textarea + send button row (whole footer at opacity 0.5) |

**Distinct atom classes composed: 9**
**Distinct molecule classes composed: 4**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--surface-page)` | Composer footer background, body background |
| `var(--surface-soft)` | Preview plate background |
| `var(--surface-sunken)` | Pane-label background |
| `var(--border-subtle)` | Composer footer top border, pane border, pane-label border |
| `var(--radius-default)` | Pane border-radius |
| `var(--radius-subtle)` | Pane-label border-radius |
| `var(--safe-area-bottom)` | Composer footer bottom padding |
| `var(--font-mono)` | `.crumb` font in preview plate |
| `var(--font-size-meta)` | `.crumb` font size, pane-label font size |
| `var(--text-muted)` | `.crumb` color, pane-label color |
| `var(--tracking-mono)` | `.crumb` and pane-label letter spacing |
| `var(--state-danger-fg)` | Alert-triangle icon color via `atom-icon-glyph--danger` modifier (no inline style needed) |

## Disabled Composer Rationale

The composer footer uses view-local `opacity: 0.5; pointer-events: none` rather than `mol-composer-row.is-disabled` because the disabled state is holistic — both toolbar and input row are unavailable simultaneously for the same reason (session not loaded). The molecule-level `.is-disabled` modifier applies only to the toolbar's individual triggers; the view-level approach more accurately communicates that the entire composer region is locked until the session loads successfully.

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Error region landmark | `<main role="main" aria-label="Chat history error">` |
| Error live region | `role="status" aria-live="polite"` on `mol-empty-state` — screen reader announces the error |
| Alert icon | `aria-hidden="true"` — decorative; heading conveys the error |
| App header landmark | `<header role="banner">` |
| Back button | `aria-label="Back to sessions"` |
| More-vertical button | `aria-label="Session actions"` |
| Retry CTA | `aria-label="Retry loading chat history"` — more descriptive than visible label alone |
| Composer footer | `aria-label="Message composer — unavailable"` + `aria-disabled="true"` |
| Composer toolbar | `aria-disabled="true"` mirrors visual state for assistive tech |
| Disabled textarea | `disabled` attribute + `aria-label` noting unavailable state |
| Disabled send button | `disabled` attribute |
| Status bar / Dynamic Island | `aria-hidden="true"` — purely decorative chrome |

## Layout Choices

- **Error body flex centering**: `.view-chat-view-error-retry__body` uses `display: flex; align-items: center; justify-content: center` with `flex: 1` to fill the available space between the header and composer, centering the `mol-empty-state` vertically and horizontally within that slot.
- **Composer disabled state**: The view-local class sets `opacity: 0.5; pointer-events: none` on the entire `<footer>` rather than relying on individual molecule disabled states. This creates a single visual unit that communicates "nothing here is interactive until the error is resolved."
- **mol-composer-toolbar is-disabled**: Added in addition to the footer-level opacity so that the molecule's built-in disabled rule (`opacity: 0.4` on triggers, `pointer-events: none`) applies when the footer opacity is later removed by JavaScript during a retry animation.
- **Composer bottom padding**: Uses `padding-block-end: var(--safe-area-bottom)` so the composer clears the home indicator on real hardware.
- **No scroll fades**: The error body has `overflow: hidden` (not scrollable) so scroll-fade gradients are omitted — they would serve no purpose without a scrollable container.
