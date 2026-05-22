# UC-NAV-06.4 — Search No-Match

## State description

This empty state is shown when the user has typed a search query ("zzzz" in this design) that returns no matching sessions in the current project. The header uses the `--multi-project` variant of `mol-project-chip-header`. The search input shows the active query value and a visible clear button (the `atom-text-input-clear` element), which is only visible when the input has a non-empty value. The body shows an oversized faint search icon, the heading "No matches", body copy referencing the query string and project name, and a "Clear search" CTA button. No FAB is shown.

## Composition

| Layer | Component / atom | Notes |
|-------|-----------------|-------|
| Device frame | `atom-device-bezel` | Standard iPhone bezel |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal, wifi, battery |
| Header | `mol-project-chip-header mol-project-chip-header--multi-project` | Search row: `atom-text-input--with-trailing-clear` wrapper; `input[value="zzzz"]`; `atom-text-input-clear` button visible |
| Empty state body | `mol-empty-state` | Search icon `atom-icon-glyph--xl atom-icon-glyph--faint` + "No matches" heading + body referencing query + "Clear search" `atom-button--secondary` CTA |
| Tab bar | `view-sessions-list-empty__tab-bar` + `mol-bottom-tab-bar-item` | Chat tab `is-selected` |

**Header variant:** `mol-project-chip-header --multi-project` with populated search input and visible clear button

## State driver

```
searchQuery !== '' && filteredSessions.length === 0
```

Electric/data condition: the `sessions` collection is ready and non-empty (or may be empty), but the current `searchQuery` string produces zero results after client-side or server-side filtering. The body copy interpolates the query string: `No sessions match "${searchQuery}" in ${currentProject.name}`. The "Clear search" button sets `searchQuery` to `''`.

## See also

Sibling file showing all 5 empty-state variants side-by-side:
`../_combined-empty/_combined-empty.html`
