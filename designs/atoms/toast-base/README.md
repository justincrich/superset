# atom · toast-base

A single notification toast that surfaces above the chat interface to confirm
actions or report errors. Auto-dismisses after a configurable timeout. Composed
of a leading status icon, body text, an optional title (stacked shape only), an
optional action button, and an optional dismiss button.

Production reference: `apps/desktop/src/renderer/components/ThemedToaster/`
and `UpdateToast` (sonner-based).

---

## Anatomy

```
┌──────────────────────────────────────────────────────────┐
│ ▌  [icon]  [body text — .type-body-sm]    [action] [✕]  │  ← inline shape
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│ ▌  [title — .type-label]           [✕]  │  ← stacked shape
│    [body text — .type-body-sm]           │
│    [action button]                       │
└──────────────────────────────────────────┘
```

The `▌` is the 3 px semantic left rule (`border-left`). It is the sole
color-coded element that communicates variant; icon color echoes it.

### Element tree

```
.atom-toast-base                          (root — also the live region wrapper)
  .atom-toast-base__rule                  (left accent rule — variant color)
  .atom-toast-base__icon                  (slot — inline SVG or spinner)
  .atom-toast-base__content              (flex column)
    .atom-toast-base__title              (only in --stacked; .type-label)
    .atom-toast-base__body               (always present; .type-body-sm)
  .atom-toast-base__actions             (optional — action + dismiss)
    .atom-toast-base__action             (text link or ghost button)
    .atom-toast-base__dismiss            (✕ icon-button — always in stacked)
```

---

## Variants (5 — semantic)

| Modifier class | Left rule / icon color | Background tint | Use case |
|---|---|---|---|
| `--info` (default) | `--accent-primary` | `--surface-overlay` | Generic notifications, update available |
| `--success` | `--state-success-fg` | `--state-success-bg` tint | Session renamed, message sent |
| `--warning` | `--state-warning-fg` | `--state-warning-bg` tint | Host reconnecting, plan upgrade |
| `--danger` | `--state-danger-fg` | `--state-danger-bg` tint | Failed to send, dispatch failed |
| `--loading` | `--text-muted` (spinner, no rule) | `--surface-overlay` | Connecting to host, downloading update |

The background tint is a 1 px inset `box-shadow` at 40 % opacity of the state
color rather than a filled background — this keeps the toast surface coherent
with `--surface-overlay` while adding a gentle semantic wash.

---

## Shapes (2)

| Modifier class | Layout | When to use |
|---|---|---|
| `--inline` (default) | Single horizontal row: icon · body · actions | Short confirmations (1 line of text) |
| `--stacked` | Vertical stack: title row · body row · action row | Longer messages needing title + CTA |

---

## Elements / Slots

### Leading icon (`__icon`)
Stand-in inline SVG in this HTML file. In React composition this slot receives
an `icon-glyph` atom. The `--loading` variant replaces the icon with a circular
`atom-spinner--circular`.

Icon sizes:
- `--inline` → 14 × 14 px (structural geometry — no token at this size)
- `--stacked` → 16 × 16 px

### Body text (`__body`)
Uses `.type-body-sm` typography. Max width is unconstrained — the toast container
sets `max-width: 400px` on desktop / `calc(var(--viewport-width) - var(--space-8))`
on mobile.

### Title (`__title`) — stacked only
Uses `.type-label` with `color: var(--text-body)` override (default `.type-label`
is `--text-muted`; the title needs higher contrast).

### Action button (`__action`)
Plain text link style: `color: var(--accent-primary)`, no border, no background.
Tap target padded to `var(--touch-target-min)` height on mobile.

### Dismiss button (`__dismiss`)
Icon-button ghost: `✕` glyph, `aria-label="Dismiss notification"`.
Always visible in `--stacked`. Hidden in `--inline` unless `--dismissible`
modifier is also present.

---

## States

