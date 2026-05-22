# chat-view-host-offline-and-dispatch

## Purpose

Three-frame view that renders every platform-error banner state a user can see inside an active chat session. Covers UC-PLATF-03 §A (host offline, warning-severity) and UC-PLATF-03 §B (dispatch outcomes: `skipped_unpaid` and `dispatch_failed`, both danger-severity). Each frame places the correct `mol-banner` variant directly below the `mol-app-header`, above an idle message history, with the composer in its appropriate disabled or send-blocked state.

## PRD Wireframe References

**UC-PLATF-03 §A — Host offline + disabled Send:**
```
┌──────────────────────────────────────┐
│  ← Sessions   Fix auth bug    ···    │
├──────────────────────────────────────┤
│ ┌──────────────────────────────────┐ │
│ │ ⚠ Host offline · Retry         │ │  ← mol-banner --offline --inline
│ └──────────────────────────────────┘ │
│                                      │
│  [message history — still visible]   │
│                                      │
├──────────────────────────────────────┤
│ [Sonnet 4.6] [⚡ low] [🔐 default]   │
│ ┌────────────────────────────────┐   │
│ │  Type a message…        [ ▶ ] │   │  ← Send .is-disabled + disabled attr
│ └────────────────────────────────┘   │
└──────────────────────────────────────┘
```

**UC-PLATF-03 §B — skipped_unpaid:**
```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ ⚠ Host plan required            │ │  ← mol-banner --unpaid --stacked
│ │ Upgrade your host to resume.     │ │
│ │ [ Upgrade → ]                    │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

**UC-PLATF-03 §B — dispatch_failed:**
```
┌──────────────────────────────────────┐
│ ┌──────────────────────────────────┐ │
│ │ ⚠ Dispatch failed · Retry       │ │  ← mol-banner --dispatch-failed --inline
│ │ Couldn't reach Claude.           │ │
│ └──────────────────────────────────┘ │
└──────────────────────────────────────┘
```

## Anatomy (per frame, top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962) |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative OLED pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery |
| App header | `mol-app-header` | Back button, "Fix auth bug", "superset · main", more-vertical |
| Banner zone | `.view-chat-offline-dispatch__banner-zone` | Top padding only; holds single `mol-banner` |
| Banner — F1 | `mol-banner --offline --inline` | Warning bg, wifi-off icon, Retry link-button, `role="status"` |
| Banner — F2 | `mol-banner --unpaid --stacked` | Danger bg, alert-triangle, bold heading, body text, Upgrade secondary-button, `role="alert"` |
| Banner — F3 | `mol-banner --dispatch-failed --inline` | Danger bg, alert-triangle, inline copy, Retry link-button, `role="alert"` |
| Thread scroll | `<main role="log">` + `.view-chat-offline-dispatch__thread` | `flex: 1`, shows idle history — user bubble + assistant idle turn |
| User message | `mol-user-message-bubble` | "Fix the JWT rotation in relay-client.ts" |
| Assistant head | `mol-assistant-message-head --idle` | Avatar A (accent), "Assistant", timestamp, no live status |
| Assistant body | `.view-chat-offline-dispatch__body .type-body` | Single paragraph with inline `<code>` |
| Scroll fades | `atom-scroll-fade --top / --bottom` | Top hidden at scroll-top |
| Composer footer | `.view-chat-offline-dispatch__composer` | Sticky, `border-top`, `safe-area-bottom` pad |
| Composer toolbar | `mol-composer-toolbar` | 3 pills (model / thinking / permission) — `.is-disabled` + `disabled` attr in §B frames |
| Composer row | `mol-composer-row --idle` | Textarea + Send icon-button; Send `.is-disabled` + `disabled` on all three frames |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill |

### Disabled-state difference between frames

| Frame | Banner | Toolbar pills | Textarea | Send button |
|-------|--------|---------------|----------|-------------|
| F1 Host offline | warning/inline | `.is-disabled` + `disabled` | enabled (user can compose, not send) | `.is-disabled` + `disabled` |
| F2 Plan required | danger/stacked | `.is-disabled` + `disabled` | `disabled` + `.mol-composer-row.is-disabled` | `.is-disabled` + `disabled` |
| F3 Dispatch failed | danger/inline | `.is-disabled` + `disabled` | `disabled` + `.mol-composer-row.is-disabled` | `.is-disabled` + `disabled` |

Frame 1 intentionally leaves the textarea interactive so the user can pre-compose a message while waiting for the host to come back online. The Send button remains blocked until the host reconnects.

## Composition Table

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-icon-button --ghost --md` | Atom | Back button, more-vertical button |
| `atom-icon-button --primary --md --pill` | Atom | Send button (disabled in all 3 frames) |
| `atom-icon-glyph --sm` | Atom | Banner icon (wifi-off / alert-triangle) |
| `atom-avatar --accent --sm` | Atom | "A" circle in assistant head |
| `atom-section-label` | Atom | Frame section heading above each bezel |
| `atom-pill --default --md --leading-icon` | Atom | Each composer toolbar picker trigger |
| `atom-textarea --composer` | Atom | Composer input |
| `atom-scroll-fade --top / --bottom` | Atom | Gradient masks on thread |
| `atom-tool-status-rule --horizontal` | Atom | Horizontal rule inside banner |
| `atom-button --link --sm` | Atom | Retry CTA in F1 and F3 banners |
| `atom-button --secondary --sm` | Atom | Upgrade CTA in F2 banner |
| `mol-app-header` | Molecule | Back + title/subtitle + actions header |
| `mol-banner --offline --inline` | Molecule | Host offline banner (F1) |
| `mol-banner --unpaid --stacked` | Molecule | Plan required banner (F2) |
| `mol-banner --dispatch-failed --inline` | Molecule | Dispatch failed banner (F3) |
| `mol-user-message-bubble` | Molecule | Right-aligned user bubble |
| `mol-assistant-message-head --idle` | Molecule | Avatar + label + time (no live dot) |
| `mol-composer-toolbar` | Molecule | 3-trigger toolbar |
| `mol-composer-row --idle` | Molecule | Textarea + action slot |

