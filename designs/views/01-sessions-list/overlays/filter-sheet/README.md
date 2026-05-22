# filter-sheet

## Purpose

Renders the full filter sheet for the Superset mobile sessions list. Triggered when the user taps the settings (⚙) icon in the sessions header. The sheet overlays the dimmed sessions list at `--sheet-snap-full` (85 vh), allowing the user to narrow sessions by workspace and status before returning to the list.

## PRD Wireframe Reference

**UC-NAV-08 §C** — full filter sheet with workspace + status filter rows

```
[Tap ⚙] ─►

┌──────────────────────────────────────┐
│       ◇ Filter sessions          ✕  │
├──────────────────────────────────────┤
│  Workspaces                          │
│                                      │
│  [✓] chat-mobile-plan · 💻 macbook   │
│  [✓] api-rewrite       · ☁️ cloud-1  │
│  [ ] main              · 💻 macbook  │
│  [ ] main              · 💻 desktop  │
│  [ ] feature-x         · ☁️ cloud-1  │
│                                      │
│  Status                              │
│                                      │
│  [✓] ⌖ Streaming                     │
│  [ ] ⚠ Pause pending                 │
│  [ ] ● Idle                          │
│                                      │
│       [ Clear all ]  [ Apply ]       │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery indicators |
| Content area | `atom-device-bezel__content` | flex:1, position:relative — anchors the absolute sheet overlay |
| Dimmed sessions | `.view-filter-sheet__sessions-behind` | Session stubs (mol-session-row), aria-hidden |
| Scrim backdrop | `atom-backdrop --scrim` | 0.55 opacity black scrim, position:absolute within sessions-behind |
| Session stub rows | `mol-session-row` | 3–4 rows: title, meta (status · host), status-dot — all aria-hidden, tabindex="-1" |
| Sheet overlay | `.view-filter-sheet__overlay` | `position:absolute; bottom:0` — contains sheet card |
| Sheet card | `.view-filter-sheet__sheet` | `--surface-overlay` bg, `--radius-xl` top corners, `--elevation-sheet` shadow, `height: --sheet-snap-full` |
| Drag handle | `atom-home-indicator --sheet-handle --muted` | `--text-faint` pill, centered at sheet top via handle-row overlay |
| Sheet header | `.view-filter-sheet__header` | Diamond icon + "Filter sessions" title + close ✕ button |
| Header close | `atom-icon-button --ghost --md` | ✕ icon-button, `aria-label="Close filter sheet"` |
| Scrollable body | `.view-filter-sheet__body` | flex:1, overflow-y:auto, scrollbar hidden |
| Workspaces label | `atom-section-label --strong` | "WORKSPACES" uppercase mono heading |
| Workspace rows | `mol-filter-checkbox-row --workspace` × 5 | git-branch icon + name + separator dot + host-icon + host |
| Section divider | `atom-divider --horizontal --hairline` | Hairline rule between sections |
| Status label | `atom-section-label --strong` | "STATUS" uppercase mono heading |
| Status rows | `mol-filter-checkbox-row --status` × 3 | Status-encoded icon + label; --warning for Pause pending, --idle for Idle |
| Docked footer | `.view-filter-sheet__footer` | border-top hairline, safe-area-bottom padding, equal-width button row |
| Clear all button | `atom-button --secondary --md` | flex:1, secondary variant |
| Apply button | `atom-button --primary --md` | flex:1, primary / accent variant |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill at viewport bottom |

## Composition Table

Every atom and molecule composed in this view:

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__content` | Atom sub-element | flex:1 content region, relative for overlay anchor |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-backdrop --scrim` | Atom | 0.55 opacity scrim over dimmed sessions |
| `atom-home-indicator --sheet-handle --muted` | Atom | Drag handle pill at sheet top |
| `atom-section-label --strong` | Atom | "WORKSPACES" and "STATUS" section headings |
| `atom-divider --horizontal --hairline` | Atom | Hairline separator between Workspaces and Status sections |
| `atom-icon-button --ghost --md` | Atom | Close (✕) button in sheet header |
| `atom-button --secondary --md` | Atom | "Clear all" footer button |
| `atom-button --primary --md` | Atom | "Apply" footer button |
| `atom-checkbox --md` / `is-checked` | Atom | Checkbox control within each filter row |
| `atom-icon-glyph --sm --muted` | Atom | Git-branch workspace icon in workspace rows |
| `atom-icon-glyph --xs --faint` | Atom | Host icon (laptop/desktop/cloud) in workspace rows |
| `atom-icon-glyph --sm` | Atom | Status icon (radio/target, alert-triangle, circle) in status rows |
| `atom-status-dot --live --sm` | Atom | Live (streaming) status dot in session stubs |
| `atom-status-dot --neutral --sm` | Atom | Neutral (idle) status dot in session stubs |
| `mol-filter-checkbox-row --workspace` | Molecule | Workspace filter row × 5 |
| `mol-filter-checkbox-row --status` | Molecule | Status filter row (Streaming) × 1 |
| `mol-filter-checkbox-row --status --warning` | Molecule | Status filter row (Pause pending) × 1 |
| `mol-filter-checkbox-row --status --idle` | Molecule | Status filter row (Idle) × 1 |
| `mol-session-row` | Molecule | Background session stub rows (aria-hidden) |

**Distinct atom classes composed: 12**
**Distinct molecule classes composed: 5**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--surface-overlay)` | Sheet card background; footer background |
| `var(--surface-soft)` | Preview plate background |
| `var(--surface-sunken)` | Pane-label background |
| `var(--border-subtle)` | Pane border, sheet header bottom border, footer top border, preview-plate border |
| `var(--radius-xl)` | Sheet top-left and top-right border-radius |
| `var(--radius-subtle)` | Pane-label border-radius |
| `var(--radius-default)` | Pane border-radius |
| `var(--elevation-sheet)` | Sheet card box-shadow |
| `var(--text-faint)` | Session stub meta text color (inline on meta span) |
| `var(--text-muted)` | Pane-label color, preview crumb, header icon |
| `var(--font-mono)` | `.crumb` font |
| `var(--font-size-meta)` | `.crumb` font-size |
| `var(--tracking-mono)` | `.crumb` letter-spacing |
| `var(--touch-target-min)` | Sheet header min-height |
| `var(--sheet-snap-full)` | Sheet card height (85vh) |
| `var(--safe-area-bottom)` | Footer extra bottom padding for home indicator clearance |

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Sheet dialog | `role="dialog" aria-modal="true" aria-label="Filter sessions"` |
| Filter body group | `role="group" aria-label="Filter options"` |
| Workspace list | `<ul role="list" aria-label="Workspace filters">` |
| Status list | `<ul role="list" aria-label="Status filters">` |
| Checkbox rows | `aria-label="Filter by workspace: <name> on <host>"` / `"Filter by status: <status>"` on each native `<input type="checkbox">` |
| Close button | `aria-label="Close filter sheet"` |
| Footer buttons | `aria-label="Clear all filters"` / `"Apply filters"` |
| Session stubs / scrim | `aria-hidden="true"` — decorative background, not part of dialog interaction |
| Session stub rows | `role="presentation"` + `tabindex="-1"` — inert backdrop decoration |
| Dynamic Island / status bar / home indicator | `aria-hidden="true"` — hardware chrome |
| All SVG icons | `aria-hidden="true"` — decorative, labelled by containing interactive element |

