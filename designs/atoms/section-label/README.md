# atom · section-label

A token-governed mono uppercase block label. Structurally a block-level element (`display: block`) that wraps `.type-meta` typography into a named, composable atom. Used wherever the UI needs a small, wide-tracked, all-caps mono label to title a region, row, or content block.

Distinct from `pill` and `badge`, which are inline. `section-label` is block-first; the `--inline` modifier is the override.

---

## Anatomy

```html
<h2 class="atom-section-label">
  SUPERSET · CHAT-MOBILE-PLAN
</h2>
```

The element is semantically a heading (`<h2>`, `<h3>`) in all structural roles. The heading level must follow document heading hierarchy. Decorative inline meta segments (e.g., `·` separators) use `aria-hidden="true"`. For purely presentational contexts where no heading semantics apply, a `<div>` or `<span>` with an appropriate ARIA label is acceptable.

---

## Variants

### Color variants

| Class | Color token | Typical use |
|---|---|---|
| _(default, no modifier)_ | `--text-muted` | Workspace section headers, standard meta rows |
| `atom-section-label--faint` | `--text-faint` | Secondary counts, de-emphasized labels |
| `atom-section-label--strong` | `--text-body` | Emphasized labels, code block type tags |

---

## Modifiers

| Class | Effect | Typical use |
|---|---|---|
| `atom-section-label--sticky` | `position: sticky; top: 0; background: var(--surface-page); padding-block: var(--space-2); z-index: 1` | Sessions-list workspace section headers that pin during scroll |
| `atom-section-label--with-rule` | Flex layout; appends a `::after` hairline rule (`1px`, `--border-subtle`) that grows to fill remaining space | Separator-style section labels ("STREAMING ───────") |
| `atom-section-label--inline` | `display: inline; padding-inline: var(--space-2)` | Segments inside a meta row ("SONNET 4.6 · MEDIUM · 0:24") |

---

## Token recipe

| Property | Token | Resolves to |
|---|---|---|
| `font-family` | `--font-mono` | Geist Mono, ui-monospace, SF Mono, monospace |
| `font-size` | `--font-size-meta` | `11px` |
| `font-weight` | `--font-weight-meta` | `500` |
| `letter-spacing` | `--tracking-uppercase` | `0.06em` |
| `line-height` | `--line-height-tight` | `1.15` |
| color (default / muted) | `--text-muted` | `--_neutral-fg-1` both themes |
| color (faint) | `--text-faint` | `--_neutral-fg-1` both themes |
| color (strong) | `--text-body` | `--_neutral-fg-0` both themes |
| sticky background | `--surface-page` | `--_neutral-0` both themes |
| sticky `padding-block` | `--space-2` | `8px` |
| inline `padding-inline` | `--space-2` | `8px` |
| with-rule gap | `--space-3` | `12px` |
| with-rule rule color | `--border-subtle` | `--_neutral-4` (dark) / `--_neutral-border` (light) |
| with-rule thickness | `1px` | structural constant — not a spacing token |

---

## Relationship to `.type-meta`

`.type-meta` in `type-modules.css` is the typographic recipe (font family, size, weight, tracking, line-height, transform, default color). `.atom-section-label` IS `.type-meta` applied to a block element, plus the block display contract, variant colors, and modifier behaviors. Do not apply both classes simultaneously — use `.atom-section-label` alone.

The key difference: `.type-meta` uses `--tracking-mono` (`0.02em`); `.atom-section-label` uses `--tracking-uppercase` (`0.06em`) to emphasize its labeling role with wider spacing.

---

## Accessibility

Section-labels function as headings within their region and must use the correct heading element (`<h2>`, `<h3>`, etc.) per the surrounding heading hierarchy.

- **Block section headers**: Use `<h2>` or `<h3>` as determined by document outline. Sticky labels announce as headings normally; `position: sticky` does not affect the accessibility tree.
- **Inline meta segments** inside `--inline` rows: When the entire meta row is labeled by a parent `aria-label`, individual segment labels may use `<span>` with no heading role. The decorative `·` separator between segments must have `aria-hidden="true"`.
- **Code block labels** ("TYPESCRIPT" above a code block): Use `<span>` (not a heading) — it labels the block, not a document section. Associate it with the code block via `aria-label` on the code container or adjacency.
- **Empty-state captions** ("NO SESSIONS YET"): Use a heading element at the appropriate level, or a `role="status"` container if it announces dynamically.
- **Purely decorative inline meta row**: If the label text adds no information not already in the visual context and parent ARIA label, mark with `aria-hidden="true"`.

Color contrast: `--text-muted` / `--text-faint` at `11px` / `500` weight will not achieve WCAG AA for body text. Section-labels are structural/ornamental labels, not primary content — confirm with design if WCAG AA is required for a specific usage. Use `--strong` variant (maps to `--text-body`) where higher contrast is needed.
