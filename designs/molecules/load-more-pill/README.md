# mol-load-more-pill

## Purpose

Pagination affordance rendered at the bottom of a workspace section in the sessions list when more sessions exist beyond the initially loaded set. Tapping appends 5 more session rows inline. Designed as a full-width or inline pill button that fits naturally within the list's padding gutter.

---

## Anatomy

```
┌─────────────────────────────────────────────────┐
│  [Load more]  [(5 more)]  [chevron-down icon]   │
└─────────────────────────────────────────────────┘
```

| Slot | Element | Notes |
|---|---|---|
| Root | `<button>` | Inherits `atom-button atom-button--secondary atom-button--md` |
| `__label` | `<span>` | "Load more" or "Loading..." (loading state) or "No more sessions" (end state) |
| `__count` | `<span>` | "(N more)" — mono uppercase via `atom-section-label atom-section-label--muted` |
| `__chevron` | `<svg>` | chevron-down — `atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--muted`. Hidden during loading state |
| `__loading` | `.atom-progress-dots` | Three-dot indicator — rendered only in `is-loading` state; replaces chevron |

---

## Variants

| Class | Behaviour |
|---|---|
| `mol-load-more-pill--full-width` (default) | `width: calc(100% - var(--space-8))` — spans parent container minus horizontal padding |
| `mol-load-more-pill--inline` | `width: auto` — auto-sizes to content; useful in inline contexts |

---

## States

| State | Class / Attribute | Description |
|---|---|---|
| Default | — | Shows label, count, and chevron |
| Hover | `.is-hover` / `:hover` | Inherited from `atom-button--secondary` — `var(--surface-active)` background |
| Active | `.is-active` / `:active` | Inherited — scale(0.98) press feedback |
| Focus | `.is-focus` / `:focus-visible` | Inherited — `var(--border-focus)` ring |
| Loading | `.is-loading` | Chevron hidden; progress-dots shown; label becomes "Loading..."; `aria-busy="true"` |
| End | `.is-end` | Native `disabled` attribute; label becomes "No more sessions"; no chevron or count; `aria-label="No more sessions to load"` |

---

## Atoms Used

| Atom | Class(es) | Role |
|---|---|---|
| `atom-button` | `atom-button atom-button--secondary atom-button--md` | Root container — 44pt touch target, secondary color, border-radius |
| `atom-icon-glyph` | `atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--muted` | chevron-down affordance icon (16×16) |
| `atom-progress-dots` | `atom-progress-dots atom-progress-dots--muted atom-progress-dots--sm` | Three-dot loading indicator shown during pagination fetch |
| `atom-section-label` | `atom-section-label atom-section-label--muted` | Count text "(N more)" — mono uppercase, muted color |

---

## Token Recipe

| Property | Token |
|---|---|
| Button height | `var(--touch-target-min)` (44px) |
| Button background | `var(--surface-soft)` |
| Button background hover | `var(--surface-active)` |
| Button text color | `var(--text-body)` |
| Count text color | `var(--text-muted)` |
| Icon color | `var(--text-muted)` |
| Pill margin | `var(--space-2)` block, `var(--space-4)` inline |
| Full-width inset | `calc(100% - var(--space-8))` |
| Inner gap | `var(--space-2)` |
| Chevron transition | `transform var(--motion-fast) var(--motion-ease-out)` |
| Border radius | `var(--radius-default)` (inherited from atom-button) |
| Focus ring | `0 0 0 3px var(--border-focus)` (inherited from atom-button) |

---

## Accessibility

- Root `<button>` carries a descriptive `aria-label` that includes the count: `aria-label="Load 5 more sessions"`.
- During loading: `aria-busy="true"` on the root button; label text updates to "Loading..." for screen readers.
- End state: native `disabled` attribute (removes from tab order); `aria-label="No more sessions to load"`.
- The chevron icon carries `aria-hidden="true"` — decorative.
- The progress-dots container carries `aria-hidden="true"` when visible; the button label change conveys state to assistive tech.
- Minimum touch target 44pt maintained via `atom-button--md` / `var(--touch-target-min)`.
