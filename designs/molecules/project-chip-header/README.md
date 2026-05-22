# mol-project-chip-header

The sessions-list top header. Provides a two-row sticky header: a top row with the hamburger menu button and project chip, and a search row with an inline search input and filter settings button. Corresponds to UC-NAV §A wireframe — the `☰ 📦 superset ▾` / `🔍 Search sessions ⚙` pattern above the sessions list.

---

## Purpose

- Opens the navigation drawer (hamburger leading)
- Identifies the active project and, when the org has multiple projects, lets the user switch (project chip)
- Provides inline search and filter access for the sessions list

---

## Anatomy

```html
<header class="mol-project-chip-header mol-project-chip-header--multi-project">

  <!-- Row 1: hamburger + project chip -->
  <div class="mol-project-chip-header__row mol-project-chip-header__row--top">

    <!-- Leading: hamburger ghost md icon-button -->
    <button
      class="atom-icon-button atom-icon-button--ghost atom-icon-button--md mol-project-chip-header__menu"
      aria-label="Open navigation drawer"
    >
      <svg class="atom-icon-glyph atom-icon-glyph--md" aria-hidden="true">…menu…</svg>
    </button>

    <!-- Project chip (pill, tappable when multi-project) -->
    <button
      class="mol-project-chip-header__chip atom-pill atom-pill--default atom-pill--md"
      aria-haspopup="dialog"
      aria-expanded="false"
      aria-label="Switch project — currently: superset"
    >
      <svg class="atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--muted" aria-hidden="true">…package…</svg>
      <span class="mol-project-chip-header__chip-name">superset</span>
      <svg class="atom-icon-glyph atom-icon-glyph--xs atom-icon-glyph--faint mol-project-chip-header__chip-chevron" aria-hidden="true">…chevron-down…</svg>
    </button>

  </div>

  <!-- Row 2: search input + filter button -->
  <div class="mol-project-chip-header__row mol-project-chip-header__row--search">

    <!-- Search wrap: positioned leading icon + input -->
    <div class="mol-project-chip-header__search-wrap">
      <label class="sr-only" for="sessions-search">Search sessions</label>
      <span class="mol-project-chip-header__search-leading" aria-hidden="true">
        <svg class="atom-icon-glyph atom-icon-glyph--sm atom-icon-glyph--muted">…search…</svg>
      </span>
      <input
        id="sessions-search"
        type="search"
        class="atom-text-input atom-text-input--inset atom-text-input--md mol-project-chip-header__search-input"
        placeholder="Search sessions"
        aria-label="Search sessions"
      />
    </div>

    <!-- Filter button: ghost md icon-button with optional badge -->
    <button
      class="atom-icon-button atom-icon-button--ghost atom-icon-button--md mol-project-chip-header__filter"
      aria-label="Filter sessions"
    >
      <svg class="atom-icon-glyph atom-icon-glyph--md" aria-hidden="true">…settings…</svg>
      <span
        class="atom-badge atom-badge--accent atom-badge--sm mol-project-chip-header__filter-badge"
        aria-hidden="true"
      >2</span>
    </button>

  </div>

</header>
```

For `mol-project-chip-header--single-project` the chip `<button>` gets `pointer-events: none`, its background is transparent, its border is transparent, and the chevron is hidden.

For `mol-project-chip-header--no-projects` the chip shows "No project" text in muted color; the search input and filter button carry `is-disabled`.

---

## Variants

| Class modifier | Effect | Use case |
|---|---|---|
| `mol-project-chip-header--multi-project` (default) | Chip is tappable, shows ▾ chevron | Org has ≥ 2 projects |
| `mol-project-chip-header--single-project` | Chip is static label — no chevron, no tap | Org has exactly 1 project |
| `mol-project-chip-header--no-projects` | Chip shows "No project" muted text; search + filter disabled | Empty org |

---

## States

| Class on root | Effect |
|---|---|
| `default` | `var(--surface-page)` background, `var(--border-subtle)` bottom border |
| `is-scrolled` | Adds `box-shadow: 0 1px 0 var(--border-subtle)` — sticky-pinned shadow above scrolling list |
| `is-filtering` | Filter badge becomes visible (`display: inline-flex`); `aria-label` on filter button should be updated by JS to include active count (e.g. "Filter sessions, 2 filters active") |

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-icon-button` | `--ghost --md` | Hamburger — opens nav drawer |
| `atom-icon-button` | `--ghost --md` | Filter settings button (trailing, row 2) |
| `atom-icon-glyph` | `--md` | menu glyph inside hamburger button |
| `atom-icon-glyph` | `--md` | settings glyph inside filter button |
| `atom-icon-glyph` | `--sm --muted` | package glyph inside project chip |
| `atom-icon-glyph` | `--xs --faint` | chevron-down glyph inside project chip |
| `atom-icon-glyph` | `--sm --muted` | search glyph leading icon in search wrap |
| `atom-pill` | `--default --md` | Project chip base — tappable container |
| `atom-badge` | `--accent --sm` | Filter count badge on settings button |
| `atom-text-input` | `--inset --md` | Search input field |

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| root `padding` | `var(--space-2) var(--space-3) var(--space-3)` | 8px top / 12px inline / 12px bottom |
| root `gap` | `var(--space-2)` | 8px between row 1 and row 2 |
| root `background` | `var(--surface-page)` | Blends with viewport |
| root `border-bottom` | `1px solid var(--border-subtle)` | Structural separator |
| root `z-index` | `10` | Sticky above scroll content, below modals |
| `__row` `gap` | `var(--space-2)` | 8px between items in each row |
| `__chip` `flex` | `1` | Fills available space in top row |
| `__chip-name` `font-weight` | `var(--font-weight-meta)` | Semi-bold project name label |
| `__search-leading` `inset-inline-start` | `var(--space-3)` | 12px — aligns leading icon inside inset input |
| `__search-input` `padding-inline-start` | `calc(var(--space-3) * 2 + 16px)` | Clears the 16px sm icon + 12px leading offset + 12px gap |
| `__filter-badge` `top` / `right` | `2px` / `2px` | Structural absolute-positioned badge offset — TOKEN_GAP |
| `is-scrolled` shadow | `0 1px 0 var(--border-subtle)` | Reinforces border on scroll |

**TOKEN_GAP**: `top: 2px; right: 2px` on `__filter-badge` is below the 4px token-scale floor. Justified as a structural badge-over-button overlap offset consistent with `mol-app-header` subtitle and `atom-device-bezel` hardware-geometry exceptions.

---

## Accessibility

- `<header>` is a landmark region.
- Hamburger button has `aria-label="Open navigation drawer"`.
- Project chip `<button>` carries `aria-haspopup="dialog"`, `aria-expanded="false"/"true"`, and `aria-label="Switch project — currently: {name}"`. When in single-project or no-project mode it should use a `<span>` instead of `<button>` to remove it from the tab order.
- Search `<input>` has a visually-hidden `<label>` via `.sr-only` plus an explicit `aria-label`.
- Filter `<button>` has `aria-label="Filter sessions"`. When `is-filtering` is active the JS layer must update it to `aria-label="Filter sessions, N filters active"` so the count is announced without requiring the visible badge.
- Filter badge `<span>` carries `aria-hidden="true"` — the count is expressed in the button's `aria-label`.
- All icon SVGs are `aria-hidden="true"`.
