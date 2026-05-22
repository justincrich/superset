# mol-search-bar

A session-search bar that filters the sessions list by case-insensitive title contains-match across workspaces. Composes `atom-text-input` (inset variant with leading-icon and trailing-clear slots), `atom-icon-glyph` (search + ✕), and `atom-hit-target-wrapper` (circle, 44pt tap zone for the clear button).

---

## Purpose

- Renders above the sessions list as the primary filter entry point (UC-NAV-07)
- Emits a case-insensitive title `contains-match` query on every keystroke
- Clear button (✕) appears only when the field is populated (`is-typing` state)
- 44pt minimum hit target for both input focus area and clear button
- Three layout variants cover sessions-list, sheet-header, and command-palette contexts

---

## Anatomy

```html
<form class="mol-search-bar" role="search">
  <label class="mol-search-bar__label sr-only" for="session-search">Search sessions</label>
  <div class="mol-search-bar__wrap atom-text-input--with-leading-icon atom-text-input--with-trailing-clear">
    <span class="mol-search-bar__leading" aria-hidden="true">
      <!-- atom-icon-glyph sm muted: search -->
      <svg class="atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--muted"
           viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <circle cx="11" cy="11" r="7"/>
        <path d="M16.5 16.5L21 21" stroke-linecap="round"/>
      </svg>
    </span>

    <input
      id="session-search"
      type="search"
      class="atom-text-input atom-text-input--inset atom-text-input--md type-body"
      placeholder="Search sessions across workspaces"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      spellcheck="false"
    />

    <!-- clear button — hidden until is-typing on parent form -->
    <button
      type="button"
      class="mol-search-bar__clear atom-hit-target-wrapper atom-hit-target-wrapper--circle"
      aria-label="Clear search"
    >
      <!-- atom-icon-glyph xs muted: x -->
      <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--muted"
           viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
        <path d="M18 6L6 18M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- error helper — shown only when is-no-matches -->
  <p
    id="search-error"
    class="mol-search-bar__error-msg"
    role="status"
    aria-live="polite"
  ></p>
</form>
```

The `<input>` gains `aria-describedby="search-error"` and `aria-invalid="true"` in the `is-no-matches` state.

---

## Variants

| Class modifier | Use case | Input size |
|---|---|---|
| `mol-search-bar--default` | Sessions list search (default; no modifier required) | `--md` (44pt) |
| `mol-search-bar--compact` | Inside a sheet header — tighter vertical padding | `--sm` (36pt) |
| `mol-search-bar--ghost` | Inside command palette — borderless, transparent wrap | `--md` (44pt) + `atom-text-input--bare` |

---

## States

| State class on `<form>` | Visual effect |
|---|---|
| `default` | Placeholder visible, clear button hidden (`display: none`) |
| `is-typing` | Populated value, clear button visible (`display: inline-flex`) |
| `is-focus` | Focus ring via `atom-text-input` `is-focus`; add `is-typing` as needed |
| `is-no-matches` | Input gains `is-error` ring; `search-error` paragraph becomes "No sessions match '{query}'" |
| `is-loading` | Clear button hidden; spinner replaces trailing slot via `atom-text-input-wrap.is-loading` |

---

## Atoms used

| Atom | Class(es) | Role |
|---|---|---|
| `atom-text-input` | `--inset --md` (default/compact uses `--sm`) | Base single-line search field |
| `atom-text-input-wrap` modifier | `atom-text-input--with-leading-icon` | Reserves left padding for search glyph |
| `atom-text-input-wrap` modifier | `atom-text-input--with-trailing-clear` | Reserves right padding for clear slot |
| `atom-icon-glyph` | `--sm --muted` | Leading search icon (16×16) |
| `atom-icon-glyph` | `--xs --muted` | Clear ✕ glyph inside hit-target (12×12) |
| `atom-hit-target-wrapper` | `--circle` | 44pt circular tap zone for clear button |

---

## Token recipe

| Property | Token | Applies to |
|---|---|---|
| Form padding (block) | `var(--space-2)` | `.mol-search-bar` |
| Form padding (inline) | `var(--space-4)` | `.mol-search-bar` |
| Compact form padding (block) | `var(--space-1)` | `.mol-search-bar--compact` |
| Input background (default) | `var(--surface-sunken)` | `atom-text-input--inset` |
| Input background (ghost) | `transparent` | `atom-text-input--bare` |
| Leading icon left inset | `var(--space-3)` | `atom-text-input-wrap` leading icon |
| Leading icon color | `var(--text-muted)` | `atom-icon-glyph--muted` |
| Clear button right offset | `var(--space-2)` | `.mol-search-bar__clear` |
| Clear button visible | `display: inline-flex` | `.mol-search-bar.is-typing .mol-search-bar__clear` |
| Clear button hidden | `display: none` | `.mol-search-bar__clear` (default) |
| Error text color | `var(--state-danger-fg)` | `.mol-search-bar__error-msg` |
| Error text font-size | `var(--font-size-meta)` | `.mol-search-bar__error-msg` |
| Error text padding | `var(--space-1) 0 0 var(--space-4)` | `.mol-search-bar__error-msg` |
| Focus ring | `0 0 0 2px var(--border-focus)` | `atom-text-input--inset.is-focus` |
| Error ring | `is-error` via atom | `atom-text-input` |
| Input height (md) | `var(--touch-target-min)` | `atom-text-input--md` |
| Input height (sm) | `36px` | `atom-text-input--sm` |
| Touch target | `var(--touch-target-min)` | `atom-hit-target-wrapper` |
| Motion | `var(--motion-fast) var(--motion-ease-out)` | all interactive transitions |

---

## Accessibility

- `<form role="search">` declares the landmark; screen readers announce "Search" region
- Hidden `<label>` linked to `<input>` via matching `for`/`id` pair — visible only to assistive technology (`.sr-only`)
- `<input type="search">` provides the correct mobile keyboard return key ("Search") and browser-native clear affordance (suppressed via CSS `appearance` reset; molecule's own clear button is used instead)
- Clear button: `aria-label="Clear search"` — provides an accessible name independent of the ✕ glyph
- Error state: `aria-describedby="search-error"` on `<input>` + `aria-invalid="true"` + `<p role="status" aria-live="polite">` announces match failure to screen readers without stealing focus
- Clear button uses `atom-hit-target-wrapper--circle` which enforces `min-width/height: var(--touch-target-min)` — 44pt meets WCAG 2.5.5 (AAA) target size
- `autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"` suppresses phone-keyboard autocomplete noise on session-title search
