# mol-collapsed-block

## Purpose

A collapsible block that wraps agent-generated structured content behind a native `<details>`/`<summary>` expander. Covers three related use cases from UC-RENDER-05 and UC-RENDER-06:

- **PlanBlock** — the agent's proposed plan (step list) with a sparkles icon
- **ReasoningBlock** — the agent's extended thinking trace with a brain icon
- **SubagentExecutionMessage** — a nested summary of a sub-agent's run, indented with a left accent rule and bot icon

All three share the same structure: leading icon + uppercase label + optional meta string + trailing chevron + optional collapsed-preview body. The `--plan` variant is the default; the `--reasoning` and `--subagent` variants differ only in icon, label text, accent rule, and indent.

The `<details>`/`<summary>` semantic elements provide native expand/collapse behavior — no JavaScript required for the toggle. The molecule layers visual affordance (chevron rotation, preview reveal) on top of the native behavior via CSS `[open]` selector.

---

## Anatomy

```
┌─────────────────────────────────────────────────────────────────────┐
│ [★]  PLAN  ·  12 steps · 1m est                           [chevron] │  ← summary (always visible)
├─────────────────────────────────────────────────────────────────────┤  ← hairline divider (when open)
│ 1. Locate the reconnect backoff constant …                          │  ← preview body (when open)
│ 2. Replace 250ms with exponential backoff …                         │
│ 3. Preserve inner try/catch …                                       │
│ 4. Add unit tests for the backoff schedule …                        │
└─────────────────────────────────────────────────────────────────────┘
```

| Slot | Element | Atom(s) |
|------|---------|---------|
| Leading icon | `svg.atom-icon-glyph.atom-icon-glyph--sm` + color modifier | `atom-icon-glyph` |
| Label | `span.atom-section-label.atom-section-label--strong` | `atom-section-label` |
| Meta | `span.atom-section-label` (default/muted) | `atom-section-label` |
| Chevron | `svg.atom-icon-glyph.atom-icon-glyph--xs.atom-icon-glyph--muted` | `atom-icon-glyph` |
| Divider (header/body boundary) | border-top on `__preview` (hairline, `var(--border-subtle)`) | `atom-divider` (inline rule, not standalone element) |
| Left accent rule (subagent only) | `border-left` on `.mol-collapsed-block--subagent` | `atom-tool-status-rule` (pattern — applied via border, not element) |
| Preview body text | `p.type-body-sm` inside `__preview` | typography token |

---

## Variants

| BEM modifier | Icon | Label | Accent rule | Icon color | Use case |
|---|---|---|---|---|---|
| `--plan` (default) | sparkles | "PLAN" | none | `--accent` | Agent's proposed step list |
| `--reasoning` | brain | "REASONING" | none | `--muted` | Agent's extended thinking trace |
| `--subagent` | bot | "SUBAGENT" | neutral left rule + `margin-left: var(--space-6)` | `--muted` | Nested sub-agent invocation summary |

The `--subagent` variant carries `border-left: var(--domain-tool-rule-width) solid var(--text-muted)` and a left margin indent, echoing the `atom-tool-status-rule--vertical` neutral pattern.

---

## States

| State | Trigger | Visual effect |
|---|---|---|
| `default` (collapsed) | initial render | `__preview` hidden (native `<details>` behavior); chevron points down |
| `is-open` / `[open]` | user tap/click on `<summary>` | `__preview` revealed; chevron rotates 180° via CSS `[open]` selector |
| `is-hover` | pointer hover on `<summary>` | `background: var(--surface-soft)` on summary |
| `is-focus` | keyboard focus on `<summary>` | `outline: 2px solid var(--border-focus)` inset on summary |

---

## `<details>`/`<summary>` Semantics

`<details>` is the containing collapsible element. Its `open` attribute is toggled natively by the browser when the user activates `<summary>`. The CSS `[open]` selector drives the chevron rotation and preview visibility — no JS required.

`<summary>` is the only focusable/interactive tabstop in the molecule. Screen readers announce it as a disclosure widget. The `open` state is communicated natively via the `<details>` element's `open` attribute.

The `<summary>::-webkit-details-marker` is suppressed so the browser's default arrow does not appear alongside the custom chevron SVG.

---

## Atoms used

| Atom | Import path | Modifier classes used |
|---|---|---|
| `atom-icon-glyph` | `../_atoms.css` | `--sm` + `--accent` (plan leading icon); `--sm` + `--muted` (reasoning/subagent leading icon); `--xs` + `--muted` (chevron) |
| `atom-section-label` | `../_atoms.css` | `--strong` (label text); default/muted (meta text) |
| `atom-divider` | `../_atoms.css` | pattern: `border-top: 1px solid var(--border-subtle)` inline on `__preview` (hairline) |
| `atom-tool-status-rule` | `../_atoms.css` | pattern: neutral `border-left` on `--subagent` variant; `var(--domain-tool-rule-width)` and `var(--text-muted)` |

---

## Token recipe

| Property | Token | Role |
|---|---|---|
| Block background | `--surface-raised` | card surface |
| Block border | `1px solid var(--border-subtle)` | card outline |
| Block border-radius | `--radius-default` | rounded card |
| Summary min-height | `--touch-target-min` | 44px minimum tap target |
| Summary gap | `--space-2` | spacing between icon/label/meta/chevron |
| Summary padding | `--space-3` block, `--space-4` inline | internal breathing room |
| Summary hover background | `--surface-soft` | hover state |
| Preview padding | `--space-4` inline, `--space-3` top, `--space-4` bottom | preview body inset |
| Preview text color | `--text-muted` | secondary body text |
| Preview top rule | `var(--border-subtle)` | hairline separator |
| Chevron transition | `var(--motion-fast)` + `var(--motion-ease-out)` | open/close animation |
| Subagent left rule width | `--domain-tool-rule-width` | 3px accent rule |
| Subagent left rule color | `--text-muted` | neutral rule |
| Subagent indent | `--space-6` | left margin for visual nesting |
| Focus ring | `2px solid var(--border-focus)` | keyboard focus outline |

TOKEN_GAPs:
- None. All values resolved to existing design tokens.

---

## Accessibility

- `<details>`/`<summary>` provide native expand/collapse keyboard support: Space and Enter toggle open/closed. No ARIA roles required.
- The `<details>` element's `open` attribute is natively announced by assistive technologies as a disclosure widget.
- `<summary>` is the single tabstop. All other content inside `<details>` is hidden from the tab order when collapsed (native browser behavior).
- The leading icon SVG and chevron SVG carry `aria-hidden="true"` — the `<summary>`'s text content provides the accessible name.
- The `<details>` element carries an `aria-label` describing the block type and meta (e.g., `"Agent plan, 12 steps"`) for screen readers that expose the disclosure widget role.
- `<summary>::-webkit-details-marker` is suppressed; a custom chevron SVG provides the visual affordance.
- `prefers-reduced-motion`: the chevron rotation transition is governed by `var(--motion-fast)` which resolves to `none` when the OS reduces motion.
