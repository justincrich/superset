# atom · avatar

Round avatar representing a named actor (user, assistant, or generic tool). Appears adjacent to chat messages, in conversation lists, and in session headers. The atom owns shape, sizing, color, and indicator contracts — content (initial letter or icon SVG) is supplied by the caller.

---

## Anatomy

```html
<!-- Initial avatar (default variant) -->
<div class="atom-avatar atom-avatar--initial atom-avatar--sm"
     aria-label="Justin Rich"
     role="img">
  J
</div>

<!-- Accent avatar (assistant brand tint) -->
<div class="atom-avatar atom-avatar--accent atom-avatar--sm"
     aria-label="Assistant"
     role="img">
  A
</div>

<!-- Icon avatar (SVG stand-in) -->
<div class="atom-avatar atom-avatar--icon atom-avatar--sm"
     aria-label="Tool"
     role="img">
  <svg class="atom-icon-glyph" viewBox="0 0 24 24" fill="none"
       stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
    <!-- lucide path data -->
  </svg>
</div>

<!-- Active-speaker ring -->
<div class="atom-avatar atom-avatar--initial atom-avatar--sm atom-avatar--ring"
     aria-label="Justin Rich"
     role="img">
  J
</div>

<!-- Live-indicator dot -->
<div class="atom-avatar atom-avatar--accent atom-avatar--sm atom-avatar--live-indicator"
     aria-label="Assistant (streaming)"
     role="img">
  A
</div>

<!-- Decorative avatar next to a labeled message — suppress duplicate announcement -->
<div class="atom-avatar atom-avatar--initial atom-avatar--sm"
     aria-hidden="true">
  J
</div>
```

The host element carries all atom classes. The initial letter is a text node child. For icon variants the child is an `<svg>` sized via `atom-icon-glyph--{size}` (see icon-glyph atom).

---

## Variants

| Class | Background | Text/Icon color | Use case |
|---|---|---|---|
| `atom-avatar--initial` *(default)* | `--surface-soft` | `--text-body` | Single-letter initial — user ("J") or generic actor |
| `atom-avatar--accent` | `--accent-primary` | `--accent-primary-fg` | Brand-tinted — assistant in prominent surfaces |
| `atom-avatar--icon` | `--surface-soft` | `--text-muted` | Icon stand-in (tool, bot, anonymous actor) |

---

## Sizes

| Class | Diameter | Font size (initial) | Inner icon size |
|---|---|---|---|
| `atom-avatar--xs` | 20 px | `--font-size-meta` (11 px) | 12 px (`--xs` glyph) |
| `atom-avatar--sm` *(default)* | 28 px | `--font-size-label` (12 px) | 16 px (`--sm` glyph) |
| `atom-avatar--md` | 36 px | `--font-size-body` (15 px) | 20 px (`--md` glyph) |
| `atom-avatar--lg` | 48 px | `--font-size-section-title` (18 px) | 24 px (`--lg` glyph) |

Diameter values (20/28/36/48) are structural per-size literals — permitted under the token audit because they are keyed to the size class, not repeated inline.

---

## Modifiers

| Class | Effect |
|---|---|
| `atom-avatar--ring` | 2 px outer ring in `--accent-primary` separated from avatar by 2 px gap in `--surface-page`. Used to highlight the active speaker in a turn. |
| `atom-avatar--live-indicator` | 8 px dot (color `--state-live-fg`) anchored at bottom-right via `::after`, separated from avatar by a 2 px halo in `--surface-page`. Paired with streaming state. |

Both modifiers may be combined on the same element.

---

## States

| Selector / class | Visual |
|---|---|
| Default | Full opacity, normal appearance |
| `.is-disabled` | `opacity: 0.5` — pointer events preserved (avatar itself is non-interactive; disable at the interactive ancestor) |

---

## Token recipe

| Property | Token |
|---|---|
| `border-radius` | `--radius-round` |
| `font-family` | `--font-body` |
| `font-weight` | `--font-weight-meta` |
| Background (`--initial`) | `--surface-soft` |
| Color (`--initial`) | `--text-body` |
| Background (`--accent`) | `--accent-primary` |
| Color (`--accent`) | `--accent-primary-fg` |
| Background (`--icon`) | `--surface-soft` |
| Color (`--icon`) | `--text-muted` |
| Ring shadow | `--surface-page` (gap), `--accent-primary` (ring) |
| Live dot | `--state-live-fg` |
| Live dot halo | `--surface-page` |

---

## Accessibility

- **Always provide `aria-label`** describing the actor: `aria-label="Justin Rich"`, `aria-label="Assistant"`, `aria-label="Tool"`.
- **Add `role="img"`** on the host element when the avatar is the sole semantic representation of the actor.
- **When the avatar accompanies a labeled message** (the message already announces the sender), set `aria-hidden="true"` on the avatar element to prevent duplicate screen-reader announcements.
- **Initial-only avatars** still need `aria-label` — a single letter is not self-describing.
- **Icon avatars** require a descriptive `aria-label` matching the tool or actor purpose: `aria-label="Bot"`, `aria-label="Tool"`.
- **Live-indicator modifier** — if streaming state is meaningful to the user, reflect it in the label: `aria-label="Assistant (streaming)"`. Do not rely on the visual dot alone.
- **Ring modifier** — active-speaker state should be conveyed via a surrounding accessible container (e.g., `aria-live` region or list item label), not the avatar ring alone.
- **Minimum touch target**: avatars are decorative in message rows. Interactive uses (tapping to view profile) must wrap the avatar in a `<button>` with `min-width: var(--touch-target-min)` and `min-height: var(--touch-target-min)`.
