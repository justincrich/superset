# mol-pending-action-pill

A floating pill that surfaces above the composer input when a session has an active pause (tool-approval, ask_user question, or plan review) **and** the user has scrolled away from the relevant inline card, or dismissed a sheet/modal without responding. Tapping it scrolls back to the inline card or re-opens the relevant sheet/modal.

Reanimated `FadeIn` enter (opacity 0 → 1, translateY 8px → 0) and `FadeOut` exit (reverse). Positioned absolutely at bottom-right above the composer bar.

UC-PAUSE-04 §A.

---

## Anatomy

```html
<!-- Approval variant (default) — scrolls to inline approval card -->
<button
  class="mol-pending-action-pill mol-pending-action-pill--approval
         atom-pill atom-pill--warning atom-pill--md"
  aria-label="1 pending approval — tap to view"
  type="button"
>
  <svg
    class="atom-icon-glyph atom-icon-glyph--xs mol-pending-action-pill__icon"
    aria-hidden="true"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- radio / target glyph (⌖) -->
    <circle cx="6" cy="6" r="4"/>
    <circle cx="6" cy="6" r="1" fill="currentColor" stroke="none"/>
    <line x1="6" y1="1" x2="6" y2="3"/>
    <line x1="6" y1="9" x2="6" y2="11"/>
    <line x1="1" y1="6" x2="3" y2="6"/>
    <line x1="9" y1="6" x2="11" y2="6"/>
  </svg>
  <span class="atom-section-label atom-section-label--strong mol-pending-action-pill__count">
    1 PENDING
  </span>
  <svg
    class="atom-icon-glyph atom-icon-glyph--xs mol-pending-action-pill__direction"
    aria-hidden="true"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- arrow-down -->
    <line x1="6" y1="1" x2="6" y2="11"/>
    <polyline points="2,7 6,11 10,7"/>
  </svg>
</button>
```

---

## Variants

| Modifier class | Leading icon | Label pattern | Direction arrow | Use case |
|---|---|---|---|---|
| `mol-pending-action-pill--approval` (default) | `radio` (⌖) | "1 PENDING" | ↓ (scroll down to inline card) | Tool approval — scrolls back to inline approval card |
| `mol-pending-action-pill--question` | `alert-triangle` | "QUESTION" | ↑ (scroll up / re-open sheet) | ask_user — re-opens answer sheet |
| `mol-pending-action-pill--plan` | `sparkles` | "PLAN" | ↑ (re-push modal) | Plan review — re-pushes plan modal |

The direction arrow is omitted (remove `__direction` svg) when there is no directional affordance needed.

---

## States

| Class / Condition | Visual effect |
|---|---|
| default (visible) | Opacity 1, `animation: mol-pending-action-pill-enter` runs on mount |
| `is-entering` | FadeIn: opacity 0 → 1, translateY(8px) → translateY(0) over `var(--motion-medium)` `var(--motion-ease-out)` |
| `is-exiting` | FadeOut reverse: opacity 1 → 0, translateY(0) → translateY(8px), `forwards` fill, over `var(--motion-medium)` |
| `is-hover` | Inherited from `atom-pill--warning` — slight amber bg darkening |
| `is-active` | Inherited from `atom-pill` — translateY(1px) press-down |
| `is-focus` | Inherited from `atom-pill` — 2px focus ring via `var(--border-focus)` |

The `is-entering` / `is-exiting` states are managed by product JS (Reanimated in RN; CSS class toggle in web). This preview demonstrates them statically.

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-pill` | `atom-pill--warning atom-pill--md` | Base pill shape: amber `var(--state-warning-bg)` fill, `var(--radius-pill)`, `height: 28px`, `padding-inline: var(--space-3)`, `gap: var(--space-2)`, transitions |
| `atom-icon-glyph` | `atom-icon-glyph--xs` (×2) | 12 × 12 px leading status glyph and trailing direction arrow; color driven by `mol-pending-action-pill__icon` / `__direction` to `var(--state-warning-fg)` |
| `atom-section-label` | `atom-section-label--strong` | Mono uppercase count/label text; color overridden to `var(--state-warning-fg)` via `mol-pending-action-pill__count` |

---

## Token recipe

| Property | Token |
|---|---|
| Pill background | `var(--state-warning-bg)` (via `atom-pill--warning`) |
| Text / icon color | `var(--state-warning-fg)` (molecule layer sets `__icon`, `__direction`, `__count`) |
| Pill shape | `var(--radius-pill)` (via `atom-pill`) |
| Gap between children | `var(--space-2)` (via `atom-pill--md`) |
| Padding inline | `var(--space-3)` (via `atom-pill--md`) |
| Elevation / shadow | `var(--elevation-overlay)` (molecule layer) |
| Position bottom | `calc(var(--composer-min-height) + var(--space-3))` |
| Position right | `var(--space-4)` |
| z-index | `15` — above chat thread content and scroll-back button (z:10), below modal overlays |
| Enter animation duration | `var(--motion-medium)` `var(--motion-ease-out)` |
| Exit animation duration | `var(--motion-medium)` `var(--motion-ease-out)` |
| Enter translateY | `8px` — structural geometry (sub-token motion offset; TOKEN_GAP documented below) |

**TOKEN_GAP**: The `8px` translateY in enter/exit keyframes is below the token-scale floor (nearest is `--space-2: 8px` — actually aligns if `--space-2` resolves to 8px; if the token scale is 4px base, `--space-2 = 8px` covers it). If the token scale resolves differently, this is a structural motion-offset exception consistent with peer floating-element enter animations in the system.

---

## Accessibility

- Root element is a `<button>` (native interactive role, keyboard activatable via Enter/Space).
- **Approval variant**: `aria-label="1 pending approval — tap to view"`.
- **Question variant**: `aria-label="Question pending — tap to answer"`.
- **Plan variant**: `aria-label="Plan pending review — tap to view"`.
- The leading and trailing SVG icons carry `aria-hidden="true"` — status and direction are conveyed via the `aria-label` text.
- The `atom-section-label` count text is visible text (not aria-only); it reinforces the label for sighted users.
- Reduced motion: both `is-entering` and `is-exiting` animations are suppressed via `prefers-reduced-motion: reduce`. The pill still appears/disappears and retains full amber warning color. No animation, but the affordance (color, shadow, text) remains.

---

## Positioning context

The molecule is `position: absolute` and expects its nearest positioned ancestor to be the chat thread viewport container (same as `mol-scroll-back-button`). The `z-index: 15` ensures it floats above the scroll-back button (`z-index: 10`) but below any modal overlays.