## Layout Choices

- **Sheet overlay positioning**: The sheet overlay uses `position: absolute; bottom: 0` anchored inside `atom-device-bezel__content` (which provides `position: relative`). This ensures the sheet stacks correctly inside the device frame without leaking outside the viewport boundary.
- **Sheet height = `--sheet-snap-full`**: The brief specifies a full filter sheet at the `--sheet-snap-full` (85 vh) snap point. The height is applied directly to `.view-filter-sheet__sheet` using the token.
- **Scrollable body with docked footer**: The sheet is a flex column. The body region (`flex: 1; overflow-y: auto`) scrolls independently of the docked footer. This ensures the Clear all / Apply buttons are always visible regardless of filter list length.
- **Safe-area bottom padding on footer**: `padding-bottom: calc(var(--space-3) + var(--safe-area-bottom))` ensures the footer buttons clear the iOS home indicator (24 px) on iPhone 16 Pro Max.
- **Scrim in sessions-behind**: The `atom-backdrop --scrim` is `position: absolute` inside `.view-filter-sheet__sessions-behind`, which is a flex child. This scopes the scrim to the sessions list region without overflowing the whole viewport.
- **Drag handle positioned via overlay row**: The drag handle (`atom-home-indicator --sheet-handle --muted`) sits inside `.view-filter-sheet__handle-row`, which is `position: absolute` at the top of the header. This places the handle centred above the header title row without taking flex space.
- **Two duplicate "main" workspaces**: Both rows differ only by host (macbook vs desktop). The `mol-filter-checkbox-row__host` suffix with distinct host icons disambiguates them visually, matching the wireframe note.
- **Status row icon colours**: Streaming uses `.mol-filter-checkbox-row--status` default (mint `--state-live-fg`). Pause pending adds `--warning` modifier (amber `--state-warning-fg`). Idle adds `--idle` modifier (`--text-muted` / neutral grey). All three states are covered by existing modifier classes in `_molecules.css`.

## Known Preview Stand-ins

None. All content is structural real content. No keyboard stub or placeholder panels are present — the filter sheet does not involve keyboard input.
