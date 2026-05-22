# mol-modal-header

Modal-specific header for full-screen modal presentations (plan review, settings sub-screens). Composes a leading close button, centred or left-aligned title, and an optional trailing action slot. Distinct from `mol-app-header` — modals own their own chrome and dismiss rather than navigate back.

Per UC-PAUSE-03 §A wireframe layout: `✕   Review Plan`

---

## Purpose

- Provides consistent chrome for full-screen modal sheets
- Leading close `✕` dismisses the modal (never navigates back — modals are not navigation stack destinations)
- Title is centred by default, balanced by an invisible spacer that mirrors the close button width
- Optional trailing action slot (e.g. Save, Share) replaces the spacer when needed
- `is-scrolled` state adds a subtle shadow when the modal body scrolls beneath the header
- Sticky-positioned at `top: 0` so the close affordance is always reachable during long-form scroll

---

## Anatomy

### Default (close + centred title)

```html
<header class="mol-modal-header mol-modal-header--default">
  <button
    class="atom-icon-button atom-icon-button--ghost atom-icon-button--md mol-modal-header__close"
    aria-label="Close plan review"
  >
    <svg class="atom-icon-glyph atom-icon-glyph--md" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
  <h2 class="mol-modal-header__title type-title">Review Plan</h2>
  <span class="mol-modal-header__spacer" aria-hidden="true"></span>
</header>
```

### With trailing action

```html
<header class="mol-modal-header mol-modal-header--with-action">
  <button
    class="atom-icon-button atom-icon-button--ghost atom-icon-button--md mol-modal-header__close"
    aria-label="Close settings"
  >
    <svg class="atom-icon-glyph atom-icon-glyph--md" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
  <h2 class="mol-modal-header__title type-title">Settings</h2>
  <button
    class="atom-button atom-button--ghost atom-button--sm mol-modal-header__action"
    aria-label="Save settings"
  >Save</button>
</header>
```

### Simple (close + left-aligned title, no spacer)

```html
<header class="mol-modal-header mol-modal-header--simple">
  <button
    class="atom-icon-button atom-icon-button--ghost atom-icon-button--md mol-modal-header__close"
    aria-label="Close filter sessions"
  >
    <svg class="atom-icon-glyph atom-icon-glyph--md" viewBox="0 0 24 24" fill="none"
         stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </button>
  <h2 class="mol-modal-header__title type-title">Filter sessions</h2>
</header>
```

---

## Variants

| Class modifier | Layout |
|---|---|
| `mol-modal-header--default` | Close + centred title + invisible spacer for optical balance |
| `mol-modal-header--with-action` | Close + centred title + trailing action button (`atom-button --ghost --sm`) |
| `mol-modal-header--simple` | Close + left-aligned title (no spacer — minimal modal style) |

---

## States

| Class | Visual effect |
|---|---|
| `default` | `background: var(--surface-page)`, `border-bottom: 1px solid var(--border-subtle)` |
| `is-scrolled` | Additional `box-shadow: 0 1px 0 var(--border-subtle)` — subtle depth layer when modal body scrolls |

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-icon-button` | `--ghost --md` | Leading close affordance — 44px tap target |
| `atom-icon-glyph` | `--md` | X close icon (20×20, stroke-width 2) |
| `.type-title` | on `<h2>` | Modal title typography — component-title scale |
| `atom-button` | `--ghost --sm` | Trailing action in `--with-action` variant only |

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `display` | — | `flex` |
| `align-items` | — | `center` |
| `gap` | `var(--space-2)` | 8px between flex children |
| `padding` | `var(--space-2) var(--space-3)` | 8px block, 12px inline |
| `min-height` | `var(--touch-target-min)` | 44px — iOS HIG minimum |
| `background` | `var(--surface-page)` | Matches modal sheet background |
| `border-bottom` | `1px solid var(--border-subtle)` | `1px` is structural geometry |
| `position` | — | `sticky`, `top: 0` |
| `z-index` | — | `20` — above modal body scroll content |
| `__title` `flex` | — | `1` — title fills remaining width |
| `__title` text-align | — | `center` (default/with-action); `left` (simple) |
| `__close` width | `var(--touch-target-min)` | Fixed width mirrors spacer for centering balance |
| `__spacer` width | `var(--touch-target-min)` | Invisible balance element matching close button |
| `is-scrolled` shadow | `0 1px 0 var(--border-subtle)` | Structural: 1px layered shadow — TOKEN_GAP |
| Transition (none) | — | No transition on header itself — children handle their own |

**TOKEN_GAP**: `box-shadow: 0 1px 0 var(--border-subtle)` in `is-scrolled` uses `1px` structural geometry for a hairline shadow layer, consistent with `atom-divider` and `mol-app-header` scroll-shadow convention.

---

## Accessibility

- `<h2>` is the correct heading level for modal titles. The parent route's `<h1>` (page title) remains in the DOM beneath the modal overlay — the modal title is a subordinate heading within the modal's document fragment.
- `aria-label` on the close button must include the modal name: `"Close <modal name>"` (e.g. `"Close plan review"`, not just `"Close"`). This ensures screen reader users understand which modal they are dismissing when focus context is ambiguous.
- The `__spacer` is `aria-hidden="true"` — it is a presentational balance element with no semantic meaning.
- Sticky positioning preserves logical DOM order: the close button comes first in tab order, then the title (read-only), then any trailing action. This matches the visual reading order.
- The `is-scrolled` state is a visual-only enhancement driven by a scroll listener on the modal body — it has no semantic impact and no ARIA state change is required.
- Close button uses `atom-icon-button--ghost` variant which provides `:focus-visible` ring via `box-shadow: 0 0 0 3px var(--border-focus)`.