| Class | Description |
|---|---|
| `default` (no class) | Fully visible, auto-dismiss timer running |
| `is-entering` | Slide up + fade in; transform `translateY(8px) → translateY(0)` + opacity `0 → 1` over `var(--motion-medium) var(--motion-ease-out)` |
| `is-exiting` | Fade out; opacity `1 → 0` over `var(--motion-medium) var(--motion-ease-out)` (no upward slide on exit) |
| `is-dismissed` | Element removed from DOM after exit animation completes |

Pause-on-hover: auto-dismiss timer pauses while the pointer is over the toast.
JavaScript sets `animation-play-state: paused` on the progress indicator and
clears the `setTimeout`. Required so keyboard users navigating to the action
button have time to interact (see Accessibility).

---

## Token recipe

| Property | Element / variant | Token |
|---|---|---|
| background | root | `var(--surface-overlay)` |
| box-shadow | root | `var(--elevation-overlay)` |
| border-radius | root | `var(--radius-default)` |
| border | root | `1px solid var(--border-default)` |
| padding (inline) | root | `var(--space-3) var(--space-3)` |
| padding (stacked) | root | `var(--space-3) var(--space-4)` |
| gap (inline row) | root | `var(--space-2)` |
| gap (stacked column) | `__content` | `var(--space-1)` |
| gap (actions row) | `__actions` | `var(--space-2)` |
| border-left width | `__rule` (structural) | `3px` (geometry literal — `var(--domain-tool-rule-width)`) |
| border-left color — info | `__rule` | `var(--accent-primary)` |
| border-left color — success | `__rule` | `var(--state-success-fg)` |
| border-left color — warning | `__rule` | `var(--state-warning-fg)` |
| border-left color — danger | `__rule` | `var(--state-danger-fg)` |
| border-left color — loading | `__rule` | `transparent` |
| icon color — info | `__icon` | `var(--accent-primary)` |
| icon color — success | `__icon` | `var(--state-success-fg)` |
| icon color — warning | `__icon` | `var(--state-warning-fg)` |
| icon color — danger | `__icon` | `var(--state-danger-fg)` |
| icon color — loading | `__icon` | `var(--text-muted)` |
| body text | `__body` | `.type-body-sm` → `var(--font-size-body-sm)`, `var(--font-weight-body)`, `var(--text-body)` |
| title text | `__title` | `.type-label` + `color: var(--text-body)` |
| action text color | `__action` | `var(--accent-primary)` |
| action font | `__action` | `var(--font-size-body-sm)`, `var(--font-weight-label)` |
| dismiss icon color | `__dismiss` | `var(--text-muted)` |
| max-width | root | `400px` desktop / `calc(var(--viewport-width) - var(--space-8))` mobile (structural) |
| transition | root | `opacity var(--motion-medium) var(--motion-ease-out), transform var(--motion-medium) var(--motion-ease-out)` |
| is-entering transform | root | `translateY(8px)` → `translateY(0)` |
| is-exiting opacity | root | `0` |

---

## Accessibility

### Live region
The toast container element carries `role="status" aria-live="polite"` for
`--info`, `--success`, and `--warning` variants. The `--danger` variant uses
`role="alert" aria-live="assertive"` so screen readers interrupt immediately for
error conditions.

### Color is never the only signal
Status is communicated by both the semantic left rule color AND a distinct SVG
icon per variant (info circle, check circle, triangle warning, X circle, spinner).
Never rely on color alone.

### Pause on hover
A JavaScript `mouseenter` / `mouseleave` handler pauses the auto-dismiss timer
so keyboard users who tab into the action button have time to activate it before
the toast disappears.

### Dismiss button
`<button class="atom-toast-base__dismiss" aria-label="Dismiss notification">`
— explicit label required; the `✕` glyph is `aria-hidden="true"`.

### Focus management
When a toast with an action button appears, focus is NOT moved to the toast
automatically (this would disrupt the user's current flow). If the user tabs to
the toast region and activates the action or dismiss button, focus returns to the
previously focused element.

### Touch targets
All interactive elements (`__action`, `__dismiss`) meet `var(--touch-target-min)`
(44 px) tap target on mobile via `min-height` + negative margin trick or
`padding` expansion.
