# UC-NAV-06.1 — No Projects

## State description

This is the first-run empty state shown when the authenticated user has no projects connected to their account. Because there are no projects to scope the list to, the header shows a plain centred "Sessions" title with no project chip, search bar, or filter button — none of those controls are meaningful without at least one project. The body presents a package icon with the message "No projects yet" and prompts the user to create one on desktop. No FAB is shown because starting a chat requires a workspace, which requires a project.

## Composition

| Layer | Component / atom | Notes |
|-------|-----------------|-------|
| Device frame | `atom-device-bezel` | Standard iPhone bezel with dynamic island and home indicator |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal, wifi, battery |
| Header | `view-sessions-list-empty__plain-header` | View-local rule — centred `type-section-title` "Sessions"; no chip, no search, no filter |
| Empty state body | `mol-empty-state` | Package icon (48 px inline SVG) + heading "No projects yet" + body copy |
| Tab bar | `view-sessions-list-empty__tab-bar` + `mol-bottom-tab-bar-item` | Chat tab `is-selected`; Tasks and More tabs inactive |

**Header variant:** plain centred title (no `mol-project-chip-header`)

## State driver

```
projects.length === 0
```

Electric/data condition: the `projects` collection is ready (`isReady === true`) and returns an empty array. Until the collection is ready, render a loading skeleton instead of this empty state.

## See also

Sibling file showing all 5 empty-state variants side-by-side:
`../_combined-empty/_combined-empty.html`
