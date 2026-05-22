# mol-app-header

The top navigation header used on every chat view. Provides a three-region flex layout — leading back button, centered title block, trailing actions button — sitting immediately below the iOS status bar inside the device viewport.

Corresponds to the `← Sessions   Fix auth bug    ···` pattern from UC-RENDER-01 §A and UC-SESS-04 §A wireframes.

---

## Purpose

- Orients the user within the app hierarchy (back navigation) and within a session (title + subtitle)
- Provides the primary entry point for per-session actions (trailing `···` button)
- Applies visual layering signal (`is-scrolled`) when content scrolls behind the header

---

## Anatomy

```html
<header class="mol-app-header mol-app-header--default">

  <!-- Leading: back-arrow ghost md icon-button -->
  <button
    class="atom-icon-button atom-icon-button--ghost atom-icon-button--md mol-app-header__back"
    aria-label="Back to sessions"
  >
    <svg class="atom-icon-glyph atom-icon-glyph--md" aria-hidden="true">…arrow-left…</svg>
  </button>

  <!-- Center: title + optional subtitle -->
  <div class="mol-app-header__title-wrap">
    <h1 class="mol-app-header__title type-title">Fix auth bug</h1>
    <p class="mol-app-header__subtitle type-meta">superset · main</p>
  </div>

  <!-- Trailing: actions ghost md icon-button -->
  <button
    class="atom-icon-button atom-icon-button--ghost atom-icon-button--md mol-app-header__actions"
    aria-label="Session actions"
  >
    <svg class="atom-icon-glyph atom-icon-glyph--md" aria-hidden="true">…more-vertical…</svg>
  </button>

</header>
```

For `mol-app-header--simple` the subtitle `<p>` and the trailing actions `<button>` are omitted entirely.

For `mol-app-header--no-back` the leading `<button>` is omitted and the title-wrap aligns left.

---

## Variants

| Class modifier | Layout | Use case |
|---|---|---|
| `mol-app-header--default` (base) | Back + centered title/subtitle + actions | Standard chat view |
| `mol-app-header--no-back` | (no back) + left-aligned title + actions | Top-level views (sessions list) |
| `mol-app-header--simple` | Back + centered title only (no subtitle, no actions) | Plan-review modal-adjacent, lightweight contexts |

---

## States

| Class | Effect |
|---|---|
| `default` | `var(--surface-page)` background, `var(--border-subtle)` bottom border |
| `is-scrolled` | Adds `box-shadow: 0 1px 0 var(--border-subtle)` for visual layering above scrolling content |

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-icon-button` | `--ghost --md` | Leading back-arrow button |
| `atom-icon-button` | `--ghost --md` | Trailing actions (more-vertical) button |
| `atom-icon-glyph` | `--md` | arrow-left glyph (inside back button) |
| `atom-icon-glyph` | `--md` | more-vertical glyph (inside actions button) |
| `.type-title` | applied to `<h1>` inside `__title-wrap` | Session title text |
| `.type-meta` | applied to `<p>` inside `__title-wrap` | Subtitle — project · branch |

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `min-height` | `var(--touch-target-min)` | 44px — WCAG AA + iOS HIG |
| `padding` | `var(--space-2) var(--space-3)` | 8px block / 12px inline |
| `gap` | `var(--space-2)` | 8px between leading, title-wrap, trailing |
| `background` | `var(--surface-page)` | Same as page — blends with viewport |
| `border-bottom` | `1px solid var(--border-subtle)` | 1px structural separator |
| `z-index` | `10` | Above scroll content, below modals |
| subtitle `margin-top` | `var(--space-half)` | 2px typographic leading — TOKEN_GAP (below scale floor of 4px) |
| subtitle `color` | `var(--text-muted)` | Via `.type-meta` |
| title `color` | `var(--text-heading)` | Via `.type-title` |
| `is-scrolled` shadow | `0 1px 0 var(--border-subtle)` | Structural shadow — reinforces the existing bottom border |

**TOKEN_GAP**: `--space-half: 2px` is used for `margin-top` on the subtitle `<p>`. This is below the token scale floor (`--space-1: 4px`). Justified as a sub-pixel typographic leading adjustment consistent with `mol-session-row__body` gap and `atom-device-bezel__battery-body` exceptions.

---

## Accessibility

- The outer `<header>` element is a landmark region; screen readers can navigate to it.
- The title uses `<h1>` as the primary heading of the view. If placed within a context where an `<h1>` already exists (e.g. inside a modal), use `<h2>` instead.
- Both icon buttons carry explicit `aria-label` attributes describing their action. Labels must be updated by the implementing layer when context changes (e.g. "Back to sessions" vs "Back to plan review").
- Icon SVGs inside buttons are `aria-hidden="true"` — the button's `aria-label` is the accessible name.
- The subtitle `<p>` is visible text and does not need additional ARIA attribution; it is read as part of the header region.
- `text-overflow: ellipsis` on the title guarantees no layout overflow at any viewport width.
