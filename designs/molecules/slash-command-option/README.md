# mol-slash-command-option

A single tappable row inside the slash-command popover. Displays a slash-prefixed command name in accent-tinted monospace, a plain-text description, and an optional source-tag badge. Navigation is keyboard-accessible via arrow keys within a `role="listbox"` popover parent.

---

## Anatomy

```
┌──────────────────────────────────────────────────────────────┐
│  [body]                                                       │
│  /model  [BUILT-IN]                                          │
│  Switch model                                                 │
└──────────────────────────────────────────────────────────────┘
```

| Slot | Element | Notes |
|------|---------|-------|
| `__body` | Vertical flex column for row-1 + description | `flex: 1; min-width: 0` |
| `__row-1` | Inline flex: name + source badge | `align-items: center; gap: --space-2` |
| `__name` | Command name "/model" | Uses `.type-code` typography + `--accent-primary` color |
| `__source` | Source-tag badge | `atom-badge atom-badge--neutral atom-badge--sm` (builtin) or `atom-badge--accent` (project) or `atom-badge--live` (user) |
| `__description` | Short description text | `.type-body-sm` color `--text-muted` |
| `__loading` | Animated progress-dots (loading state) | `atom-progress-dots atom-progress-dots--sm atom-progress-dots--muted`; visible only with `.is-loading` |

---

## Atoms used

| Atom | Class string | Role |
|------|-------------|------|
| `atom-badge` | `atom-badge atom-badge--neutral atom-badge--sm` | Source tag — builtin |
| `atom-badge` | `atom-badge atom-badge--accent atom-badge--sm` | Source tag — project |
| `atom-badge` | `atom-badge atom-badge--live atom-badge--sm` | Source tag — user |
| `atom-progress-dots` | `atom-progress-dots atom-progress-dots--sm atom-progress-dots--muted` | Loading state indicator (trailing) |

Typography utility classes from `type-modules.css`:
- `.type-code` — command name (`/model`)
- `.type-body-sm` — description text

The optional leading icon slot uses `atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--accent` or `atom-icon-glyph--muted` directly as a sibling of `__body`.

---

## Variants (source)

| Class modifier | Badge | Use case |
|----------------|-------|----------|
| `mol-slash-command-option--builtin` (default) | `atom-badge--neutral` "BUILT-IN" | Framework-provided commands (`/model`, `/plan`, `/review`, `/stop`, `/clear`) |
| `mol-slash-command-option--project` | `atom-badge--accent` "PROJECT" | Project-level `.claude/commands/` |
| `mol-slash-command-option--user` | `atom-badge--live` "USER" | User-level `~/.claude/commands/` |

---

## States

| Class | Visual |
|-------|--------|
| default | `background: transparent` |
| `is-hover` / `:hover` | `background: var(--surface-soft)` |
| `is-highlighted` | `background: var(--surface-active)` — arrow-key focus |
| `is-focus` / `:focus-visible` | 2px inset `--border-focus` ring |
| `is-loading` | `__loading` dots appear at trailing; `pointer-events: none` |

`is-highlighted` and `is-hover` may coexist; hover surface-soft lightens the active tint.

---

## Token recipe

| Property | Token | Notes |
|----------|-------|-------|
| Row padding | `--space-3` v / `--space-4` h | — |
| Min-height | `--touch-target-min` | 44pt iOS HIG |
| Row gap (icon → body) | `--space-3` | — |
| Row-1 gap (name → badge) | `--space-2` | — |
| Body column gap | `--space-half` | Sub-token gap between row-1 and description |
| Name color | `--accent-primary` | Accent-tinted command name |
| Name font-weight | `--font-weight-meta` | Semi-bold 500 |
| Description color | `--text-muted` | Muted secondary text |
| Hover background | `--surface-soft` | — |
| Highlighted background | `--surface-active` | Keyboard nav |
| Focus ring | `--border-focus` | inset 2px |
| Transition | `background-color var(--motion-fast) var(--motion-ease-out)` | — |
| Tap highlight | `transparent` | `-webkit-tap-highlight-color` |

### TOKEN_GAPs

1. `gap: var(--space-half)` in `__body` between row-1 and description — uses `--space-half` (2px), which is a defined sub-scale token. No gap.

---

## Accessibility

- The molecule is a `<button role="option" aria-selected="true|false">` inside a `role="listbox"` popover.
- `aria-label` encodes both name and description: `"/model — Switch model"`.
- `aria-selected` reflects keyboard-highlighted state; not used for mouse hover.
- The source badge is `aria-hidden="true"` — source provenance is decorative.
- The loading dots are `aria-hidden="true"`; loading state should be communicated via `aria-busy="true"` on the parent listbox.
- A category divider between sections uses `atom-divider--horizontal atom-divider--hairline` with a `atom-section-label--with-rule` label — both are `aria-hidden="true"` (presentational).

---

## Usage context

```html
<!-- Parent listbox — popover trigger owns role="listbox" -->
<div role="listbox" aria-label="Slash commands" aria-activedescendant="cmd-model">

  <!-- Built-in command -->
  <button id="cmd-model"
          class="mol-slash-command-option mol-slash-command-option--builtin is-highlighted"
          role="option" aria-selected="true"
          aria-label="/model — Switch model">
    <span class="mol-slash-command-option__body">
      <span class="mol-slash-command-option__row-1">
        <span class="mol-slash-command-option__name type-code">/model</span>
        <span class="atom-badge atom-badge--neutral atom-badge--sm mol-slash-command-option__source"
              aria-hidden="true">BUILT-IN</span>
      </span>
      <span class="mol-slash-command-option__description type-body-sm">Switch model</span>
    </span>
  </button>

  <!-- Section divider -->
  <div class="mol-slash-command-option__divider-row" aria-hidden="true">
    <span class="atom-section-label atom-section-label--with-rule">custom</span>
  </div>

  <!-- Project command -->
  <button class="mol-slash-command-option mol-slash-command-option--project"
          role="option" aria-selected="false"
          aria-label="/typecheck — Run TypeScript type-check on workspace">
    …
  </button>

</div>
```
