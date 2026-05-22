# settings-permission-denied-banner

## Purpose

The Settings screen state rendered when the user has denied iOS notification permissions. The screen shows a persistent `mol-banner --permission-denied --stacked` at the top of the scroll region, below the header, with an "Open Settings →" CTA that calls `Linking.openSettings()` in React Native. Below the banner, four settings rows provide the rest of the screen content. This is the composition reference for UC-PLATF-01 §B.

## PRD Wireframe Reference

**UC-PLATF-01 §B** — Settings screen with notifications-denied banner

```
┌──────────────────────────────────────┐
│  ← Settings                          │
├──────────────────────────────────────┤
│                                      │
│ ┌──────────────────────────────────┐ │
│ │ ⚠ Notifications are disabled    │ │  ← banner --warning bg
│ │ You'll miss turn updates and     │ │
│ │ pause prompts while backgrounded.│ │
│ │                                  │ │
│ │  Open Settings →                 │ │  ← Linking.openSettings()
│ └──────────────────────────────────┘ │
│                                      │
│  [other settings rows]               │
│                                      │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery indicators |
| App header | `mol-app-header` | Back button, "Settings" title centered, no trailing actions |
| Settings scroll region | `<main role="main">` + `.view-settings-permission-denied-banner__body` | `flex: 1`, `overflow-y: auto` — scrollable settings content |
| Banner wrap | `.view-settings-permission-denied-banner__banner-wrap` | `padding: var(--space-4)` — provides the `var(--space-4)` margin around the banner on all sides |
| Permission-denied banner | `mol-banner --permission-denied --stacked` | Warning bg, bell icon, "Notifications are disabled" heading, body explainer, "Open Settings →" secondary button |
| Settings rows container | `.view-settings-permission-denied-banner__rows` | flex column wrapping the four rows |
| Theme row | `.view-settings-permission-denied-banner__row` | moon icon + "Theme" label + "Dark" value + chevron-right |
| Sign out row | `.view-settings-permission-denied-banner__row --destructive` | log-out icon + "Sign out" label in `var(--state-danger-fg)` |
| About row | `.view-settings-permission-denied-banner__row` | info icon + "About" label + chevron-right |
| Version row | `.view-settings-permission-denied-banner__row --static` | code icon + "Version" label + "1.0.0" value, no chevron, `pointer-events: none` |
| Row dividers | `atom-divider --horizontal --hairline` | Separates each row; also appears above the first row and below the last |
| Home indicator | `atom-device-bezel__home-indicator` | iOS home pill, absolute at viewport bottom |

## Composition Table

Every atom and molecule used in this view:

| Class | Type | Role |
|-------|------|------|
| `atom-device-bezel` | Atom | iPhone 16 Pro Max shell |
| `atom-device-bezel__viewport` | Atom sub-element | 430×932 content area |
| `atom-device-bezel__dynamic-island` | Atom sub-element | OLED pill |
| `atom-device-bezel__status-bar` | Atom sub-element | Time + indicators |
| `atom-device-bezel__home-indicator` | Atom sub-element | iOS home pill |
| `atom-icon-button --ghost --md` | Atom | Back button in header |
| `atom-icon-glyph --sm --muted` | Atom | Leading icon in each settings row (moon, log-out, info, code) |
| `atom-icon-glyph --xs --faint` | Atom | Trailing chevron-right in navigable rows (Theme, About) |
| `atom-icon-glyph --sm` (via mol-banner) | Atom | Bell icon in banner header row |
| `atom-tool-status-rule --horizontal --pending` | Atom | Top accent rule inside banner (warning amber) |
| `atom-button --secondary --sm` | Atom | "Open Settings →" CTA inside banner |
| `atom-divider --horizontal --hairline` | Atom | Row separators |
| `mol-app-header` | Molecule | Back button + "Settings" title header |
| `mol-banner --permission-denied --stacked` | Molecule | Full stacked banner with icon, heading, body, CTA |

**Distinct atom classes composed: 10**
**Distinct molecule classes composed: 2**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-4)` | Padding, gap, margins in view glue |
| `var(--surface-page)` | `body` background |
| `var(--surface-soft)` | Preview plate background; row hover state |
| `var(--surface-sunken)` | Pane-label background |
| `var(--surface-active)` | Row active (pressed) state |
| `var(--border-subtle)` | Pane border, pane-label border; preview plate bottom border |
| `var(--border-focus)` | Row focus-visible ring |
| `var(--radius-default)` | Pane border-radius |
| `var(--radius-subtle)` | Pane-label border-radius |
| `var(--text-muted)` | `.crumb` color, pane-label color; row value text ("Dark", "1.0.0") |
| `var(--text-body)` | Row label text |
| `var(--state-danger-fg)` | "Sign out" row label color via `--destructive` modifier |
| `var(--touch-target-min)` | Header trailing spacer width |
| `var(--font-mono)` | `.crumb` font |
| `var(--font-size-meta)` | `.crumb` and pane-label font size |
| `var(--tracking-mono)` | `.crumb` and pane-label letter spacing |

