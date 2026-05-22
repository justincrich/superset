# atom · live-activity-dot

Dynamic Island live-activity indicator. A pulsing colored dot paired with an uppercase mono label, rendered inside the iPhone Pro Max Dynamic Island when a chat session is active.

## Anatomy

```
.atom-live-activity-dot          ← flex row container (role="status" aria-live="polite")
  .atom-live-activity-dot__dot   ← 6×6 circle, color + optional glow + optional pulse
  .atom-live-activity-dot__label ← uppercase mono text, color matches dot
```

The dot and label are **always rendered together**. The dot alone is never exposed standalone — use `status-dot` for that.

## Variants

| Modifier class | Dot color token | Label color token | Animation | Use case |
|---|---|---|---|---|
| `--live` (default) | `--state-live-fg` | `--state-live-fg` | `atom-live-activity-pulse` 1.4s ease-in-out infinite (scale 1→1.2, opacity 1→0.55) | Streaming, Bash, Writing, Question, Approve |
| `--paused` | `--state-warning-fg` | `--state-warning-fg` | None — steady dot with 0.5px outline glow (`box-shadow: 0 0 6px …`) | Pending / awaiting response |
| `--dormant` | `--text-muted` | `--text-muted` | None — no glow | Idle Island (no active session) |

## States

No hover or focus states. Dynamic Island content is display-only and non-interactive on iOS.

| State | Behaviour |
|---|---|
| default | Variant styles apply |
| `prefers-reduced-motion` | `--live` pulse suppressed; mint color and glow are retained as a static spatial cue |

## Size

Fixed — no size variants.

| Property | Value |
|---|---|
| Dot width/height | 6px (structural geometry) |
| Gap dot → label | `var(--space-2)` (8px) |
| Font size | `var(--font-size-meta)` (11px) |
| Font weight | `var(--font-weight-meta)` (500) |
| Letter spacing | `var(--tracking-uppercase)` (0.06em) |
| Text transform | uppercase |
| Font family | `var(--font-mono)` |

## Token recipe

| Property | Token | Dark resolved | Light resolved |
|---|---|---|---|
| Dot bg + label color (live) | `--state-live-fg` | `#50a878` (mint) | `oklch(0.6 0.118 184.704)` |
| Box-shadow glow (live) | `--state-live-fg` | `0 0 8px #50a878` | `0 0 8px oklch(…)` |
| Dot bg + label color (paused) | `--state-warning-fg` | `#d4a84b` (amber) | `oklch(0.398 0.07 227.392)` |
| Box-shadow glow (paused) | `--state-warning-fg` | `0 0 6px #d4a84b` | `0 0 6px oklch(…)` |
| Dot bg + label color (dormant) | `--text-muted` | `#a8a5a3` | `oklch(0.556 0 0)` |
| Box-shadow (dormant) | none | — | — |
| Gap | `--space-2` | 8px | 8px |
| Font family | `--font-mono` | Geist Mono | Geist Mono |
| Font size | `--font-size-meta` | 11px | 11px |
| Font weight | `--font-weight-meta` | 500 | 500 |
| Letter spacing | `--tracking-uppercase` | 0.06em | 0.06em |
| Border radius (dot) | `--radius-round` | 50% | 50% |
| Animation duration | 1.4s | — | — (no token; fixed by Island cadence spec) |
| Pulse easing | ease-in-out | — | — |

Note on animation duration: `1.4s` is a fixed structural value tied to the Dynamic Island cadence. No `--motion-*` token maps to this cadence; `--motion-slow` (360ms) is a transition token, not a loop period. The 6px dot dimension is similarly structural geometry with no spacing-token equivalent.

## Accessibility

- Wrap in `<div role="status" aria-live="polite">` so screen readers announce label text changes (e.g., transitioning from STREAMING to PENDING).
- Dormant variant: add `aria-hidden="true"` on the wrapper — no state information to convey when idle.
- The dot element itself carries `aria-hidden="true"` in all variants (decorative; label carries the meaning).
- Color is not the sole differentiator: animation presence/absence provides a second channel for live vs. paused.
- `prefers-reduced-motion`: pulse animation suppressed; mint glow retained so the live state remains spatially distinguishable without motion.

## Relation to `status-dot`

| | `status-dot` | `live-activity-dot` |
|---|---|---|
| Label | Optional (external, not composed) | Always paired, part of the atom |
| Sizes | xs / sm / md | Fixed 6px only |
| Variants | live / warning / danger / success / neutral | live / paused / dormant |
| Context | General UI (lists, badges, titles) | Dynamic Island only |
| Typography | None (dot only) | Uppercase mono, `--font-size-meta` |
