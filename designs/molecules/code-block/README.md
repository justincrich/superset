# mol-code-block

A fenced code block rendered inside assistant messages (UC-RENDER-03 §A). Composes atoms to form a self-contained code display with a language label header, a Copy affordance, a hairline divider, and a syntax-highlighted monospace body. Long-press on the body also copies the full content on mobile; the explicit Copy button is the primary affordance.

---

## Purpose

- Display code fences from markdown rendering inside the chat message stream
- Provide a one-tap Copy affordance that gives brief `is-copied` feedback
- Support internal vertical scroll for long code blocks (`is-overflow`)
- Surface language identity via a faint mono uppercase label
- Inline variant (`mol-code-block__inline`) for `<code>` spans inside prose

---

## Anatomy

```html
<figure class="mol-code-block mol-code-block--default">
  <header class="mol-code-block__head">
    <span class="atom-section-label atom-section-label--muted mol-code-block__lang">typescript</span>
    <button class="atom-icon-button atom-icon-button--ghost atom-icon-button--xs mol-code-block__copy"
            aria-label="Copy code">
      <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted" aria-hidden="true">…copy…</svg>
      <span class="atom-section-label atom-section-label--faint">Copy</span>
    </button>
  </header>
  <hr class="atom-divider atom-divider--horizontal atom-divider--hairline">
  <pre class="mol-code-block__body type-code"><code>export const billing =
  router({
    getInvoice: publicProcedure
      .input(z.string())
      .query(({ input }) =&gt; db.invoice.find(input)),
  });</code></pre>
</figure>
```

**`is-copied` state** — Copy button briefly shows check + "Copied":
```html
<button class="atom-icon-button atom-icon-button--ghost atom-icon-button--xs mol-code-block__copy is-copied"
        aria-label="Copy code" aria-live="polite">
  <!-- check icon replaces copy icon -->
  <span class="atom-section-label atom-section-label--faint">Copied</span>
</button>
```

**`is-overflow` state** — add class to `<figure>`:
```html
<figure class="mol-code-block mol-code-block--default is-overflow">
```

**Inline code** — prose-level `<code>` element:
```html
<code class="type-code mol-code-block__inline">npm run test</code>
```

---

## Variants

| Class | Effect |
|---|---|
| `mol-code-block--default` | Sunken background + hairline border |
| `mol-code-block--bare` | No border, sunken background only — tighter inline context |

---

## States

| Class | Visual effect |
|---|---|
| `default` | Resting state |
| `is-copied` | Copy button swaps to check icon + "Copied" label text; brief green-tinted feedback via `--state-live-fg` color on glyph |
| `is-overflow` | Body exceeds 320px — internal `overflow-y: auto` scrollbar engaged |

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-section-label` | `--muted` (default) / `--faint` | Language label ("TYPESCRIPT") and Copy button label |
| `atom-icon-button` | `--ghost --xs` | Copy button container — 28×28, ghost tap target |
| `atom-icon-glyph` | `--xs --muted` / `--xs --live` (is-copied) | Copy icon (copy) / Copied icon (check) |
| `atom-divider` | `--horizontal --hairline` | Hairline rule between header and body |

---

## Syntax highlight helpers (molecule-local)

Inline `<span>` wrappers applied to token types inside `<code>`. Decorative only — no semantic content changes.

| Class | Color token | Token types |
|---|---|---|
| `.mol-code-block__kw` | `var(--accent-primary)` | `export`, `const`, `return`, `async`, `await` |
| `.mol-code-block__str` | `var(--state-live-fg)` | String literals |
| `.mol-code-block__fn` | `var(--state-warning-fg)` | Function / method names |
| `.mol-code-block__cmt` | `var(--text-faint)` | Comments |

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `background` | `var(--surface-sunken)` | Recessed, distinct from message bg |
| `border` | `1px solid var(--border-subtle)` | Hairline container stroke |
| `border-radius` | `var(--radius-default)` | Matches card-level rounding |
| `padding` header | `var(--space-2) var(--space-3)` | 8px block, 12px inline |
| `padding` body | `var(--space-3) var(--space-4)` | 12px block, 16px inline |
| `gap` copy button inner | `var(--space-1)` | 4px between icon and label |
| `max-height` body | `320px` | Structural — prose-height budget; TOKEN_GAP (see below) |
| `color` body text | `var(--text-body)` | Via `.type-code` |

**TOKEN_GAP**: `max-height: 320px` — the 320px overflow threshold is below any token scale mapping. Used as a structural geometry constant representing approximately 20 lines of code at the default line-height. Consistent with other fixed-height viewport-budget values in the codebase.

---

## Accessibility

- `<figure>` is the semantic wrapper — it groups the caption-like header with its body content.
- Copy `<button>` carries `aria-label="Copy code"` — screen readers announce the action regardless of visible label changes.
- `is-copied` state: the button should receive `aria-live="polite"` so the "Copied" label change is announced without interrupting the reading flow.
- Syntax-highlight `<span>` elements are entirely decorative — they carry no `role` or `aria-*` and do not alter the spoken text content.
- `<pre><code>` ensures proper whitespace preservation and semantic markup for assistive tech.
- Long-press to copy is owned by the parent organism (not this molecule) — no additional ARIA required here.
- `overflow-x: auto` on `__body` ensures wide code lines scroll rather than overflowing the viewport on narrow screens.
