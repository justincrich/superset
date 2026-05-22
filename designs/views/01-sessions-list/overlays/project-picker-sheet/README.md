# project-picker-sheet

## Purpose

Renders the project-switching bottom sheet that appears when the user taps the project chip in the mobile app header. The sheet slides up to the 50vh snap point over a dimmed sessions-list stub, showing a drag handle, a centered "Switch project" title with close button, a "THIS ORGANIZATION" section label, and three tappable project rows. The currently selected project row carries an accent checkmark and `surface-active` background.

## PRD Wireframe Reference

**UC-NAV §B** — project picker bottom sheet

```
[Tap project chip in header] ─►

┌──────────────────────────────────────┐
│       ◇ Switch project           ✕  │  ← sheet handle + close
├──────────────────────────────────────┤
│  This organization                   │
│                                      │
│  ✓  📦 superset                      │  ← currently selected
│     4 workspaces · 12 sessions       │
│                                      │
│     📦 JustinCode                    │  ← tappable
│     1 workspace · 2 sessions         │
│                                      │
│     📦 LaneShadow                    │  ← tappable
│     2 workspaces · no sessions yet   │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery indicators |
| Content area | `atom-device-bezel__content` | flex:1, position:relative — anchors the absolute sheet overlay |
| Sessions stub | `.view-project-picker-sheet__sessions-behind` | Dimmed sessions-list (app header + 3 session rows), aria-hidden |
| Scrim backdrop | `atom-backdrop --scrim` | 0.55 opacity black scrim, position:absolute within sessions-behind |
| App header stub | `.view-project-picker-sheet__stub-header` | Back chevron + project chip (superset) + overflow dots — context-only decoration |
| Session rows stub | `mol-session-row` (×3) | Inert session rows beneath scrim — aria-hidden |
| Sheet overlay | `.view-project-picker-sheet__overlay` | `position:absolute; bottom:0` — contains sheet card |
| Sheet card | `.view-project-picker-sheet__sheet` | `--surface-overlay` bg, `--radius-xl` top corners, `--elevation-sheet` shadow, height `--sheet-snap-half` |
| Drag handle | `atom-home-indicator --sheet-handle --muted` | `--text-faint` pill, centered at sheet top |
| Sheet header | `.view-project-picker-sheet__header` | Spacer + centered "Switch project" title + close icon-button |
| Close button | `atom-icon-button --ghost --md` | X glyph, `aria-label="Close project picker"` |
| Section label | `atom-section-label --faint` | "THIS ORGANIZATION" (uppercase via atom) |
| Project rows (3) | `.view-project-picker-sheet__project-row` | Inline composition: package icon-glyph + name + meta section-label + check glyph trailing |
| superset row | `is-selected` modifier | `surface-active` bg, accent check opacity:1 |
| JustinCode row | unselected | transparent bg, check opacity:0 |
| LaneShadow row | unselected | transparent bg, check opacity:0 |
| Safe area | `.view-project-picker-sheet__safe-area` | `--space-8` bottom buffer inside sheet |

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
| `atom-backdrop --scrim` | Atom | 0.55 opacity scrim over dimmed sessions stub |
| `atom-home-indicator --sheet-handle --muted` | Atom | Drag handle indicator at sheet top |
| `atom-icon-button --ghost --md` | Atom | Close (✕) button in sheet header |
| `atom-icon-glyph --sm --muted` | Atom | Package icon in each project row leading slot |
| `atom-icon-glyph --sm --accent` | Atom | Checkmark in each project row trailing slot |
| `atom-section-label --faint` | Atom | "THIS ORGANIZATION" section label |
| `atom-section-label` (inline) | Atom | Meta text ("4 workspaces · 12 sessions") in each row body |
| `atom-divider --horizontal --hairline` | Atom | Row separator between project rows |
| `atom-pill --default --md` | Atom | Project chip in header stub |
| `atom-icon-button --ghost --md` | Atom | Back/overflow buttons in header stub |
| `mol-session-row` | Molecule | Session rows in dimmed stub (×3, aria-hidden) |
| `atom-status-dot --live --sm` / `--neutral` | Atom | Live / neutral indicators in session stub rows |

**Distinct atom classes composed: 11**
**Distinct molecule classes composed: 1**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--surface-overlay)` | Sheet card background |
| `var(--surface-page)` | App header stub background |
| `var(--surface-active)` | Selected project row background |
| `var(--surface-soft)` | Hover background on project rows |
| `var(--surface-sunken)` | Pane-label background |
| `var(--border-subtle)` | Pane border, preview-plate border, header stub border |
| `var(--radius-xl)` | Sheet top-left and top-right border-radius |
| `var(--radius-subtle)` | Pane-label border-radius |
| `var(--radius-default)` | Pane border-radius |
| `var(--elevation-sheet)` | Sheet card box-shadow |
| `var(--sheet-snap-half)` | Sheet card height (50vh snap point) |
| `var(--touch-target-min)` | Close button dimensions; header spacer width |
| `var(--text-body)` | Project row name and default text |
| `var(--text-muted)` | Pane-label color, preview crumb |
| `var(--motion-fast)` | Row background-color transition |
| `var(--motion-ease-out)` | Row transition easing |
| `var(--font-mono)` | `.crumb` font |
| `var(--font-size-meta)` | `.crumb` size |
| `var(--tracking-mono)` | `.crumb` tracking |
| `var(--line-height-snug)` | Project row name line-height |
| `var(--font-size-body)` | Project row name font size |
| `var(--font-weight-meta)` | Project row name font weight |
| `var(--border-focus)` | Focus ring inset shadow on rows |