**Distinct atom classes composed: 14**
**Distinct molecule classes composed: 7**

## Token Recipe

View-local `<style>` block only — atoms and molecules handle their own tokens:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--space-half)` | Inline code vertical padding |
| `var(--line-height-normal)` | Body paragraph `line-height` |
| `var(--surface-page)` | Composer footer background |
| `var(--surface-sunken)` | Inline `<code>` background |
| `var(--border-subtle)` | Composer footer top border |
| `var(--accent-primary)` | Inline `<code>` text color |
| `var(--radius-subtle)` | Inline `<code>` border radius |
| `var(--safe-area-bottom)` | Composer footer bottom padding |
| `var(--font-mono)` | `.crumb` preview label font |
| `var(--font-size-meta)` | `.crumb` font size |
| `var(--text-muted)` | `.crumb` color, `.pane-label` color |
| `var(--tracking-mono)` | `.crumb` letter-spacing |

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Thread live region | `<main role="log" aria-live="polite">` |
| User message | `role="article"` + `aria-label="Your message"` |
| Assistant message | `<article aria-label="Assistant message">` |
| App header landmark | `<header role="banner">` |
| Composer footer | `<footer aria-label="Message composer">` |
| Composer toolbar | `role="toolbar" aria-label="Composer options"` |
| Offline banner (F1) | `role="status" aria-live="polite"` — non-urgent notification |
| Unpaid banner (F2) | `role="alert" aria-live="assertive"` — urgent, blocks progress |
| Dispatch-failed banner (F3) | `role="alert" aria-live="assertive"` — urgent error |
| Disabled Send (F1) | `disabled` attr + `aria-label` noting host offline reason |
| Disabled composer (F2, F3) | `disabled` attr on textarea + `is-disabled` on row |
| Status bar / Dynamic Island | `aria-hidden="true"` — purely decorative chrome |
| Banner rule | `aria-hidden="true"` — decorative accent stripe |

## Layout Choices

- **Banner zone above thread**: `.view-chat-offline-dispatch__banner-zone` uses `padding: var(--space-3) var(--space-4) 0` so the banner sits flush with the screen edge (same horizontal inset as the header) but doesn't collapse the thread scroll area. The thread `<main>` still receives `flex: 1` and absorbs remaining viewport height.
- **Stacked vs inline banner shapes**: Frame 2 (plan required) uses `--stacked` because the Upgrade CTA needs its own block-level row below the body copy. Frames 1 and 3 use `--inline` because a single trailing link-button fits in the row without wrapping.
- **Warning vs danger coloring**: The offline state (`mol-banner--offline`) relies on `var(--state-warning-bg)` / `var(--state-warning-fg)` — it signals degraded-but-recoverable. The `--unpaid` and `--dispatch-failed` variants use `var(--state-danger-bg)` / `var(--state-danger-fg)` because they represent blocked sessions requiring explicit user action.
- **Frame 1 textarea stays enabled**: Host offline only blocks dispatch (the relay tunnel is down), not composing. The textarea remains usable so users can type their next message while the host reconnects. The Send button is the only blocked affordance.
- **Toolbar pills disabled consistently**: All three frames disable the toolbar pickers since neither model nor permission changes are meaningful when the session is blocked.
