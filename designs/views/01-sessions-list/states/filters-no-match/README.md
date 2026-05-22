# UC-NAV-06.5 — Filters No-Match

## State description

This empty state is shown when the user has applied one or more filter tags and the combination yields no matching sessions. The header uses the `--multi-project is-filtering` variant of `mol-project-chip-header`: the filter icon button has a `·2` accent badge indicating two active filters. Immediately below the header an applied-filter tag row (`.view-sessions-list-empty__filter-tag-section`) renders two `mol-applied-filter-tag` chips — "main · desktop" (workspace/branch filter) and "Streaming" (status filter) — each with a dismiss button to remove that individual filter. The body shows an oversized faint settings/gear icon, the heading "No matches", body copy, and a "Clear filters" CTA. No FAB is shown.

## Composition

| Layer | Component / atom | Notes |
|-------|-----------------|-------|
| Device frame | `atom-device-bezel` | Standard iPhone bezel |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal, wifi, battery |
| Header | `mol-project-chip-header mol-project-chip-header--multi-project is-filtering` | Filter button wrapped in `view-sessions-list-empty__filter-wrap`; `atom-badge--accent atom-badge--sm` badge showing "·2" |
| Filter tag row | `view-sessions-list-empty__filter-tag-section` > `mol-applied-filter-tag-row` | Two `mol-applied-filter-tag` items: "main · desktop" (branch icon) and "Streaming" (activity icon); each has a `mol-applied-filter-tag__dismiss` button |
| Empty state body | `mol-empty-state` | Settings icon `atom-icon-glyph--xl atom-icon-glyph--faint` + "No matches" heading + body copy + "Clear filters" `atom-button--secondary` CTA |
| Tab bar | `view-sessions-list-empty__tab-bar` + `mol-bottom-tab-bar-item` | Chat tab `is-selected` |

**Header variant:** `mol-project-chip-header --multi-project is-filtering` (filter button has badge; filter-tag row appended below header outside the molecule)

## State driver

```
activeFilters.length > 0 && filteredSessions.length === 0
```

Electric/data condition: `sessions` collection is ready; `activeFilters` array is non-empty (length matches the badge count); applying all active filters to the sessions collection produces zero results. The "Clear filters" CTA sets `activeFilters` to `[]`. Individual dismiss buttons on each tag remove that specific filter from the array.

## See also

Sibling file showing all 5 empty-state variants side-by-side:
`../_combined-empty/_combined-empty.html`