## Why Inline Project Rows (Not `mol-host-picker-row` Directly)

The brief instructs a pragmatic approach: `mol-host-picker-row` uses a server SVG glyph in its HTML source, not a package glyph. Rather than fighting the molecule's hardcoded icon, the project rows are inlined using the identical structural pattern (leading icon-glyph + body + trailing check) with a Lucide `package` SVG in the leading slot. The CSS structure mirrors `mol-host-picker-row` exactly, living under the view-scoped `.view-project-picker-sheet__project-row` namespace.

Extraction threshold: this row pattern appears once (in this view). Per Rule of 2, it stays inline. If a workspace-picker or org-picker later reuses the same project-row shape, extract to `mol-project-picker-row` at that point.

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Sheet dialog | `role="dialog" aria-modal="true" aria-label="Switch project"` |
| Project rows list | `role="listbox" aria-label="Projects"` with `aria-labelledby` pointing to the sheet title |
| Project row buttons | `role="option"`, `aria-selected="true/false"`, descriptive `aria-label` (name + workspace count + session count + action) |
| Close button | `aria-label="Close project picker"` |
| Sessions stub / scrim | `aria-hidden="true"` — decorative background, not part of dialog interaction |
| Session rows in stub | `tabindex="-1"` — inert backdrop decoration |
| Dynamic Island / status bar / home indicator | `aria-hidden="true"` — hardware chrome |
| Decorative SVG icons | `aria-hidden="true"` throughout |

## Layout Choices

- **Sheet height = `--sheet-snap-half` (50vh)**: The sheet card uses `height: var(--sheet-snap-half)` with `overflow: hidden` so the project rows scroll internally without overflowing the device viewport boundary.
- **Overlay positioning**: `position: absolute; bottom: 0` inside `atom-device-bezel__content` (which provides `position: relative`). The sheet stacks above the dimmed sessions without leaking outside the device frame.
- **Scrim in sessions-behind**: `atom-backdrop --scrim` is `position: absolute` inside `.view-project-picker-sheet__sessions-behind`, scoping the scrim to the sessions region. The z-index stack is: sessions content (z-index:1) → scrim (z-index:2) → sheet overlay (z-index:10).
- **Header optical centering**: A `.view-project-picker-sheet__header-spacer` of width `--touch-target-min` mirrors the close button so the "Switch project" title remains visually centered between two equal-width flanking areas.
- **`atom-section-label` for row meta**: The row meta text ("4 workspaces · 12 sessions") uses `atom-section-label` directly, identical to the pattern in `mol-host-picker-row` source (comment: "\_\_meta uses atom-section-label directly — no extra class needed").
