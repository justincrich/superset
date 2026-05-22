# atom · kbd

Keyboard glyph atom. Renders a single key or modifier symbol with a physical keycap appearance. Used in shortcut hints, slash-command preview popovers, and the desktop HotkeyMenuShortcut surface.

---

## Anatomy

```
┌─────────────┐
│  ⌘          │  ← .atom-kbd
│             │     background: --surface-soft (default)
│             │     border: 1px solid --border-default
│             │     border-radius: --radius-subtle
└─────────────┘
```

Single element — no children. Content is the key glyph (Unicode symbol or short text).

Multi-key chords are composed as **separate `<kbd>` elements** joined by a plain `+` text node:

```html
<kbd class="atom-kbd atom-kbd--default atom-kbd--sm">⌘</kbd>
<span class="atom-kbd-sep">+</span>
<kbd class="atom-kbd atom-kbd--default atom-kbd--sm">K</kbd>
```

Never wrap a chord inside a single `<kbd>` — that loses semantic structure and prevents screen readers from announcing each key individually.

---

## Variants

| Class | Background | Border | Text | Use |
|---|---|---|---|---|
| `atom-kbd--default` | `--surface-soft` | `1px solid --border-default` | `--text-muted` | General shortcut hints, popovers |
| `atom-kbd--inline` | `--surface-sunken` | `1px solid --border-subtle` | `--text-body` | Mid-sentence usage, prose contexts |
| `atom-kbd--strong` | `--surface-inverse` | none | `--text-on-inverse` | Primary-key emphasis, hotkey menus |

---

## Sizes

| Class | Font size | Padding | Border radius |
|---|---|---|---|
| `atom-kbd--sm` (default) | `--font-size-meta` (11px) | `--space-1` × `--space-2` | `--radius-subtle` |
| `atom-kbd--md` | `--font-size-label` (12px) | `--space-1` × `--space-2` | `--radius-subtle` |

---

## States

| Class / pseudo | Effect |
|---|---|
| default | Resting keycap appearance |
| `.is-pressed` / `:active` | `translateY(1px)` + background darkened via `color-mix` — simulates physical key depression |

The `is-pressed` class is a deterministic surrogate for use in previews and hotkey demonstration animations. It does not imply interactivity; `<kbd>` is a non-interactive element.

---

## Token recipe

| Property | Token |
|---|---|
| `background-color` (default) | `var(--surface-soft)` |
| `background-color` (inline) | `var(--surface-sunken)` |
| `background-color` (strong) | `var(--surface-inverse)` |
| `background-color` (pressed, default) | `color-mix(in oklch, var(--surface-soft) 80%, black 20%)` |
| `background-color` (pressed, inline) | `color-mix(in oklch, var(--surface-sunken) 80%, black 20%)` |
| `border` (default) | `1px solid var(--border-default)` |
| `border` (inline) | `1px solid var(--border-subtle)` |
| `border` (strong) | `none` |
| `color` (default) | `var(--text-muted)` |
| `color` (inline) | `var(--text-body)` |
| `color` (strong) | `var(--text-on-inverse)` |
| `font-family` | `var(--font-mono)` |
| `font-size` (sm) | `var(--font-size-meta)` |
| `font-size` (md) | `var(--font-size-label)` |
| `font-weight` | `var(--font-weight-meta)` |
| `letter-spacing` | `var(--tracking-mono)` |
| `line-height` | `var(--line-height-tight)` |
| `padding` (both sizes) | `var(--space-1) var(--space-2)` |
| `border-radius` (both sizes) | `var(--radius-subtle)` |
| `transform` (pressed) | `translateY(1px)` |
| `transition` | `transform var(--motion-fast) var(--motion-ease-out), background-color var(--motion-fast) var(--motion-ease-out)` |

---

## Accessibility

`<kbd>` is a native HTML semantic element. Screen readers announce its content as "keyboard input X" or similar, depending on the reader. No `role` or `aria-label` is needed for standalone keys.

**Chord composition rule**: Separate each key into its own `<kbd>` element. A single `<kbd>⌘+K</kbd>` loses the individual-key semantics that assistive technology relies on.

```html
<!-- Correct: separate elements -->
<kbd class="atom-kbd atom-kbd--default atom-kbd--sm">⌘</kbd>
<span class="atom-kbd-sep" aria-hidden="true">+</span>
<kbd class="atom-kbd atom-kbd--default atom-kbd--sm">K</kbd>

<!-- Wrong: single element for a chord -->
<kbd class="atom-kbd atom-kbd--default atom-kbd--sm">⌘+K</kbd>
```

The `+` separator is wrapped in `aria-hidden="true"` when it is purely decorative — the screen reader should announce "Command" then "K", not "Command plus K" where "plus" comes from visible text. If the context warrants announcing the separator (e.g., the sentence makes no sense without it), omit `aria-hidden`.

**Do not use `<button>` for keyboard glyphs.** `<kbd>` is display-only. If a shortcut label is part of an interactive row, the interactivity belongs to the row's container, not the `<kbd>` itself.
