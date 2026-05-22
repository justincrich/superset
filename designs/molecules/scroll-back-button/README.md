# mol-scroll-back-button

A floating circular button that appears when the user scrolls up in the chat thread, away from the latest message. Tapping it snaps the thread back to the bottom. Optionally carries a small accent dot badge to signal that new messages have arrived while the user was scrolled up.

UC-RENDER-07: FadeIn / FadeOut animation over `var(--motion-fast)`. 44 pt minimum hit target (met by the 56 px fab-base--md diameter). Hidden via `opacity: 0; pointer-events: none` when already at the bottom.

---

## Anatomy

```html
<!-- Idle variant (bare chevron, no badge) -->
<button
  class="mol-scroll-back-button mol-scroll-back-button--idle
         atom-fab-base atom-fab-base--overlay atom-fab-base--md"
  aria-label="Scroll to latest message"
  type="button"
>
  <svg
    class="atom-icon-glyph atom-icon-glyph--md mol-scroll-back-button__icon"
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
</button>

<!-- New-messages variant (accent dot badge at top-right) -->
<button
  class="mol-scroll-back-button mol-scroll-back-button--new-messages
         atom-fab-base atom-fab-base--overlay atom-fab-base--md"
  aria-label="3 new messages, scroll to latest"
  type="button"
>
  <svg
    class="atom-icon-glyph atom-icon-glyph--md mol-scroll-back-button__icon"
    aria-hidden="true"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <polyline points="6 9 12 15 18 9"/>
  </svg>
  <span
    class="atom-badge atom-badge--accent atom-badge--dot mol-scroll-back-button__indicator"
    aria-hidden="true"
  ></span>
</button>
```

---

## Variants

| Modifier class | Effect |
|---|---|
| `mol-scroll-back-button--idle` (default) | Bare chevron, no badge. Used when user is scrolled up but no new messages have arrived. |
| `mol-scroll-back-button--new-messages` | Shows `__indicator` (accent dot badge) at top-right corner of the button. Used when new messages arrive while user is scrolled up. |

---

## States

| Class / Condition | Visual effect |
|---|---|
| default (no modifier) | Visible at `opacity: 1`, interactive |
| `is-hidden` | `opacity: 0; pointer-events: none` — rendered but invisible and non-interactive when user is at the bottom of the thread. Also receives `aria-hidden="true"` and `inert` to remove from keyboard and AT tree. |
| `is-entering` | Fade in over `var(--motion-fast)` `var(--motion-ease-out)` — matches UC-RENDER-07 |
| `is-exiting` | Fade out reverse over `var(--motion-fast)` — matches UC-RENDER-07 |
| `is-hover` | Inherited from `atom-fab-base--overlay` — `background-color: var(--surface-active); scale(1.05)` |
| `is-active` | Inherited from `atom-fab-base--overlay` — `background-color: var(--surface-active); scale(0.97)` |
| `is-focus` | Inherited from `atom-fab-base--overlay` — double-ring focus indicator |

The `is-entering` / `is-exiting` states are managed by product JS — this file demonstrates them statically via the CSS transition.

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-fab-base` | `atom-fab-base--overlay atom-fab-base--md` | 56 px circular button with `var(--surface-overlay)` fill, `var(--border-default)` stroke, `var(--elevation-modal)` shadow, and motion transitions |
| `atom-icon-glyph` | `atom-icon-glyph--md` | 20 × 20 px chevron-down icon at `currentColor` (inherits `var(--text-body)` from overlay variant) |
| `atom-badge` | `atom-badge--accent atom-badge--dot` | 8 × 8 px accent-colored dot; `aria-hidden="true"` — purely visual indicator; count communicated via button `aria-label` |

---

## Token recipe

| Property | Token |
|---|---|
| Button fill | `var(--surface-overlay)` (via `atom-fab-base--overlay`) |
| Button border | `1px solid var(--border-default)` (via `atom-fab-base--overlay`) |
| Button shadow | `var(--elevation-modal)` (via `atom-fab-base`) |
| Icon color | `var(--text-body)` (inherited from overlay variant) |
| Badge fill | `var(--accent-primary)` (via `atom-badge--accent`) |
| Position right | `var(--space-4)` |
| Position bottom | `calc(var(--composer-min-height) + var(--space-4))` — floats above the composer bar |
| Opacity transition | `var(--motion-fast)` `var(--motion-ease-out)` |
| z-index | `10` — above chat thread content, below modal overlays |
| Indicator top | `2px` (structural geometry — sub-token badge offset, same exception class as `atom-device-bezel__battery-body` nub) |
| Indicator right | `2px` (same as above) |

**TOKEN_GAP**: The `2px` top/right offsets on `__indicator` are below the token scale floor (`--space-1: 4px`). Justified as structural badge-corner geometry consistent with peer badge-offset exceptions across the codebase.

---

## Accessibility

- Root element is a `<button>` (native interactive role, keyboard activatable).
- **Idle variant**: `aria-label="Scroll to latest message"`.
- **New-messages variant**: `aria-label="N new messages, scroll to latest"` — count is communicated in the label; the visible dot is `aria-hidden="true"`.
- When `is-hidden`: set `aria-hidden="true"` on the button element and add the `inert` attribute so it is removed from keyboard tab order and the accessibility tree entirely.
- The chevron SVG always carries `aria-hidden="true"`.
- Reduced motion: the `is-entering`/`is-exiting` transition is suppressed by the `prefers-reduced-motion` media query; the button appears/disappears immediately.

---

## Positioning context

The molecule is `position: absolute` and expects its nearest `position: relative` or `position: absolute` ancestor to be the chat thread viewport container (the same element that holds the scrollable message list and the composer bar). The bottom offset `calc(var(--composer-min-height) + var(--space-4))` ensures it never overlaps the composer input bar.
