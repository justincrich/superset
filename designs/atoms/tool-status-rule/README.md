# atom · tool-status-rule

A 3px-wide colored bar placed on the edge of a card/block to encode its semantic tool-call status. Used as a left-edge accent by ToolCallBlock, PlanBlock, ReasoningBlock, and PendingApprovalCard, and as a top-edge accent on full-width approval footers.

This atom is the rule only — it carries no text, no icon, and no interactive affordance. The card molecule that composes it is responsible for pairing the rule color with a text label and/or icon so that color is never the sole communication channel.

## Anatomy

```
.atom-tool-status-rule               ← the bar itself (aria-hidden="true")
  [no children]
```

The element is a single self-contained block. No child elements are needed.

## Variants (status × orientation)

### Status variants (5)

| Modifier class | Color token | Resolved dark | Use case |
|---|---|---|---|
| `--running` (default) | `--state-live-fg` | `#50a878` mint | Tool actively executing |
| `--done` | `--state-success-fg` | `#50a878` green | Tool completed successfully |
| `--pending` | `--state-warning-fg` | `#d4a84b` amber | Awaiting approval |
| `--error` | `--state-danger-fg` | `#cc4444` red | Tool failed |
| `--neutral` | `--text-muted` | `#a8a5a3` gray | Default / idle / archived |

Note: `--state-success-fg` and `--state-live-fg` both alias `--_green` in the current token set — they share the same resolved value. They are kept as separate semantic tokens because their meaning differs and the primitives may diverge.

### Orientation variants (2)

| Modifier class | Geometry | Sizing property |
|---|---|---|
| `--vertical` (default) | `var(--domain-tool-rule-width)` wide × `align-self: stretch` | Width = token; height fills flex cell |
| `--horizontal` | `100%` wide × `var(--domain-tool-rule-width)` tall | Height = token; width fills container |

## States

None — the rule is purely decorative. No hover, focus, or active states.

## Token recipe

| Property | Token | Dark resolved | Light resolved | Notes |
|---|---|---|---|---|
| Width (vertical) | `--domain-tool-rule-width` | 3px | 3px | Canonical thickness; never use a literal |
| Height (horizontal) | `--domain-tool-rule-width` | 3px | 3px | Same token, applied to height |
| Background (running) | `--state-live-fg` | `#50a878` | `oklch(0.6 0.118 184.704)` | Mint; with `box-shadow: 0 0 6px` glow |
| Background (done) | `--state-success-fg` | `#50a878` | `oklch(0.6 0.118 184.704)` | No glow |
| Background (pending) | `--state-warning-fg` | `#d4a84b` | `oklch(0.398 0.07 227.392)` | Amber; with `box-shadow: 0 0 4px` glow |
| Background (error) | `--state-danger-fg` | `#cc4444` | `oklch(0.577 0.245 27.325)` | Red; no glow |
| Background (neutral) | `--text-muted` | `#a8a5a3` | `oklch(0.556 0 0)` | No glow |
| Border radius | `--radius-subtle` | `calc(0.625rem - 4px)` ≈ 6px | same | Softens the bar's corners |
| Min-height (vertical) | `--space-6` | 24px | 24px | Prevents degenerate single-line collapse |

## Accessibility

The rule is purely decorative. Always set `aria-hidden="true"` on the rule element itself.

Semantic status MUST also be communicated via text and/or icon in the parent card — for example, a label reading "Running · Bash" adjacent to a `--running` rule. Color contrast is moot for the rule itself because the rule color is always paired with a same-color text/icon that carries the semantic meaning for users who cannot perceive color.

```html
<!-- Correct: rule is hidden; card label carries the meaning -->
<div class="tool-card" style="display: flex; gap: var(--space-3);">
  <div class="atom-tool-status-rule atom-tool-status-rule--vertical atom-tool-status-rule--running"
       aria-hidden="true"></div>
  <div class="tool-card__body">
    <span class="tool-card__status">Running</span>
    <span class="tool-card__name">npm run test</span>
  </div>
</div>
```

## Usage rules

1. **Do not use a literal `3px`** — always reference `var(--domain-tool-rule-width)` so future token changes propagate.
2. **Vertical rule requires a flex parent** — the rule uses `align-self: stretch` to fill the parent's cross-axis height. The parent must be `display: flex` with `flex-direction: row`.
3. **Horizontal rule requires `width: 100%` context** — place it as the first child in a block-direction container.
4. **Pair with text** — never use the rule color as the only status signal.
