# mol-applied-filter-tag

A dismissible chip representing an active filter in the filter-tag row beneath the search bar. Multiple tags appear in a horizontal-scroll list (`role="list"`); each tag is a `role="listitem"`. Each carries a leading semantic icon, a truncating text label, and a tappable ✕ dismiss button. UC-NAV-08 §C.

---

## Anatomy

### Workspace tag (default)

```html
<div
  class="mol-applied-filter-tag mol-applied-filter-tag--workspace
         atom-pill atom-pill--default atom-pill--sm"
  role="listitem"
>
  <svg
    class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted
           mol-applied-filter-tag__leading-icon"
    aria-hidden="true"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- git-branch -->
    <circle cx="3" cy="3" r="1.25"/>
    <circle cx="3" cy="9" r="1.25"/>
    <circle cx="9" cy="3" r="1.25"/>
    <line x1="3" y1="4.25" x2="3" y2="7.75"/>
    <path d="M9 4.25C9 7 6.5 7.5 3 7.75"/>
  </svg>
  <span class="mol-applied-filter-tag__label">chat-mobile-plan · macbook</span>
  <button
    class="mol-applied-filter-tag__dismiss"
    aria-label="Remove workspace filter: chat-mobile-plan · macbook"
    type="button"
  >
    <svg
      class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted"
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <line x1="3" y1="3" x2="9" y2="9"/>
      <line x1="9" y1="3" x2="3" y2="9"/>
    </svg>
  </button>
</div>
```

### Status-live tag

```html
<div
  class="mol-applied-filter-tag mol-applied-filter-tag--status-live
         atom-pill atom-pill--live atom-pill--sm"
  role="listitem"
>
  <svg
    class="atom-icon-glyph atom-icon-glyph--xs mol-applied-filter-tag__leading-icon"
    aria-hidden="true"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- radio / target (⌖) -->
    <circle cx="6" cy="6" r="4"/>
    <circle cx="6" cy="6" r="1" fill="currentColor" stroke="none"/>
    <line x1="6" y1="1" x2="6" y2="3"/>
    <line x1="6" y1="9" x2="6" y2="11"/>
    <line x1="1" y1="6" x2="3" y2="6"/>
    <line x1="9" y1="6" x2="11" y2="6"/>
  </svg>
  <span class="mol-applied-filter-tag__label">Streaming</span>
  <button
    class="mol-applied-filter-tag__dismiss"
    aria-label="Remove status filter: Streaming"
    type="button"
  >
    <svg
      class="atom-icon-glyph atom-icon-glyph--xs"
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <line x1="3" y1="3" x2="9" y2="9"/>
      <line x1="9" y1="3" x2="3" y2="9"/>
    </svg>
  </button>
</div>
```

### Status-warning tag

```html
<div
  class="mol-applied-filter-tag mol-applied-filter-tag--status-warning
         atom-pill atom-pill--warning atom-pill--sm"
  role="listitem"
>
  <svg
    class="atom-icon-glyph atom-icon-glyph--xs mol-applied-filter-tag__leading-icon"
    aria-hidden="true"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <!-- alert-triangle -->
    <path d="M6 1.5L11 10H1L6 1.5z"/>
    <line x1="6" y1="5" x2="6" y2="7.5"/>
    <circle cx="6" cy="9" r="0.5" fill="currentColor" stroke="none"/>
  </svg>
  <span class="mol-applied-filter-tag__label">Pause pending</span>
  <button
    class="mol-applied-filter-tag__dismiss"
    aria-label="Remove status filter: Pause pending"
    type="button"
  >
    <svg
      class="atom-icon-glyph atom-icon-glyph--xs"
      aria-hidden="true"
      viewBox="0 0 12 12"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
    >
      <line x1="3" y1="3" x2="9" y2="9"/>
      <line x1="9" y1="3" x2="3" y2="9"/>
    </svg>
  </button>
</div>
```

### Clear-all CTA

```html
<button
  class="mol-applied-filter-tag mol-applied-filter-tag--clear-all
         atom-pill atom-pill--default atom-pill--sm"
  aria-label="Clear all filters"
  type="button"
>
  <span class="mol-applied-filter-tag__label">Clear</span>
  <svg
    class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted"
    aria-hidden="true"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
  >
    <line x1="3" y1="3" x2="9" y2="9"/>
    <line x1="9" y1="3" x2="3" y2="9"/>
  </svg>
</button>
```

### Filter-tag row (list wrapper)

```html
<div
  class="mol-applied-filter-tag-row"
  role="list"
  aria-label="Active filters"
>
  <!-- workspace tag -->
  <!-- status tags -->
  <!-- clear-all button -->
</div>
```

---

## Variants

| Modifier class | Leading icon | Pill base | Bg token | Use case |
|---|---|---|---|---|
| `mol-applied-filter-tag--workspace` (default) | `git-branch` | `atom-pill--default` | `var(--surface-soft)` | Branch + host pair — "chat-mobile-plan · macbook" |
| `mol-applied-filter-tag--status-live` | `radio` (target/⌖) | `atom-pill--live` | `var(--state-live-bg)` | Active-streaming filter |
| `mol-applied-filter-tag--status-warning` | `alert-triangle` | `atom-pill--warning` | `var(--state-warning-bg)` | Pause-pending filter |
| `mol-applied-filter-tag--clear-all` | none (trailing ✕ only) | `atom-pill--default` | `var(--surface-soft)` | Remove all active filters |

