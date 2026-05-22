# atom · status-dot

## Purpose

A single-purpose decorative indicator that communicates agent or session state through color and optional animation. The dot is always paired with an adjacent label (or wrapped in a landmark `role="img"` when standalone) — it carries no text content of its own.

Used in: chat thread headers, tool-call blocks, nav status badges, session row metadata.

---

## Anatomy

```
[span.atom-status-dot  atom-status-dot--{variant}  atom-status-dot--{size}]
       │
       └── background: var(--state-{variant}-dot)
           border-radius: 50%
           optional: animation (live only)
           optional: ring shadow (warning only)
```

No child elements. The dot is a single `<span>` (or `<span role="img">` when standalone).

---

## Variants

| Class modifier | Token | Pulse | Ring | Semantic use |
|---|---|---|---|---|
| `atom-status-dot--live` | `--state-live-dot` (mint green) | Yes — 1.4s scale pulse + glow | — | Streaming, agent running |
| `atom-status-dot--warning` | `--state-warning-dot` (amber) | — | 2px solid ring via `box-shadow` using `--state-warning-bg` | Pause-pending, awaiting approval |
| `atom-status-dot--danger` | `--state-danger-dot` (red) | — | — | Error, dispatch_failed |
| `atom-status-dot--success` | `--state-success-dot` (green) | — | — | Completed, approved |
| `atom-status-dot--neutral` | `--state-neutral-dot` (muted) | — | — | Idle, archived, dormant |

---

## Sizes

| Class modifier | Explicit size | Notes |
|---|---|---|
| `atom-status-dot--xs` | 6px | Inline metadata, tight layouts |
| `atom-status-dot--sm` | 8px | **Default** — most contexts |
| `atom-status-dot--md` | 10px | Prominent headers, navigation |

Size literals (`6px`, `8px`, `10px`) are intentional: the spacing scale (`--space-*`) does not include these sub-grid values. All padding/margin/gap on surrounding elements use scale tokens.

---

## States

| Class | Effect |
|---|---|
| _(none)_ | Default — full opacity, active variant styles |
| `is-disabled` | `opacity: 0.4`, `pointer-events: none` |

The variant itself IS the semantic state — there is no hover, focus, or active state on the dot itself (it is non-interactive and decorative).

---

## Token recipe

| Property | Token | Resolved (dark) | Resolved (light) |
|---|---|---|---|
| `background` (live) | `--state-live-dot` | `#50a878` | `oklch(0.6 0.118 184.704)` |
| `background` (warning) | `--state-warning-dot` | `#d4a84b` | `oklch(0.398 0.07 227.392)` |
| `box-shadow` ring (warning) | `--state-warning-bg` | `rgba(212,168,75,0.18)` | `rgba(180,130,20,0.12)` |
| `background` (danger) | `--state-danger-dot` | `#cc4444` | `oklch(0.577 0.245 27.325)` |
| `background` (success) | `--state-success-dot` | `#50a878` | `oklch(0.6 0.118 184.704)` |
| `background` (neutral) | `--state-neutral-dot` | `#a8a5a3` | `oklch(0.556 0 0)` |
| pulse animation duration | `--motion-slow` | `360ms` | `360ms` |
| `border-radius` | `--radius-round` | `50%` | `50%` |

---

## Accessibility

- The dot is **decorative** when an adjacent text label describes the state. In that case apply `aria-hidden="true"` to the dot element.
- When the dot appears **without an adjacent label** (e.g., standalone in a nav badge), wrap it:

```html
<span role="img" aria-label="streaming">
  <span class="atom-status-dot atom-status-dot--live" aria-hidden="true"></span>
</span>
```

- Color is never the sole differentiator — the label text ("STREAMING", "AWAITING APPROVAL", etc.) carries the semantic meaning.
- The live pulse animation respects `prefers-reduced-motion`: at reduced motion, animation is removed and only the glow shadow remains as a static cue.
