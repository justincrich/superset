# mol-host-picker-row

A tappable row inside the host-picker bottom-sheet. Displays a single accessible host with its online/offline/unpaid status, a monospace hostname, optional meta text, and an accent check mark when that host is the currently selected one. Tapping the row selects the host and dismisses the sheet.

---

## Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│ [leading]   [body]                    [trailing]             │
│  server     hostname                  check (selected only)  │
│  icon ●     meta text                                        │
└──────────────────────────────────────────────────────────────┘
```

| Slot | Element | Atom(s) |
|------|---------|---------|
| `__leading` | Server icon + status badge overlaid at bottom-right corner | `atom-icon-glyph--sm atom-icon-glyph--muted` (server) + `atom-status-dot--sm` (absolute overlay) |
| `__body` | Hostname label + meta text in a vertical stack | `__name` (mono body font) + `__meta` using `atom-section-label atom-section-label--muted` |
| `__trailing` | Selected-state check icon, hidden when not selected | `atom-icon-glyph--sm atom-icon-glyph--accent` (check) |

Between rows: `atom-divider atom-divider--horizontal atom-divider--hairline`

The entire row is a `<button>` which satisfies `atom-hit-target-wrapper` requirements implicitly via `min-height: var(--touch-target-min)`.

---

## Variants

| Class modifier | Status dot | Usage |
|----------------|------------|-------|
| `mol-host-picker-row--online` | `atom-status-dot--live` | Host is reachable and running |
| `mol-host-picker-row--offline` | `atom-status-dot--neutral` | Host was seen but is currently unreachable |
| `mol-host-picker-row--unpaid` | `atom-status-dot--warning` | Host is reachable but the plan is limited |

---

## States

| Class | Visual |
|-------|--------|
| default | transparent background |
| `is-hover` / `:hover` | `--surface-soft` background |
| `is-active` / `:active` | `--surface-active` background + `scale(0.995)` |
| `is-focus` / `:focus-visible` | inset 2px `--border-focus` ring |
| `is-selected` | `--surface-active` background; trailing check icon visible (`opacity: 1`) |
| `is-disabled` | `opacity: 0.5`; `pointer-events: none` |

`is-selected` and `is-hover` may coexist — the hover surface-soft lightens the active tint on hover.

---

## Atoms used

| Atom | Class string | Notes |
|------|-------------|-------|
| `atom-icon-glyph` | `atom-icon-glyph--sm atom-icon-glyph--muted` | Leading server icon |
| `atom-status-dot` | `atom-status-dot--{live|neutral|warning} atom-status-dot--sm` | Overlaid at leading icon corner |
| `atom-section-label` | `atom-section-label` (default muted color) | Meta text in `__body` |
| `atom-icon-glyph` | `atom-icon-glyph--sm atom-icon-glyph--accent` | Trailing check (selected) |
| `atom-divider` | `atom-divider--horizontal atom-divider--hairline` | Between rows |

The row itself serves as its own touch-target (`min-height: var(--touch-target-min)`) per the `atom-hit-target-wrapper` pattern — no wrapper element needed.

---

## Token recipe

| Property | Token | Notes |
|----------|-------|-------|
| Row gap | `--space-3` | Between leading / body / trailing |
| Row padding-inline | `--space-4` / `--space-3` | `--space-4` h; `--space-3` v |
| Min-height | `--touch-target-min` | 44pt iOS HIG |
| Background (default) | `transparent` | — |
| Background (hover) | `--surface-soft` | — |
| Background (selected) | `--surface-active` | — |
| Focus ring | `--border-focus` | inset 2px |
| Body text color | `--text-body` | — |
| Hostname font | `--font-mono` | Monospace for machine names |
| Hostname weight | `--font-weight-meta` | Semi-bold |
| Hostname size | `--font-size-body` | — |
| Body stack gap | `2px` | Sub-token typographic gap — TOKEN_GAP (same as session-row) |
| Status dot overlay offset | `-2px` right/bottom | Structural geometry — TOKEN_GAP |
| Transition | `background-color var(--motion-fast) var(--motion-ease-out)` | — |
| Tap highlight | `transparent` | `-webkit-tap-highlight-color` |

### TOKEN_GAPs

1. `gap: 2px` in `__body` — sub-token typographic leading between hostname and meta. No spacing token resolves to 2px.
2. `right: -2px; bottom: -2px` on status-dot overlay — structural pin at icon corner. No offset token exists.

---

## Accessibility

- The row is a `<button>` with `role="option"` inside a `role="listbox"` container (the host-picker sheet).
- `aria-pressed="true|false"` communicates selection state.
- `aria-label` follows the pattern: `"<host-name> is <online|offline|plan limited>, <currently selected|tap to select>"`.
- `aria-disabled="true"` mirrors the `is-disabled` visual state; the button also has the HTML `disabled` attribute so it is removed from keyboard focus.
- The trailing check icon is `aria-hidden="true"` — selection state is communicated via `aria-pressed`, not the icon.
- The status dot is `aria-hidden="true"` — status is described in the `aria-label`.