---

## States

| Class | Visual effect |
|---|---|
| default | Resting — background from pill variant, full opacity |
| `is-hover` | Background darkens via `atom-pill--default.is-hover` → `var(--surface-active)` (or live/warning equivalent) |
| `is-active` | `atom-pill.is-active` — `translateY(1px)` press micro-animation |
| `is-focus` | `atom-pill.is-focus` — `box-shadow: 0 0 0 2px var(--border-focus)` ring |
| `is-removing` | `opacity: 0`, `transform: scale(0.9)`, animated via `var(--motion-fast) var(--motion-ease-out)` on both `opacity` and `transform` — fires when the tag is removed from the list |

The `is-removing` state is applied by product JS/Reanimated immediately before unmounting the element; the transition completes then the element is removed from DOM.

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-pill` | `atom-pill--default atom-pill--sm` / `atom-pill--live atom-pill--sm` / `atom-pill--warning atom-pill--sm` | Base chip shape: `height: 20px`, `padding-inline: var(--space-2)`, `border-radius: var(--radius-pill)`, variant background + color, hover/active/focus transitions |
| `atom-icon-glyph` | `atom-icon-glyph--xs atom-icon-glyph--muted` (leading, workspace) | 12 × 12 px leading semantic icon (`git-branch`, `radio`, `alert-triangle`); color from muted modifier or currentColor (status variants) |
| `atom-icon-glyph` | `atom-icon-glyph--xs` (trailing ✕) | 12 × 12 px dismiss ✕ in dismiss button and in clear-all trailing slot |
| `atom-hit-target-wrapper` | Not applied directly — dismiss button uses `mol-applied-filter-tag__dismiss` which provides inline-flex sizing. The `::before` pseudo on `atom-pill__dismiss` pattern is replicated in `__dismiss` for touch expansion | Ensures ✕ dismiss button meets 44 pt tap-zone minimum |

> Note: the `__dismiss` button borrows the expand-via-pseudo pattern from `atom-pill__dismiss` (inset pseudo-element expands tap zone to `var(--touch-target-min)` without affecting layout). `atom-hit-target-wrapper` is not wrapped around the dismiss button in this molecule because it would alter the inline-flex flow — instead the pseudo-element approach from the pill atom is the correct mechanism here.

---

## Token recipe

| Property | Token |
|---|---|
| Chip height | `20px` structural — via `atom-pill--sm` |
| Chip padding | `var(--space-2)` inline — via `atom-pill--sm` |
| Chip gap (children) | `var(--space-1)` — via `atom-pill--sm` |
| Chip border-radius | `var(--radius-pill)` — via `atom-pill` |
| Workspace bg | `var(--surface-soft)` via `atom-pill--default` |
| Live-status bg | `var(--state-live-bg)` via `atom-pill--live` |
| Warning-status bg | `var(--state-warning-bg)` via `atom-pill--warning` |
| Leading icon color (workspace) | `var(--text-muted)` via `atom-icon-glyph--muted` |
| Leading icon color (status variants) | `currentColor` (inherits from pill variant fg) |
| Trailing ✕ color (workspace/clear-all) | `var(--text-muted)` via `atom-icon-glyph--muted` |
| Trailing ✕ color (status variants) | `currentColor` |
| Label max-width | `16em` (soft cap via `max-width` on `.mol-applied-filter-tag`) |
| Label overflow | `text-overflow: ellipsis` on `__label` |
| Dismiss button bg (hover) | `var(--surface-active)` |
| Dismiss button padding | `var(--space-1)` |
| Dismiss button border-radius | `var(--radius-round)` |
| Removing opacity | `0` — `transition: opacity var(--motion-fast) var(--motion-ease-out)` |
| Removing scale | `scale(0.9)` — `transition: transform var(--motion-fast) var(--motion-ease-out)` |
| Row gap (tags in row) | `var(--space-2)` |
| Row overflow | `overflow-x: auto` with scroll-snap and `-webkit-overflow-scrolling: touch` |

**TOKEN_GAP**: none. All values map to design tokens or structural geometry (`20px` chip height is `atom-pill--sm` spec; `16em` max-width is a layout bound not in the token scale — documented here as structural).

---

## Accessibility

- The filter-tag row container is `role="list"` with `aria-label="Active filters"`.
- Each workspace and status tag is `role="listitem"` (a non-interactive `div` — the interactive target is only the dismiss `<button>` inside it).
- Each dismiss `<button>` carries `aria-label="Remove <filter description>"` — e.g. `"Remove workspace filter: chat-mobile-plan · macbook"`.
- The clear-all button is a `<button>` (not a `div`) so it is keyboard and screen-reader activatable with no further ARIA. Its `aria-label="Clear all filters"` provides a complete accessible name.
- Status variants (`--status-live`, `--status-warning`) use **both** a leading icon **and** a visible text label — color alone never communicates the state, satisfying WCAG 1.4.1 Use of Color.
- All SVG icons carry `aria-hidden="true"` — semantic meaning is carried by label text and button accessible names only.
- `is-removing` collapse animation respects `prefers-reduced-motion: reduce` — the transition is set to `none` inside the media query; the element is removed from DOM immediately without visual animation.
