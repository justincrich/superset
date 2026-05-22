# sessions-list-empty-states

**View**: UC-NAV-06 — Sessions list empty states (5 variants stacked per pane)
**Spec**: `plans/chat-mobile-plan/09-uc-nav.md` § F
**Pattern**: Combined multi-variant view — 5 iPhone frames stacked vertically inside each themed pane.

## Variants

| # | UC | Header | Empty body |
|---|---|---|---|
| 06.1 | No projects | Plain centered "Sessions" title (no project chip, no search) | `mol-empty-state` · package icon (xl, faint) · "No projects yet" · "Create one on desktop to see it here." |
| 06.2 | No workspaces | `mol-project-chip-header --single-project` "superset" (static, no chevron) + search + filter | `mol-empty-state` · layers icon (xl, faint) · "No workspaces in superset" · "Create one on desktop." |
| 06.3 | No sessions | `mol-project-chip-header --multi-project` "superset ▾" + search + filter | `mol-empty-state` · message-square icon (xl, faint) · "Start your first chat in superset" · "Tap '+' below to pick a workspace." · `atom-fab-base --accent --md` FAB bottom-right |
| 06.4 | Search no-match | `mol-project-chip-header --multi-project` + search input value "zzzz" + clear ✕ visible + filter | `mol-empty-state` · search icon (xl, faint) · "No matches" · `No sessions match "zzzz" in superset.` · `atom-button --secondary --md` "Clear search" |
| 06.5 | Filters no-match | `mol-project-chip-header --multi-project is-filtering` + badge "·2" + applied filter tag row (2 chips) | `mol-empty-state` · settings icon (xl, faint) · "No matches" · "No sessions match the active filters." · `atom-button --secondary --md` "Clear filters" |

## Stylesheet load order

```html
<link rel="stylesheet" href="../../typography/fonts.css">
<link rel="stylesheet" href="../../tokens/tokens.css">
<link rel="stylesheet" href="../../typography/type-modules.css">
<link rel="stylesheet" href="../../atoms/_preview.css">
<link rel="stylesheet" href="../../molecules/_atoms.css">
<link rel="stylesheet" href="../../organisms/_molecules.css">
```

## Atoms and molecules composed

- `atom-device-bezel` — iPhone 16 Pro Max frame (×10 total: 5 variants × 2 themes)
- `atom-section-label --strong` + `type-meta` — variant section headings ("06.1 · NO PROJECTS" etc.)
- `atom-pill --default --md` — project chip (inside mol-project-chip-header, variants 06.2–06.5)
- `atom-icon-button --ghost --md` — filter + menu buttons
- `atom-icon-glyph --xl --faint` — empty-state hero icons (all 5 variants)
- `atom-text-input --inset --md` — search input (06.2–06.5)
- `atom-text-input-clear` — clear ✕ on search input (06.4)
- `atom-badge --accent --sm` — filter count badge "·2" (06.5)
- `atom-fab-base --accent --md` — new-chat FAB (06.3)
- `atom-button --secondary --md` — "Clear search" / "Clear filters" (06.4, 06.5)
- `mol-project-chip-header` + `--single-project` / `--multi-project` / `is-filtering` — header variants
- `mol-empty-state` — centred hero icon + heading + body + optional CTA (all 5)
- `mol-applied-filter-tag` — individual filter chips (06.5: workspace + status)
- `mol-applied-filter-tag-row` — horizontal scrollable chip row (06.5)
- `mol-bottom-tab-bar-item` — Tasks / Chat (selected) / More tabs (all 5)

## View-local classes (layout glue only)

| Class | Purpose |
|---|---|
| `.view-sessions-list-empty__body` | Flex-1 centred content area between header and tab bar |
| `.view-sessions-list-empty__tab-bar` | Bottom tab bar (hairline top + blur) |
| `.view-sessions-list-empty__fab-wrap` | Absolute FAB anchor (06.3) |
| `.view-sessions-list-empty__plain-header` | Centred "Sessions" plain header (06.1) |
| `.view-sessions-list-empty__plain-header .type-section-title` | Zero margin on heading inside plain header |
| `.view-sessions-list-empty__filter-wrap` | `position: relative` anchor for badge overlay on filter button (06.5) |
| `.view-sessions-list-empty__filter-tag-section` | Inline filter-tag row below header (06.5) |

## Token compliance

- Zero hex values — all colors via `var(--*)`
- Zero numeric font-* — all typography via `.type-*` classes
- Zero raw px in padding/margin/gap — all spacing via `var(--space-*)`
- No redefined `.atom-*` or `.mol-*` rules

## Inlined patterns (documented)

**Applied filter tag row (06.5):** `mol-project-chip-header` has no built-in slot for the applied-filter-tag row. The row is inlined as `.view-sessions-list-empty__filter-tag-section` directly below the `<header>` element, using `mol-applied-filter-tag-row` + `mol-applied-filter-tag` from the organism bundle. This matches the spec instruction for inlining when a molecule slot is absent.

## TOKEN_GAPs / ATOM_GAPs

None — all patterns resolved from existing token + atom + molecule catalog.
