# mol-session-row

A single row in the mobile sessions list. Composes atoms to form a tappable list item that encodes session state via a leading status dot, displays title and workspace metadata in a truncating body, and shows a timestamp + chevron on the trailing edge.

---

## Purpose

- Primary tap target to open a session from the sessions list
- Visually encodes session status (live / warning / danger / idle / archived) through the `atom-status-dot` variant
- Supports long-press for the copy-title action menu (`aria-haspopup="menu"`)
- Swipe-left gesture is owned by the parent list container; this component remains a plain `<button>`
- Groups under a `workspace-section-header` molecule (see INVENTORY.md) that provides the sticky section label

---

## Anatomy

```html
<button
  class="mol-session-row mol-session-row--live"
  aria-label="Open session: Refactor relay tunnel reconnect"
  aria-haspopup="menu"
>
  <!-- Leading: status atom -->
  <span class="mol-session-row__leading">
    <span
      class="atom-status-dot atom-status-dot--live atom-status-dot--sm"
      aria-hidden="true"
    ></span>
  </span>

  <!-- Body: title + meta -->
  <span class="mol-session-row__body">
    <span class="mol-session-row__title">Refactor relay tunnel reconnect</span>
    <span class="mol-session-row__meta type-meta">superset · chat-mobile-plan</span>
  </span>

  <!-- Trailing: timestamp + chevron -->
  <span class="mol-session-row__trailing">
    <span class="atom-section-label atom-section-label--faint">12m</span>
    <svg
      class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  </span>
</button>
```

**Optional unread badge** (appended inside `__trailing` when `is-unread`):
```html
<span class="atom-badge atom-badge--dot atom-badge--accent" aria-label="Unread updates"></span>
```

---

## Variants

| Class modifier | `atom-status-dot` variant | Title color | Use case |
|---|---|---|---|
| `mol-session-row--live` | `--live` (mint pulse) | `--text-body` | Streaming / agent running |
| `mol-session-row--warning` | `--warning` (amber ring) | `--text-body` | Awaiting approval / question |
| `mol-session-row--danger` | `--danger` (red) | `--text-body` | Dispatch failed / error |
| `mol-session-row--idle` | `--neutral` (muted) | `--text-body` | Completed / dormant |
| `mol-session-row--archived` | `--neutral` (muted) | `--text-faint` | Archived / long-untouched |

---

## States

| Class | Visual effect |
|---|---|
| `default` | Transparent background |
| `is-hover` | `background: var(--surface-soft)` |
| `is-active` | `background: var(--surface-active)` |
| `is-focus` | Inset 2px focus ring `var(--border-focus)` |
| `is-selected` | `background: var(--surface-active)` + 3px left border `var(--accent-primary)` |
| `is-pressed-long` | Scales down slightly (long-press haptic analog); shows copy-tooltip hint via `::after` |
| `is-unread` | `atom-badge--dot --accent` appended in trailing slot |

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-status-dot` | `--live` / `--warning` / `--danger` / `--neutral` + `--sm` | Leading status indicator |
| `atom-section-label` | `--faint` | Trailing timestamp ("12m", "2h", "YESTERDAY") |
| `atom-icon-glyph` | `--xs --faint` | Trailing chevron-right navigation affordance |
| `atom-badge` | `--dot --accent` | Trailing unread indicator (`is-unread` state) |
| `atom-divider` | `--horizontal --hairline` | Optional between-row separator (parent list may own this) |
| `atom-hit-target-wrapper` | wraps entire `<button>` content | Ensures 44px min tap zone for long-press zone |

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `min-height` | `var(--touch-target-min)` | 44px WCAG AA + iOS HIG |
| `padding` | `var(--space-3) var(--space-4)` | 12px block, 16px inline |
| `gap` (flex children) | `var(--space-3)` | 12px between leading/body/trailing |
| `gap` (trailing inner) | `var(--space-2)` | 8px between timestamp and chevron |
| `gap` (body column) | `2px` | TOKEN_GAP — see below |
| `background` hover | `var(--surface-soft)` | |
| `background` active/selected | `var(--surface-active)` | |
| `border-left` selected | `3px solid var(--accent-primary)` | `3px` is structural geometry matching `--domain-tool-rule-width` |
| `color` default | `var(--text-body)` | Inherited by title |
| `color` archived title | `var(--text-faint)` | |
| `color` meta text | `var(--text-muted)` | Via `.type-meta` |
| `font-family` | `var(--font-body)` | |
| `font-size` | `var(--font-size-body)` | 15px |
| `font-weight` title | `var(--font-weight-meta)` | 500 — slightly heavier than body for scannability |
| Focus ring | `inset 0 0 0 2px var(--border-focus)` | box-shadow inset |
| Transition | `background-color var(--motion-fast) var(--motion-ease-out)` | |

**TOKEN_GAP**: `--space-body-gap := 2px` — the 2px gap between title and meta lines inside `__body` is below the token scale floor (smallest is `--space-1: 4px`). Used as a raw `2px` structural geometry value, justified as sub-pixel typographic leading adjustment consistent with other inline-gap exceptions in the codebase (`atom-device-bezel__battery-body`, `atom-streaming-cursor` left-margin).

---

## Accessibility

- The entire row is a single `<button>` — one tap target, no nested interactive elements.
- `aria-label` contains the full action phrase: `"Open session: {title}"`.
- Status atoms carry `aria-hidden="true"` — state is communicated via the `aria-label` text (e.g., include "live" / "failed" in the label when the surface layer hydrates this).
- Long-press affordance: `aria-haspopup="menu"` signals the action menu. The menu itself is rendered by the parent organism.
- Unread badge: the dot badge gets `aria-label="Unread updates"` and is not `aria-hidden` so screen readers announce it.
- Swipe-to-delete gesture lives in the parent list; the row button itself has no swipe semantics.
- `text-overflow: ellipsis` on title guarantees no text overflow violates layout at any viewport width.
