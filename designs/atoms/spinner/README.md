# atom · spinner

## Purpose

A loading indicator that communicates an in-progress or async operation. Used
wherever the UI must signal that content is being fetched, a connection is being
established, or an action is running. Two production-matched flavors:

- **circular** — SVG arc with a rotating stroke gap. Maps to `lucide:loader-2`.
  Used inside buttons, inline with text labels, and as a page/region loading
  indicator.
- **ascii** — Braille glyph cycling through ten frames (`⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏`).
  Maps to `AsciiSpinner.tsx` in `apps/desktop`. Used in terminal-style contexts:
  connecting banners, history-loading rows, session-list entries while syncing.

Both variants are fully token-governed. Neither carries semantic meaning on its
own — the surrounding `role="status"` region holds the accessible label.

---

## Anatomy

### Circular kind

```
[span.atom-spinner  atom-spinner--circular  atom-spinner--{color}  atom-spinner--{size}]
  │
  └── display: inline-block
      width/height: size token (12–32px)
      border: 2px solid currentColor
      border-top-color: transparent   ← the "gap" in the arc
      border-radius: var(--radius-round)
      animation: rotate — var(--motion-cadence-pulse-medium) linear infinite
      color: var(--text-muted)  [default]
```

No child elements. The entire visual is a single `<span>` with border styling.
The `2px` border is a structural geometry value, not a design token — exempt
from the zero-literals rule (same class as SVG `stroke-width`).

### ASCII kind

```
[span.atom-spinner  atom-spinner--ascii  atom-spinner--{color}  atom-spinner--{size}]
  │
  └── display: inline-block
      font-family: var(--font-mono)
      font-size: inherits from size modifier (em-matched to size class)
      color: var(--text-muted)  [default]
      ::before { content: '⠋'; animation: frame-cycle — var(--motion-cadence-pulse-slow) steps(10) infinite }
```

The `::before` pseudo-element holds the cycling glyph. Size modifiers set
`font-size` to keep optical weight consistent with circular at the same size
class. The glyph itself is `aria-hidden` — a wrapping `role="status"` region
carries all assistive meaning.

---

## Variants

### Kind

| Class | Description |
|---|---|
| `atom-spinner--circular` | SVG-border arc spinner. Default kind when no modifier present. |
| `atom-spinner--ascii` | Braille glyph cycling through 10 frames. |

### Color

| Class | Token | Resolved (dark) | Resolved (light) | Use when |
|---|---|---|---|---|
| `atom-spinner--muted` | `--text-muted` | `#a8a5a3` | `oklch(0.556 0 0)` | **Default.** Neutral, secondary loading. |
| `atom-spinner--accent` | `--accent-primary` | `#e07850` | `oklch(0.646 0.222 41.116)` | Primary CTA button loading state. |
| `atom-spinner--live` | `--state-live-fg` | `#50a878` | `oklch(0.6 0.118 184.704)` | Streaming / agent running inline. |
| `atom-spinner--inverse` | `--text-on-inverse` | `#151110` | `oklch(0.985 0 0)` | On solid-fill ember button background. |

Color modifiers override `color` only; layout and animation are unchanged.
Do not pick color to convey semantic state — use `--live` for live contexts,
`--accent` for actions, `--muted` for background loading.

---

## Sizes

| Class | Size | ASCII font-size | Typical use |
|---|---|---|---|
| `atom-spinner--xs` | 12px | `var(--font-size-meta)` (11px) | Inline tight metadata, tab labels |
| `atom-spinner--sm` | 16px | `var(--font-size-label)` (12px) | **Default.** Navigation, row items |
| `atom-spinner--md` | 20px | `var(--font-size-body-sm)` (13px) | Most in-page loading contexts |
| `atom-spinner--lg` | 24px | `var(--font-size-body)` (15px) | Section-level headers |
| `atom-spinner--xl` | 32px | `var(--font-size-title)` (16px) | Full-screen / hero loading states |

Size pixel values (`12`, `16`, `20`, `24`, `32`) are intentional structural
geometry — they match `atom-icon-glyph` exactly and sit below the `--space-*`
scale baseline (`--space-1 = 4px`). Typography `font-size` values reference
scale tokens.

---

## States

| Class / condition | Effect |
|---|---|
| _(none)_ | Animating — full opacity, active variant styles |
| `is-paused` | `animation-play-state: paused` — freezes the current frame. Use in snapshots, debug views, reduced-motion polyfills. |

`is-paused` is not the same as `prefers-reduced-motion`. The media query removes
animation entirely; `is-paused` freezes it in place.

---

## Token recipe

| Property | Token | Exception note |
|---|---|---|
| `color` (default) | `--text-muted` | |
| `color` (accent) | `--accent-primary` | |
| `color` (live) | `--state-live-fg` | |
| `color` (inverse) | `--text-on-inverse` | |
| `border-width` | `2px` | Structural geometry — SVG/stroke exception |
| `border-radius` | `--radius-round` | |
| Animation duration (circular) | `--motion-cadence-pulse-medium` (1.4s) | Loop cadence, not transition |
| Animation duration (ascii) | `--motion-cadence-pulse-slow` (2s) | Loop cadence, not transition |
| `font-family` (ascii) | `--font-mono` | |
| `font-size` (ascii xs) | `--font-size-meta` | |
| `font-size` (ascii sm) | `--font-size-label` | |
| `font-size` (ascii md) | `--font-size-body-sm` | |
| `font-size` (ascii lg) | `--font-size-body` | |
| `font-size` (ascii xl) | `--font-size-title` | |

---

## Accessibility

The spinner is **purely decorative** from an accessibility perspective. It must
always be placed inside a loading region that describes the operation in text:

```html
<div role="status" aria-live="polite" aria-busy="true">
  <span class="sr-only">Loading messages</span>
  <span class="atom-spinner atom-spinner--circular atom-spinner--muted atom-spinner--sm"
        aria-hidden="true"></span>
</div>
```

Rules:
- Always `aria-hidden="true"` on the spinner element itself.
- The wrapping region uses `role="status"` + `aria-live="polite"` + `aria-busy="true"`.
- `aria-busy` should be removed (or set to `false`) when loading completes.
- `aria-live="polite"` is preferred over `assertive` — loading state is not
  urgent enough to interrupt the user.
- The `sr-only` span provides a text label. Use a descriptive string:
  "Loading messages", "Connecting…", "Sending…" — not just "Loading".
- Color variants carry no semantic meaning. Do not rely on spinner color alone
  to distinguish states.
- Animation respects `prefers-reduced-motion: reduce` — both circular rotation
  and ascii frame-cycling are halted. A static glyph (`⠿`) or static arc
  provides the non-animated fallback.

### sr-only utility

Include this in the page's global CSS if not already present:

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```
