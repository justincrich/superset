# atom · icon-button

Square tappable button containing a single icon with no text label. Mobile-tuned: `var(--touch-target-min)` (44px) minimum hit target at the default `md` size.

Sibling of `atom-button`. Inherits all variant semantics and state logic but replaces padding/text with a fixed square geometry and an icon child.

---

## Anatomy

```
.atom-icon-button                      ← <button> root; square hit target
  └── .atom-icon-button__icon          ← inline <svg>; sized by size class
        └── <path> / <circle> etc.     ← lucide path data; stroke="currentColor"
```

The button controls all geometry (width, height, border-radius, background, color). The icon child is sized via explicit width/height on `.atom-icon-button__icon` and inherits `currentColor` for its stroke.

---

## Variants

| Class | Background | Icon color | Use case |
|---|---|---|---|
| `atom-icon-button--ghost` (default) | `transparent` | `--text-body` | Toolbar buttons: back-arrow, more-vertical, search |
| `atom-icon-button--soft` | `--surface-soft` | `--text-body` | Subtle compact utility buttons |
| `atom-icon-button--primary` | `--accent-primary` | `--accent-primary-fg` | Send button, primary FAB-adjacent |
| `atom-icon-button--neutral` | `--surface-inverse` | `--text-on-inverse` | High-contrast neutral icon button |
| `atom-icon-button--destructive` | `--state-danger-fg` | `--accent-primary-fg` | Delete / decline actions |

---

## Sizes

| Class | Container | Icon | Use case |
|---|---|---|---|
| `atom-icon-button--xs` | 28 × 28 | 14px | Dense toolbar |
| `atom-icon-button--sm` | 36 × 36 | 16px | Regular toolbar |
| `atom-icon-button--md` (default) | `var(--touch-target-min)` = 44px | 20px | Mobile standard; WCAG AA minimum |
| `atom-icon-button--lg` | 56 × 56 | 24px | FAB-adjacent, hero actions |

`md` deliberately uses `var(--touch-target-min)` rather than a hardcoded `44px` literal so the value is inherited from the token if the device token changes. Size literals `28`, `36`, `56` are permitted per spec for the non-default sizes.

---

## Shape modifiers

| Class | border-radius | Use case |
|---|---|---|
| (none — default) | `var(--radius-default)` | Rounded square; standard toolbar |
| `atom-icon-button--pill` | `var(--radius-pill)` | Fully round; FAB-like send button |

---

## States

All states are available via both CSS pseudo-classes and `is-*` sticky-state classes for deterministic preview rendering.

| State | Class | Notes |
|---|---|---|
| Default | — | Base variant styles apply |
| Hover | `:hover` / `.is-hover` | Lightened background |
| Active | `:active` / `.is-active` | Darker background + `scale(0.95)` |
| Focus | `:focus-visible` / `.is-focus` | `box-shadow: 0 0 0 3px var(--border-focus)` |
| Disabled | `:disabled` / `.is-disabled` | `opacity: 0.5`; `pointer-events: none` |
| Loading | `.is-loading` + `aria-busy="true"` | Icon hidden via `opacity: 0`; CSS `::after` spinner at `var(--space-4)` size; `pointer-events: none` |

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `background-color` (ghost) | `transparent` → `--surface-soft` → `--surface-active` | default/hover/active |
| `background-color` (soft) | `--surface-soft` → `--surface-active` | |
| `background-color` (primary) | `--accent-primary` → `--accent-primary-hover` → `--accent-primary-pressed` | |
| `background-color` (neutral) | `--surface-inverse` → `color-mix(…85%)` → `color-mix(…70%)` | |
| `background-color` (destructive) | `--state-danger-fg` → `color-mix(…85% black)` → `color-mix(…70% black)` | |
| `color` (ghost, soft) | `--text-body` | |
| `color` (primary) | `--accent-primary-fg` | |
| `color` (neutral) | `--text-on-inverse` | |
| `color` (destructive) | `--accent-primary-fg` | |
| `border-radius` (default) | `--radius-default` | ≈ 8px |
| `border-radius` (pill) | `--radius-pill` | 999px |
| `box-shadow` (focus) | `0 0 0 3px var(--border-focus)` | identical to `atom-button` |
| `transition` | `--motion-fast` + `--motion-ease-out` | bg, color, box-shadow, opacity, transform |
| spinner size | `--space-4` (16px) | `::after` pseudo-element |
| spinner animation | `--motion-slow` linear infinite | |
| width/height (md) | `--touch-target-min` | WCAG AA + iOS HIG |

---

## Accessibility

Every `atom-icon-button` MUST carry an `aria-label` describing the action. The icon alone conveys no meaning to assistive technology.

```html
<!-- Required — action description, not icon name -->
<button class="atom-icon-button atom-icon-button--primary atom-icon-button--md atom-icon-button--pill"
        aria-label="Send message">
  <svg class="atom-icon-button__icon" aria-hidden="true" ...>...</svg>
</button>
```

Good `aria-label` values:

| Icon | Label |
|---|---|
| send | "Send message" |
| more-vertical | "Open menu" |
| arrow-left | "Back to sessions" |
| search | "Search" |
| plus | "New chat" |
| trash | "Delete session" |
| x | "Close" |
| paperclip | "Attach file" |
| sparkles | "AI suggestions" |
| brain | "Context settings" |

Additional accessibility requirements:

- **Loading state**: add `aria-busy="true"` to the button element.
- **Disabled state**: add `aria-disabled="true"` when using `.is-disabled`; or use the native `disabled` attribute.
- **Focus ring**: `box-shadow: 0 0 0 3px var(--border-focus)` — identical to `atom-button`. Never suppress `:focus-visible`.
- The `<svg>` child must carry `aria-hidden="true"` since the button's `aria-label` describes the action.
- Do NOT nest meaningful text inside the button alongside the icon; this is an icon-only component.

---

## Usage examples

```html
<!-- Ghost toolbar button — back navigation -->
<button class="atom-icon-button atom-icon-button--ghost atom-icon-button--lg"
        aria-label="Back to sessions">
  <svg class="atom-icon-button__icon" aria-hidden="true"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/>
  </svg>
</button>

<!-- Primary send button — pill shape, composer footer -->
<button class="atom-icon-button atom-icon-button--primary atom-icon-button--md atom-icon-button--pill"
        aria-label="Send message">
  <svg class="atom-icon-button__icon" aria-hidden="true"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-linecap="round" stroke-linejoin="round">
    <path d="M22 2 11 13"/><path d="M22 2 15 22 11 13 2 9z"/>
  </svg>
</button>

<!-- Destructive session delete -->
<button class="atom-icon-button atom-icon-button--destructive atom-icon-button--sm"
        aria-label="Delete session">
  <svg class="atom-icon-button__icon" aria-hidden="true"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-linecap="round" stroke-linejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
  </svg>
</button>

<!-- Loading state -->
<button class="atom-icon-button atom-icon-button--primary atom-icon-button--md is-loading"
        aria-label="Send message" aria-busy="true">
  <svg class="atom-icon-button__icon" aria-hidden="true" ...>...</svg>
</button>
```
