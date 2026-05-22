# atom · text-input

Single-line text field. Token-governed. Mobile-tuned to 44pt minimum touch target.

Used in: rename-session modal, search bar (molecule wrapper adds icon + pill chrome), generic form fields, inline editable session-row title.

---

## Anatomy

```
┌─ .atom-text-input-wrap ─────────────────────────────────────────┐
│  [leading-icon]  [input.atom-text-input]  [trailing-clear / ...]│
└─────────────────────────────────────────────────────────────────┘
```

| Element | Selector | Notes |
|---|---|---|
| Outer wrapper | `.atom-text-input-wrap` | `display: flex; align-items: center` — hosts icon slots |
| Input | `input.atom-text-input` | The real `<input type="text">` — carries variant + size + state classes |
| Leading icon slot | `.atom-text-input-wrap.atom-text-input--with-leading-icon .atom-text-input-icon` | 16×16 icon, `color: var(--text-faint)` |
| Trailing clear | `.atom-text-input-wrap.atom-text-input--with-trailing-clear .atom-text-input-clear` | Shown only when value is present; `×` glyph button |
| Loading spinner | `::after` pseudo on `.is-loading` wrapper | 14px rotating circle |

Wrapper carries all variant/size/state modifier classes so icon slots inherit the correct context. The inner `<input>` receives `class="atom-text-input atom-text-input--{variant} atom-text-input--{size} type-body"` — the `type-body` class provides all font properties from `type-modules.css`.

---

## Variants

| Class | Background | Border | Canonical use |
|---|---|---|---|
| `atom-text-input--default` | `var(--surface-soft)` | `1px solid var(--border-default)` | Form fields, modal inputs |
| `atom-text-input--inset` | `var(--surface-sunken)` | none | Search bars, inline edits on sunken surfaces |
| `atom-text-input--bare` | transparent | none | Editable session-row title (inherits row bg) |

---

## Sizes

| Class | Height | Padding-X | Font source |
|---|---|---|---|
| `atom-text-input--sm` | 36px | `var(--space-3)` | `--font-size-body-sm` via type override |
| `atom-text-input--md` *(default)* | `var(--touch-target-min)` (44px) | `var(--space-4)` | `--font-size-body` via `.type-body` |
| `atom-text-input--lg` | 56px | `var(--space-5)` | `--font-size-body` via `.type-body` |

`--md` is the mobile default — it satisfies WCAG AA 44pt touch target and iOS HIG minimum.

---

## States

| Class / pseudo | Visual treatment |
|---|---|
| default (empty) | Placeholder at `color: var(--text-faint)` |
| `is-typing` (value present) | Text at `color: var(--text-body)` |
| `:focus-visible` / `.is-focus` | `box-shadow: 0 0 0 2px var(--border-focus)` + `border-color: var(--border-focus)` |
| `.is-error` | `border-color: var(--state-danger-fg)` + `box-shadow: 0 0 0 2px color-mix(in oklch, var(--state-danger-fg) 30%, transparent)` |
| `.is-disabled` | `opacity: 0.5; pointer-events: none` |
| `.is-loading` | `aria-busy="true"` on wrapper; trailing spinner via `::after` (14px, `--motion-slow` rotation) |

---

## Token Recipe

| Property | Token |
|---|---|
| `background` (default) | `var(--surface-soft)` |
| `background` (inset) | `var(--surface-sunken)` |
| `background` (bare) | `transparent` |
| `border` (default) | `1px solid var(--border-default)` |
| `border-radius` | `var(--radius-default)` |
| `color` (value) | `var(--text-body)` |
| `color` (placeholder) | `var(--text-faint)` |
| `height` (md) | `var(--touch-target-min)` |
| `padding-inline` (md) | `var(--space-4)` |
| `padding-inline` (sm) | `var(--space-3)` |
| `padding-inline` (lg) | `var(--space-5)` |
| `padding-inline-start` (with icon) | `var(--space-8)` (icon 16px + gap `var(--space-2)` + base padding) |
| focus ring | `box-shadow: 0 0 0 2px var(--border-focus)` |
| error ring | `box-shadow: 0 0 0 2px color-mix(in oklch, var(--state-danger-fg) 30%, transparent)` |
| icon color | `var(--text-faint)` |
| clear button color | `var(--text-muted)` |
| transition | `all var(--motion-fast) var(--motion-ease-out)` |
| font | via `.type-body` class — `var(--font-body)` / `var(--font-size-body)` |
| font (sm size override) | `var(--font-size-body-sm)` |

---

## Accessibility

- Every input **must** have either a `<label for="{id}">` paired with the input's `id`, or an `aria-label` attribute when a visible label is not shown.
- Error state: set `aria-invalid="true"` on the input; add an adjacent `<p id="{id}-error" role="alert">` with the error message; link it via `aria-describedby="{id}-error"` on the input.
- Loading state: set `aria-busy="true"` on the wrapper element.
- Disabled state: set `disabled` on the `<input>` element (not just the CSS class) so assistive technology skips it correctly.
- Placeholder text is not a substitute for a visible label — it disappears on focus and is not reliably announced by screen readers.
- Clear button must have `aria-label="Clear"` (or locale-equivalent) and `type="button"` to prevent accidental form submission.