## Banner Token Notes

The `mol-banner --permission-denied` variant uses the same warning semantic tokens as `mol-banner --offline`:

| Surface | Token |
|---------|-------|
| Banner background | `var(--state-warning-bg)` |
| Top accent rule | `var(--state-warning-fg)` via `atom-tool-status-rule--pending` |
| Icon color | `var(--state-warning-fg)` via `.mol-banner__icon` |
| Heading color | `var(--state-warning-fg)` via `.mol-banner__text` |
| Body text | `var(--text-muted)` via `.mol-banner__body` |

These are defined in `designs/organisms/_molecules.css` under the `.mol-banner` section. The `--permission-denied` modifier does not add new color rules — it inherits the warning palette that is the `mol-banner` default.

## Settings Rows Design Decisions

### Row height
Each row has `min-height: 44px` matching Apple's HIG 44pt minimum touch target for list rows. Vertical padding is omitted from the row itself because the label text is vertically centered via `align-items: center` with the min-height constraint.

### Inline composition vs. extracted molecule
The settings rows are implemented as view-local composition (`.view-settings-permission-denied-banner__row`) rather than a new shared molecule because this pattern appears once in the current design scope (Rule of 2 — no second consumer exists yet). When a second settings screen is designed, these rows should be promoted to a `mol-settings-row` molecule.

### Destructive row (Sign out)
The `--destructive` modifier on the row sets `color: var(--state-danger-fg)` on the label only. The leading icon retains `atom-icon-glyph--muted` (standard muted color) to avoid over-emphasizing the destructive intent. This mirrors iOS HIG convention where destructive list items use red text but standard icon treatment.

### Static version row
The Version row uses a `<div>` instead of `<button>` and carries `pointer-events: none` via the `--static` modifier. No trailing chevron is rendered because there is no navigation target. The `aria-label` on the div still communicates the value to assistive technology.

### Dividers
`atom-divider --hairline` is placed as `<hr>` elements between rows (and above the first / below the last) rather than using CSS border on individual rows. This avoids double-borders at row boundaries and keeps the rows themselves free of border rules, consistent with the pattern used across the molecule library.

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Screen landmark | `<main role="main" aria-label="Settings">` |
| App header landmark | `<header role="banner">` |
| Back button | `aria-label="Back"` |
| Banner | `role="status" aria-live="polite" aria-label="Notifications are disabled"` — non-assertive live region |
| Settings list | `role="list"` on container, `role="listitem"` on each row — explicit list semantics since rows are `<button>` and `<div>` elements |
| Theme row | `aria-label="Theme: Dark"` — includes current value so screen reader announces complete state |
| Sign out row | `aria-label="Sign out of your account"` |
| About row | `aria-label="About Superset"` |
| Version row | `aria-label="App version 1.0.0"` — value embedded in label for static element |
| Open Settings CTA | `aria-label="Open iOS notification settings"` — more descriptive than visible text alone |
| Decorative icons | All SVGs `aria-hidden="true"` |
| Status bar / Dynamic Island | `aria-hidden="true"` — purely decorative chrome |

## Layout Choices

- **Banner position**: Rendered inside `.view-settings-permission-denied-banner__banner-wrap` which provides `padding: var(--space-4)` on all four sides, giving the banner the `var(--space-4)` margin specified in the brief.
- **Header trailing spacer**: A `width: var(--touch-target-min)` spacer `div` balances the back button on the left, keeping the "Settings" title visually centered without using `mol-app-header--no-back` and its padding compensation.
- **Scroll region**: The `<main>` block uses `flex: 1; overflow-y: auto` so it fills all space between the sticky header and the viewport bottom, making the settings list scrollable when content exceeds the visible area.
- **No composer footer**: The Settings screen has no chat composer. The `flex: 1` scroll region fills to the home indicator naturally.
