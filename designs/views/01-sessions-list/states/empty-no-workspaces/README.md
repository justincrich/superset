# UC-NAV-06.2 — No Workspaces

## State description

This empty state is shown when the user has exactly one project ("superset") but that project contains no workspaces. Because there is only one project the header uses the `--single-project` variant of `mol-project-chip-header`: the project chip is rendered without a chevron, making it non-tappable (there is nothing to switch to). The search bar and filter button are present but non-functional at this layer — they are part of the molecule's default layout. The body shows a layers icon with "No workspaces in superset" and prompts the user to create one on desktop. No FAB is shown because a workspace is required to start a chat.

## Composition

| Layer | Component / atom | Notes |
|-------|-----------------|-------|
| Device frame | `atom-device-bezel` | Standard iPhone bezel |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal, wifi, battery |
| Header | `mol-project-chip-header mol-project-chip-header--single-project` | Single-project variant — chip has no chevron (`aria-label="Current project: superset"`); search + filter row present |
| Empty state body | `mol-empty-state` | Layers icon (48 px inline SVG) + heading "No workspaces in superset" + body copy |
| Tab bar | `view-sessions-list-empty__tab-bar` + `mol-bottom-tab-bar-item` | Chat tab `is-selected` |

**Header variant:** `mol-project-chip-header --single-project` (chip is static, no chevron)

## State driver

```
projects.length === 1 && workspaces.length === 0
```

Electric/data condition: `projects` collection ready with exactly one entry; `workspaces` collection for that project is ready and empty. Guard with `isReady` before deriving this state to avoid a flash of empty content while data loads.

## See also

Sibling file showing all 5 empty-state variants side-by-side:
`../_combined-empty/_combined-empty.html`
