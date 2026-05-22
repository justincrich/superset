# atom · divider

A token-governed visual separator. Renders as a full-width `<hr>` (horizontal) or an inline `<span>` (vertical). Zero hex literals — all color and spacing values resolve through CSS custom properties.

---

## Anatomy

### Horizontal form (`<hr>`)

```html
<hr class="atom-divider
           atom-divider--hairline
           atom-divider--horizontal
           atom-divider--gutter-none"
    role="separator"
    aria-orientation="horizontal">
```

The `<hr>` element carries its own implicit `role="separator"` in HTML. Provide `role="separator"` explicitly only when the element is decorative but still conveys section separation to assistive technology. Omit `aria-orientation` on horizontal dividers (it defaults to horizontal).

### Vertical form (`<span>`)

```html
<span class="atom-divider
             atom-divider--hairline
             atom-divider--vertical
             atom-divider--gutter-none"
      aria-hidden="true"></span>
```

Vertical dividers inside flex rows are always decorative — their meaning is conveyed by the spatial layout. Use `aria-hidden="true"` on every vertical divider.

---

## Variant tables

### Kind (color + weight)

| Class modifier | Border | Thickness | Typical use |
|---|---|---|---|
| `atom-divider--hairline` (default) | `var(--border-subtle)` | `1px` | Between message rows, list item separators |
| `atom-divider--default` | `var(--border-default)` | `1px` | Between sections on the same surface |
| `atom-divider--strong` | `var(--border-strong)` | `1px` | Between major panes, drawer boundaries |
| `atom-divider--accent` | `var(--accent-primary)` | `2px` | Selected-tab underline, focal separator |

### Orientation

| Class modifier | Element | Behavior |
|---|---|---|
| `atom-divider--horizontal` (default) | `<hr>` | `display: block`, `width: 100%`, `height: 0`, border on top edge |
| `atom-divider--vertical` | `<span>` | `display: inline-block`, `width: 1px` (2px for accent), `height: 100%`, `align-self: stretch` inside flex rows |

### Gutter (built-in margin)

Spacing is normally the parent's responsibility. Use gutter modifiers only when the divider is placed in a context where the parent cannot provide consistent margin.

| Class modifier | Horizontal divider | Vertical divider |
|---|---|---|
| `atom-divider--gutter-none` (default) | no margin | no margin |
| `atom-divider--gutter-sm` | `margin: var(--space-2) 0` | `margin: 0 var(--space-2)` |
| `atom-divider--gutter-md` | `margin: var(--space-4) 0` | `margin: 0 var(--space-4)` |

---

## Token recipe

| Property | Token | Resolves to |
|---|---|---|
| hairline color | `--border-subtle` | `--_neutral-4` (dark) / `--_neutral-border` (light) |
| default color | `--border-default` | `--_neutral-4` (dark) / `--_neutral-border` (light) |
| strong color | `--border-strong` | `--_neutral-5` both themes |
| accent color | `--accent-primary` | `--_ember` both themes |
| gutter-sm | `--space-2` | `8px` |
| gutter-md | `--space-4` | `16px` |
| thickness | `1px` / `2px` | structural constant — not a spacing token |

---

## Accessibility

- `<hr>` carries implicit `role="separator"` — no extra ARIA needed in most cases.
- For a purely decorative `<hr>` between visually-distinct regions where the separation is already obvious from heading hierarchy, add `role="presentation"` to remove it from the accessibility tree.
- Vertical `<span>` dividers are always `aria-hidden="true"` — they are decorative, and their positional meaning is conveyed by adjacent labelled elements.
- Accent dividers used as tab underlines must live inside a `role="tablist"` / `role="tab"` structure; the visual selection state is conveyed by `aria-selected`, not by the divider itself.
- Do not rely on divider color alone to convey meaning — the kind variants differ primarily in visual weight, not semantic category.
