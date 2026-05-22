# mol-filter-checkbox-row

A single tappable row inside a filter sheet. Composes an `atom-checkbox` with domain icon(s) and a text label to let the user toggle workspace or status filters on/off. Two variants cover the two filter groups in UC-NAV-08 §C.

---

## Anatomy

### Workspace variant

```
┌──────────────────────────────────────────────────────────────────────┐
│  [checkbox]  [git-branch]  [label]               ·  [host-icon]  [host] │
│   18×18 px    sm muted     flex-1 body text      sep  xs faint    meta  │
└──────────────────────────────────────────────────────────────────────┘
```

### Status variant

```
┌────────────────────────────────────────────┐
│  [checkbox]  [status-icon]  [label]        │
│   18×18 px    sm colored    flex-1 body    │
└────────────────────────────────────────────┘
```

| Slot | Element | Atom(s) |
|------|---------|---------|
| `__checkbox` | Selection control | `atom-checkbox atom-checkbox--default atom-checkbox--md` |
| `__icon` | Domain icon: git-branch (workspace) or status icon (status variant) | `atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--muted` |
| `__label` | Primary text; flex-1 to absorb remaining width | `.type-body` |
| `__separator` | Middle-dot · between label and host | Plain text, `--text-faint` |
| `__host-icon` | Host platform icon (laptop / cloud) — workspace variant only | `atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint` |
| `__host` | Host name (macbook / cloud-1 / desktop) — workspace variant only | `.type-meta color: --text-muted` |

The entire row is a `<label>` wrapping the `<input type="checkbox">`, satisfying the touch-target minimum via `min-height: var(--touch-target-min)`.

---

## Variants

| Class modifier | Use case | Leading icon |
|----------------|----------|--------------|
| `mol-filter-checkbox-row--workspace` (default) | Workspace + host filter | `git-branch` (sm, muted) + host icon (xs, faint) |
| `mol-filter-checkbox-row--status` | Status filter | Status-encoded icon in status color |

### Status icon × color mapping

| Status | Icon | Color class |
|--------|------|-------------|
| Streaming (live) | `radio` | `atom-icon-glyph--live` → `--state-live-fg` |
| Pause pending (warning) | `alert-triangle` | color set via `.mol-filter-checkbox-row--warning` → `--state-warning-fg` |
| Idle (neutral) | `circle` | `atom-icon-glyph--muted` → `--text-muted` |

Apply `.mol-filter-checkbox-row--warning` on the row element to switch the leading icon to warning color. The default status variant uses live color; idle uses muted.

---

## States

| Class / pseudo | Visual |
|----------------|--------|
| default | transparent background |
| `is-hover` / `:hover` | `--surface-soft` background |
| `is-active` / `:active` | `--surface-active` background |
| `is-focus` / `:focus-within` | `--border-focus` 2px ring on checkbox (atom handles) |
| `:has(.atom-checkbox__input:checked)` | `--surface-active` background on row |
| `is-disabled` | `opacity: 0.5`; `pointer-events: none` |

`is-hover` and the checked background may coexist — hover brightens the active tint.

---

## Atoms used

| Atom | Class string | Role |
|------|-------------|------|
| `atom-checkbox` | `atom-checkbox atom-checkbox--default atom-checkbox--md` | Selection control |
| `atom-icon-glyph` | `atom-icon-glyph--sm atom-icon-glyph--muted` | Workspace leading icon (git-branch) |
| `atom-icon-glyph` | `atom-icon-glyph--xs atom-icon-glyph--faint` | Host platform icon (laptop / cloud) |
| `atom-icon-glyph` | `atom-icon-glyph--sm atom-icon-glyph--live` | Status leading icon — live/streaming |
| `atom-icon-glyph` | `atom-icon-glyph--sm` + `.mol-filter-checkbox-row--warning .mol-filter-checkbox-row__icon` | Status leading icon — warning |
| `atom-icon-glyph` | `atom-icon-glyph--sm atom-icon-glyph--muted` | Status leading icon — idle |
| `atom-section-label` | `atom-section-label` | Section group header (Workspaces / Status) |

---

## Token recipe

| Property | Token | Notes |
|----------|-------|-------|
| Row gap | `--space-3` | Between all flex children |
| Row padding-block | `--space-3` | Top and bottom |
| Row padding-inline | `--space-4` | Left and right |
| Min-height | `--touch-target-min` | 44pt iOS HIG |
| Border-radius | `--radius-default` | Row hover background rounding |
| Background (hover) | `--surface-soft` | — |
| Background (checked) | `--surface-active` | `:has(input:checked)` selector |
| Separator color | `--text-faint` | Middle-dot |
| Host text color | `--text-muted` | `__host` slot |
| Transition | `background-color var(--motion-fast) var(--motion-ease-out)` | Row background only |
| Tap highlight | `transparent` | `-webkit-tap-highlight-color` |
| Status live icon color | `--state-live-fg` | Via `atom-icon-glyph--live` |
| Status warning icon color | `--state-warning-fg` | Via `.mol-filter-checkbox-row--warning .mol-filter-checkbox-row__icon` |

### TOKEN_GAPs

None. All spacing and color values resolve to design tokens or inherit from atom classes.

---

## Accessibility

- The row is a `<label>` element wrapping `<input type="checkbox">`. Clicking anywhere on the row toggles the checkbox — no explicit `for`/`id` wiring needed.
- `aria-label` on the `<input>` follows the pattern:
  - Workspace: `"Filter by workspace: <name> on <host>"` — e.g. `"Filter by workspace: chat-mobile-plan on macbook"`.
  - Status: `"Filter by status: <label>"` — e.g. `"Filter by status: Streaming"`.
- Status is conveyed both visually (icon color) and textually (aria-label). The icon itself is `aria-hidden="true"`.
- `is-disabled` rows also carry `<input disabled>` so they are removed from keyboard focus order.
- Focus ring is handled by the nested `atom-checkbox` atom via `:focus-within` on the box — no additional molecule-level focus rule is needed.
