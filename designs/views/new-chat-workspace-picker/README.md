# new-chat-workspace-picker

## Purpose

Renders the workspace picker bottom sheet that appears when the user taps the FAB "+" button from the sessions list. The sheet presents all available workspaces in the current Superset project so the user can tap one to start a new chat session in that context. Empty workspaces (no sessions yet) are still listed.

## PRD Wireframe Reference

**UC-NAV §D** — Start a new chat workspace picker sheet

```
[Tap FAB +] ─►

┌──────────────────────────────────────┐
│       ◇ Start a new chat        ✕   │
├──────────────────────────────────────┤
│  Pick a workspace in superset        │
│                                      │
│     chat-mobile-plan · 💻 macbook    │
│     5 sessions · 2m ago              │
│                                      │
│     api-rewrite · ☁️ cloud-1         │
│     3 sessions · 1h ago              │
│                                      │
│     main · 💻 macbook                │
│     2 sessions · yesterday           │
│                                      │
│     main · 💻 desktop                │
│     1 session · 3 days ago           │
│                                      │
│     feature-x · ☁️ cloud-1           │
│     no sessions yet                  │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery indicators |
| Content area | `atom-device-bezel__content` | flex:1, position:relative — anchors absolute sheet overlay |
| Dimmed sessions list | `.view-new-chat-workspace-picker__sessions-behind` | Sessions stub (header + rows + FAB), aria-hidden |
| Scrim backdrop | `atom-backdrop --scrim` | 0.55 opacity black scrim, position:absolute within content area |
| Sessions stub header | `.view-new-chat-workspace-picker__stub-header` | "Sessions" title + workspace pill — decorative context |
| Sessions stub rows | `mol-session-row` (×3) | Decorative backdrop rows, tabindex="-1", aria-hidden |
| FAB stub | `atom-fab-base --accent` | Plus icon FAB, dimmed behind scrim — shows trigger origin |
| Sheet overlay | `.view-new-chat-workspace-picker__overlay` | `position:absolute; bottom:0`, ~70% max-height |
| Sheet card | `.view-new-chat-workspace-picker__sheet` | `--surface-overlay` bg, `--radius-xl` top corners, `--elevation-sheet` shadow |
| Drag handle | `atom-home-indicator --sheet-handle --muted` | `--text-faint` pill, centered at sheet top via handle-row |
| Sheet header | `.view-new-chat-workspace-picker__header` | Flex row: title group (star glyph + "Start a new chat") + close ✕ button |
| Star/diamond glyph | `atom-icon-glyph --md --muted` | Lucide star path, leading icon for the sheet title |
| Title text | `<h2 class="type-title">` | "Start a new chat" |
| Close button | `atom-icon-button --ghost --md` | ✕ icon — dismisses the sheet |
| Section label | `.type-body` muted color | "Pick a workspace in superset" — informational subtitle, NOT mono uppercase |
| List wrap | `.view-new-chat-workspace-picker__list-wrap` | Relative container, holds scroll fades + `<ul>` |
| Scroll fade top | `atom-scroll-fade --top --on-overlay` | Initially hidden (`.is-hidden`) |
| Workspace list | `<ul role="list">` | 5 workspace rows |
| Workspace rows (×5) | `.view-new-chat-workspace-picker__row` | Leading git-branch + body 2-line column + trailing chevron; 44pt min-height |
| Scroll fade bottom | `atom-scroll-fade --bottom --on-overlay` | Visible — hints overflow scroll content |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill |

## Workspace Row Anatomy

Each workspace row is a full-width `<button>` composed from three slots:

| Slot | Element | Notes |
|------|---------|-------|
| Leading | `atom-icon-glyph --sm --muted` + git-branch SVG | Consistent branch visual for every workspace |
| Body line 1 | name `·` host | workspace name (`.view-...__row-name`) + separator + host label with emoji |
| Body line 2 | meta | session count + timeago; "no sessions yet" in `--empty` variant renders `--text-faint` |
| Trailing | `atom-icon-glyph --xs --faint` + chevron-right SVG | Navigation affordance |

## Composition Table

Every atom and molecule composed in this view:

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__content` | Atom sub-element | flex:1 content region, relative for overlay |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-backdrop --scrim` | Atom | 0.55 opacity scrim over dimmed sessions list |
| `atom-home-indicator --sheet-handle --muted` | Atom | Drag handle indicator at sheet top |
| `atom-icon-glyph --md --muted` | Atom | Diamond/star glyph in sheet header title group |
| `atom-icon-button --ghost --md` | Atom | Close (✕) button in sheet header |
| `atom-icon-glyph --sm --muted` | Atom | Git-branch leading icon on each workspace row |
| `atom-icon-glyph --xs --faint` | Atom | Chevron-right trailing icon on each workspace row |
| `atom-scroll-fade --top --on-overlay` | Atom | Scroll fade at top of row list (initially hidden) |
| `atom-scroll-fade --bottom --on-overlay` | Atom | Scroll fade at bottom of row list |
| `atom-fab-base --accent` | Atom | Plus FAB stub (dimmed behind scrim) |
| `atom-pill --default --sm` | Atom | Workspace name pill in sessions stub header |
| `mol-session-row` (×3) | Molecule | Decorative session row stubs in backdrop |

**Distinct atom classes composed: 12**
**Distinct molecule classes composed: 1**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins throughout view glue rules |
| `var(--safe-area-bottom)` | Bottom padding on row list (home indicator clearance) |
| `var(--touch-target-min)` | `min-height` on each workspace row button (44px) |
| `var(--surface-overlay)` | Sheet card background |
| `var(--surface-soft)` | Row hover background |
| `var(--surface-active)` | Row active (pressed) background |
| `var(--surface-sunken)` | Pane-label background |
| `var(--border-subtle)` | Stub header border, pane border, pane-label border |
| `var(--border-focus)` | Row focus-visible inset ring |
| `var(--radius-xl)` | Sheet top-left and top-right border-radius |
| `var(--radius-subtle)` | Pane-label border-radius |
| `var(--radius-default)` | Pane border-radius |
| `var(--elevation-sheet)` | Sheet card box-shadow |
| `var(--motion-fast)` | Row hover/active transition duration |
| `var(--motion-ease-out)` | Row hover/active transition easing |
| `var(--text-body)` | Default row text color; stub header title |
| `var(--text-muted)` | Section label color; pane-label; status bar crumb |
| `var(--text-faint)` | Row host label, separator, empty-meta variant |
| `var(--text-heading)` | Stub header title font color |
| `var(--font-body)` | Row name and host label font |
| `var(--font-mono)` | Row meta, crumb, pane-label, section label |
| `var(--font-size-title)` | Stub header title size |
| `var(--font-size-body)` | Row name size |
| `var(--font-size-body-sm)` | Row host label size |
| `var(--font-size-meta)` | Row meta size, crumb, pane-label |
| `var(--font-weight-title)` | Stub header title weight |
| `var(--font-weight-meta)` | Row name and meta weight |
| `var(--font-weight-body)` | Row host label weight |
| `var(--line-height-snug)` | Row name, host, meta line heights |
| `var(--tracking-mono)` | Row meta, crumb letter-spacing |

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Sheet dialog | `role="dialog" aria-modal="true" aria-label="Start a new chat"` |
| Workspace list | `<ul role="list" aria-label="Workspaces">` |
| Workspace rows | `aria-label="Start new chat in {name} on {host}, {N sessions}, {timeago}"` on each `<button>` |
| Close button | `aria-label="Close"` |
| Sessions-behind stub | `aria-hidden="true"` on the entire dimmed sessions list — decorative backdrop |
| Session row stubs | `tabindex="-1"` + `aria-hidden="true"` — inert decoration |
| FAB stub | `tabindex="-1"` + `aria-hidden="true"` — decorative context element |
| Separators and icons | `aria-hidden="true"` throughout — decorative |
| Dynamic Island / status bar / home indicator | `aria-hidden="true"` — hardware chrome |
| Section label | Plain body text with muted color — informational, not navigational |

## Layout Choices

- **Sheet overlay positioning**: Uses `position: absolute; bottom: 0` anchored inside `atom-device-bezel__content` (which has `position: relative`). The sheet stacks correctly inside the device frame without overflowing the viewport boundary.
- **~70% height**: The overlay uses `max-height: 70%` on the overlay container. Five rows at 44pt each with header chrome fills this comfortably; if more workspaces are present, the list becomes scrollable within the capped height.
- **List scroll with fades**: `atom-scroll-fade --top --on-overlay` starts hidden (`.is-hidden`) and `--bottom --on-overlay` starts visible, hinting that the list overflows. Both use the `--on-overlay` variant to fade to `--surface-overlay` (the sheet background).
- **Sessions list backdrop**: The `atom-backdrop --scrim` is `position: absolute` inside `.view-new-chat-workspace-picker__sessions-behind`, which is itself `position: absolute; inset: 0` in the content area. The scrim layer (`z-index: 2`) sits above the stub (`z-index: 1`) and below the sheet overlay (`z-index: 10`).
- **Section label typography**: Rendered as `.type-body` with `color: var(--text-muted)` via inline style rather than `.type-meta` or `atom-section-label`. The brief specifies informational subtitle — NOT mono uppercase — distinguishing it from navigation/categorization labels.
- **Empty workspace variant**: The `--empty` modifier on `__row-meta` overrides the default `--text-muted` meta color to `--text-faint`, visually de-emphasizing the "no sessions yet" state without hiding the row (empty workspaces are still listed per spec).
- **Row hover/focus states**: Defined in view-local CSS rather than reusing `mol-session-row` because these rows carry workspace (not session) semantics and include a distinct two-line composition with host inline on line 1.

## Unmodular Code Flags

None detected. All colors are consumed from tokens. All spacing uses the `--space-*` scale. No hex literals. No raw `font-size`/`font-weight`/`line-height` values in view-local CSS.

The `2px` structural gap in `__row-body` is documented as an exception matching the same `gap: 2px` found in `mol-session-row__body` — a structural geometry value below the token floor.

The one inline style (`color: var(--text-muted); margin: 0;` on the section label `<p>`) is entirely token-resolved. It exists because `type-body` sets `color: var(--text-body)` which would be too bright for the subtitle role; an override using only tokens is acceptable.
