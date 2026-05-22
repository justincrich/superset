# workspace-section-header

**Molecule** — Sessions list sticky workspace section header, composed entirely from atoms.

---

## Purpose

Groups session rows by workspace identity (`{project} · {branch}`) inside the mobile sessions list. Sticks to the top of the scroll container while its workspace's sessions are visible. Tapping the header collapses or expands the session group beneath it.

This molecule is the _grouping anchor_ of the sessions list — it provides the collapse/expand gesture target, the workspace label, and the session count at a glance.

---

## Anatomy

```
┌─────────────────────────────────────────────────────┐
│  [button.mol-workspace-section-header__toggle       │
│    [chevron-icon]  [section-label text]             │  ← toggle tap zone
│  ]                                    [count-badge] │
└─────────────────────────────────────────────────────┘
```

| Slot | Element | Atom |
|------|---------|------|
| Toggle (entire left side) | `button.mol-workspace-section-header__toggle` | `atom-hit-target-wrapper` (row variant, not square) |
| Collapse/expand indicator | `svg.mol-workspace-section-header__chevron` | `atom-icon-glyph--xs atom-icon-glyph--muted` |
| Workspace identifier | `span.atom-section-label--muted` | `atom-section-label` (sticky modifier removed; parent header owns stickiness) |
| Session count | `span.atom-badge--neutral atom-badge--sm` | `atom-badge` |
| Below-header rule | `hr.atom-divider--hairline` (optional, parent owned) | `atom-divider` |

---

## Variants

| Modifier class | Description |
|----------------|-------------|
| `mol-workspace-section-header--expanded` (default) | Chevron points down; section rows are visible |
| `mol-workspace-section-header--collapsed` | Chevron rotated -90deg (points right); rows hidden beneath |
| `mol-workspace-section-header--empty` | Count badge hidden via `display: none`; workspace has zero sessions matching current filter |

---

## States

| Class | Effect |
|-------|--------|
| _(default)_ | Transparent toggle background |
| `is-hover` on toggle | `var(--surface-soft)` background wash on the toggle button |
| `is-pinned` on header | Hairline `box-shadow` at bottom edge signals header is actively stuck |
| `is-focus` on toggle | 3px focus ring via `var(--border-focus)` |

---

## Atoms Used

| Atom | Class(es) applied | Purpose |
|------|-------------------|---------|
| `atom-section-label` | `atom-section-label atom-section-label--muted` | Workspace identifier — mono uppercase, wide tracking |
| `atom-badge` | `atom-badge atom-badge--neutral atom-badge--sm` | Session count pill |
| `atom-icon-glyph` | `atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted` | Chevron collapse/expand indicator |
| `atom-hit-target-wrapper` | `atom-hit-target-wrapper mol-workspace-section-header__toggle` | 44pt tap target on toggle — shape overridden to row |
| `atom-divider` | `atom-divider atom-divider--horizontal atom-divider--hairline` | Optional below-header rule (parent may supply) |

---

## Token Recipe

| Property | Token | Resolves to |
|----------|-------|-------------|
| Header background | `--surface-page` | Dark: `#151110` / Light: `oklch 1 0 0` |
| Toggle hover bg | `--surface-soft` | Dark: `#1e1c1b` / Light: `oklch 0.97 0 0` |
| Focus ring | `--border-focus` | Ember amber |
| Pinned shadow | `--border-subtle` | Dark: `#2a2827` / Light: `oklch 0.922 0 0` |
| Label color (muted) | `--text-muted` | Dark: `#a8a5a3` / Light: `oklch 0.556 0 0` |
| Badge bg (neutral) | `--surface-soft` | same as toggle hover |
| Badge fg | `--text-body` | Dark: `#eae8e6` / Light: `oklch 0.145 0 0` |
| Chevron color | `--text-muted` | same as label |
| Header min-height | `--touch-target-min` | 44px |
| Padding block | `--space-2` | 8px |
| Padding inline | `--space-4` | 16px |
| Chevron gap | `--space-2` | 8px |
| Chevron transition | `--motion-fast` + `--motion-ease-out` | 120ms ease-out |
| Motion: collapsed rotate | CSS `transform: rotate(-90deg)` | structural |

---

## Accessibility

- The outer `<header>` element provides landmark semantics for the section.
- The `<button>` toggle carries `aria-expanded="true|false"` to communicate collapse state to screen readers.
- `aria-controls="<workspace-id>-sessions-list"` links the button to the `<ul>` or container holding the session rows, enabling screen reader jump-to-content.
- `aria-label` on the button includes the workspace name: `"Collapse superset · chat-mobile-plan workspace"`.
- The chevron SVG is `aria-hidden="true"` — the button label carries the full intent.
- The count badge is `aria-hidden="true"` when used decoratively; the accessible name on the button should include the count if meaningful.
- **Sticky + keyboard**: The header uses `position: sticky` but does NOT intercept keyboard focus or tab order. Users tabbing through the list will naturally reach the toggle button; no additional tabindex manipulation is needed.
- **Reduced motion**: Chevron rotation transition is governed by `--motion-fast` and respects `prefers-reduced-motion: reduce` via the global motion token (transition removed when reduced motion active — the transform still applies instantly).
