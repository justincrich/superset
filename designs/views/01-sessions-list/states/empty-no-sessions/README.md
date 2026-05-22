# UC-NAV-06.3 — No Sessions

## State description

This empty state is shown when the user has multiple projects (or at least one project with workspaces) but the currently selected project has no chat sessions yet. The header uses the `--multi-project` variant of `mol-project-chip-header` because there are multiple projects to switch between: the chip shows "superset" with a down-chevron and fires a project-picker dialog on tap. The search bar and filter button are present. The body shows a message-square icon with "Start your first chat in superset" and instructs the user to tap the FAB. This is the only empty state where the FAB is visible, because workspaces exist and a new chat can be created.

## Composition

| Layer | Component / atom | Notes |
|-------|-----------------|-------|
| Device frame | `atom-device-bezel` | Standard iPhone bezel |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal, wifi, battery |
| Header | `mol-project-chip-header mol-project-chip-header--multi-project` | Multi-project variant — chip has chevron (`aria-haspopup="dialog"`); search + filter row present |
| Empty state body | `mol-empty-state` | Message-square icon (48 px inline SVG) + heading + body copy |
| FAB | `atom-fab-base atom-fab-base--accent atom-fab-base--md` | Inside `view-sessions-list-empty__fab-wrap`; positioned bottom-right of main |
| Tab bar | `view-sessions-list-empty__tab-bar` + `mol-bottom-tab-bar-item` | Chat tab `is-selected` |

**Header variant:** `mol-project-chip-header --multi-project` (chip is tappable with chevron)

## State driver

```
projects.length > 1 && sessions.length === 0 && searchQuery === '' && activeFilters.length === 0
```

Electric/data condition: `sessions` collection for the current project is ready and empty, with no active search query or filters applied. The FAB is only rendered in this state — implementation must gate its visibility on this exact condition.

## See also

Sibling file showing all 5 empty-state variants side-by-side:
`../_combined-empty/_combined-empty.html`
