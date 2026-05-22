# mol-host-chip

A compact interactive pill in the Chat tab header (top-right) that displays the currently-selected host, encodes its connectivity state via a status dot, and opens the host-picker bottom sheet when tapped.

---

## Purpose

- Shows which host is active at a glance from any screen in the Chat tab
- Encodes host connectivity in two independent channels: aria-label text + status dot color (color is NOT the sole channel — WCAG 1.4.1 compliant)
- Tapping triggers `aria-haspopup="dialog"` to open the host-picker bottom sheet
- Four variants cover every host-state the product can surface: online, offline, unpaid, and no-host
- `max-width: 8em` on the label truncates long hostnames while keeping the chip width predictable in the header

---

## Anatomy

```html
<button
  class="mol-host-chip atom-pill atom-pill--default atom-pill--sm atom-pill--monospace"
  aria-haspopup="dialog"
  aria-label="Switch host: macbook-pro is online"
>
  <!-- 1. Status dot — host connectivity encoding -->
  <span
    class="atom-status-dot atom-status-dot--live atom-status-dot--xs mol-host-chip__status"
    aria-hidden="true"
  ></span>

  <!-- 2. Host glyph icon -->
  <svg
    class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted mol-host-chip__icon"
    aria-hidden="true"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-linecap="round" stroke-linejoin="round"
  >
    <!-- server icon -->
    <rect x="2" y="3" width="20" height="7" rx="1"/>
    <rect x="2" y="14" width="20" height="7" rx="1"/>
    <circle cx="17" cy="6.5" r="1" fill="currentColor" stroke="none"/>
    <circle cx="17" cy="17.5" r="1" fill="currentColor" stroke="none"/>
  </svg>

  <!-- 3. Hostname label — truncates at 8em -->
  <span class="mol-host-chip__label">macbook-pro</span>

  <!-- 4. Chevron — signals dropdown affordance -->
  <svg
    class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint mol-host-chip__chevron"
    aria-hidden="true"
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-linecap="round" stroke-linejoin="round"
  >
    <path d="M6 9l6 6 6-6"/>
  </svg>
</button>
```

---

## Variants

| Modifier class | Status dot variant | Use case |
|---|---|---|
| `mol-host-chip--online` (default) | `atom-status-dot--live` (mint, pulsing) | Host reachable, normal operation |
| `mol-host-chip--offline` | `atom-status-dot--warning` (amber, ring) | Host unreachable, attempting reconnect |
| `mol-host-chip--unpaid` | `atom-status-dot--warning` (amber, ring) | Plan-limited — `skipped_unpaid` state |
| `mol-host-chip--no-host` | `atom-status-dot--neutral` (muted gray) | No host selected; label reads "No host" |

The `--no-host` variant dims the label with `--text-faint` and changes the aria-label to "Select a host".

---

## States

| State class | Description |
|---|---|
| _(default)_ | Resting pill appearance |
| `is-hover` | Inherits `atom-pill--default` hover: `--surface-active` background |
| `is-active` | Inherits `atom-pill` active: `translateY(1px)` micro-press |
| `is-focus` | Inherits `atom-pill` focus: `box-shadow: 0 0 0 2px var(--border-focus)` |
| `is-disabled` | Opacity 0.5, `pointer-events: none` |

All states are inherited directly from `atom-pill` — no mol-level state overrides needed.

---

## Atoms Used

| Atom | Class(es) applied | Role in molecule |
|---|---|---|
| `atom-pill` | `atom-pill--default atom-pill--sm atom-pill--monospace` | Base shape, sizing, typography, hover/active/focus/disabled states |
| `atom-status-dot` | `atom-status-dot--{live\|warning\|neutral} atom-status-dot--xs` | Host connectivity indicator — variant changes per `mol-host-chip--*` |
| `atom-icon-glyph` | `atom-icon-glyph--xs atom-icon-glyph--muted` | Leading server/host glyph |
| `atom-icon-glyph` | `atom-icon-glyph--xs atom-icon-glyph--faint` | Trailing chevron-down — signals picker affordance |

---

## Token Recipe

| Property | Token | Notes |
|---|---|---|
| Base shape / bg | `atom-pill--default` → `--surface-soft`, `--border-default` | Inherited from atom |
| Typography | `atom-pill--sm` → `--font-size-meta`, `--font-weight-meta`, `atom-pill--monospace` → `--font-mono` | Hostname rendered in monospace |
| Host icon color | `atom-icon-glyph--muted` → `--text-muted` | Subtle, not competing with label |
| Chevron color | `atom-icon-glyph--faint` → `--text-faint` | Recessive trailing cue |
| Status dot (online) | `atom-status-dot--live` → `--state-live-dot` | Mint green, pulsing |
| Status dot (offline/unpaid) | `atom-status-dot--warning` → `--state-warning-dot` | Amber, ring halo |
| Status dot (no-host) | `atom-status-dot--neutral` → `--state-neutral-dot` | Muted gray, static |
| Label (no-host) | `--text-faint` | Signals unselected / inactive state |
| Gap between elements | `--space-2` (from `atom-pill--sm` gap) | Molecule overrides to `--space-2` via layout glue |
| Label max-width | `8em` | Content-adaptive truncation — allowed structural exception |
| Chevron margin-left | `--space-1` | Extra breathing room between label and chevron |
| Focus ring | `--border-focus` | Inherited from `atom-pill` |
| Disabled opacity | `0.5` | Inherited from `atom-pill.is-disabled` |

---

## Accessibility

- `<button aria-haspopup="dialog">` — browser announces "opens dialog" on focus
- `aria-label` carries the semantic meaning: "Switch host: macbook-pro is online" — status dot color is the visual reinforcement, NOT the sole channel
- `--no-host` state: aria-label reads "Select a host" (imperative — signals empty, actionable)
- `--offline` state: aria-label includes "is offline" — explicitly named, not inferred from color
- `--unpaid` state: aria-label includes "plan limited" — avoids exposing payment detail in accessibility tree while still signaling restriction
- All SVG icons carry `aria-hidden="true"` — they are decorative; meaning is carried by the button's `aria-label`
- Focus ring inherited from `atom-pill` — 2px `--border-focus` ring on `:focus-visible`

---

## Molecule-local CSS glue (summary)

The following rules live in `host-chip.html`'s `<style>` block only. They are pure layout glue — no atom-style redefinition.

```css
.mol-host-chip {
  display:     inline-flex;
  align-items: center;
  gap:         var(--space-2);
  cursor:      pointer;
}
.mol-host-chip__status  { flex-shrink: 0; }
.mol-host-chip__icon    { flex-shrink: 0; }
.mol-host-chip__label {
  white-space:   nowrap;
  overflow:      hidden;
  text-overflow: ellipsis;
  max-width:     8em;
}
.mol-host-chip__chevron {
  margin-left: var(--space-1);
  flex-shrink: 0;
}
.mol-host-chip--no-host .mol-host-chip__label {
  color: var(--text-faint);
}
```
