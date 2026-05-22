# push-pre-prompt-screen

## Purpose

The in-app notification permission pre-prompt for the Superset mobile app. Shown before the OS-level `requestPermissionsAsync()` dialog to give users context on why notifications are valuable. If the user taps "Not now," the OS dialog is deferred entirely — no permission is requested from the platform. This is the composition reference for UC-PLATF-01 §A.

## PRD Wireframe Reference

**UC-PLATF-01 §A** — In-app pre-prompt before OS notification permission dialog

```
┌──────────────────────────────────────┐
│  ←                                   │
├──────────────────────────────────────┤
│                                      │
│               🔔                     │  ← bell icon --xl --accent
│                                      │
│   Stay in the loop                   │  ← .type-h1
│                                      │
│   Get notified when Claude           │
│   finishes a task or needs your      │
│   input — even when the app is       │
│   in the background.                 │
│                                      │
│   ┌──────────────────────────────┐   │
│   │       Enable notifications   │   │  ← atom-button --primary --md
│   └──────────────────────────────┘   │
│                                      │
│          Not now                     │  ← atom-button --link --md
│                                      │
└──────────────────────────────────────┘
```

## Anatomy (top to bottom)

| Region | Element | Notes |
|--------|---------|-------|
| Device shell | `atom-device-bezel` | iPhone 16 Pro Max (444×962), contains all view chrome |
| Dynamic Island | `atom-device-bezel__dynamic-island` | Decorative — OLED-off black pill |
| Status bar | `atom-device-bezel__status-bar` | 9:41, signal/wifi/battery indicators |
| App header | `mol-app-header` | Back button only — no title text, empty `__title-wrap` |
| Pre-prompt body | `<main role="main">` + `.view-push-pre-prompt-screen__body` | `flex: 1`, centers `mol-empty-state` vertically + horizontally |
| Pre-prompt content | `mol-empty-state` | Bell hero icon, "Stay in the loop" headline, body copy, primary CTA, "Not now" deferred action |
| Bell icon | `atom-icon-glyph --xl --accent` | Bell SVG, `var(--accent-primary)` color via `--accent` modifier |
| Headline | `.type-h1` inside `mol-empty-state__heading` | "Stay in the loop" |
| Body copy | `.type-body` inside `mol-empty-state__body` | `max-width: 32ch` via view-local override |
| Primary CTA | `atom-button --primary --md` | "Enable notifications" — full-width up to 280px, triggers `requestPermissionsAsync()` |
| Deferred action | `atom-button --link --md` | "Not now" — dismisses screen without triggering OS dialog |
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
| `atom-icon-button --ghost --md` | Atom | Back button |
| `atom-icon-glyph --xl --accent` | Atom | Bell hero icon |
| `atom-button --primary --md` | Atom | "Enable notifications" CTA |
| `atom-button --link --md` | Atom | "Not now" deferred action |
| `mol-app-header` | Molecule | Back button header row (no title) |
| `mol-empty-state` | Molecule | Centered pre-prompt content: icon, headline, body, CTA stack |

**Distinct atom classes composed: 7**
**Distinct molecule classes composed: 2**

## Token Recipe

Every CSS custom property used in the view's own `<style>` block:

| Token | Usage |
|-------|-------|
| `var(--space-1)` through `var(--space-8)` | Padding, gap, margins in view glue rules |
| `var(--surface-page)` | Body background |
| `var(--surface-soft)` | Preview plate background |
| `var(--surface-sunken)` | Pane-label background |
| `var(--border-subtle)` | Pane border, pane-label border, preview plate bottom border |
| `var(--radius-default)` | Pane border-radius |
| `var(--radius-subtle)` | Pane-label border-radius |
| `var(--touch-target-min)` | Header actions spacer width — symmetry with back button |
| `var(--font-mono)` | `.crumb` font in preview plate |
| `var(--font-size-meta)` | `.crumb` font size, pane-label font size |
| `var(--text-muted)` | `.crumb` color, pane-label color |
| `var(--tracking-mono)` | `.crumb` and pane-label letter spacing |
| `var(--accent-primary)` | Bell icon color via `atom-icon-glyph--accent` modifier (no inline style needed) |

## Layout Choices

- **Body flex centering**: `.view-push-pre-prompt-screen__body` uses `display: flex; align-items: center; justify-content: center` with `flex: 1` to fill the available space between the header and home indicator, centering the `mol-empty-state` vertically and horizontally.
- **mol-empty-state reuse**: The molecule handles all column layout, gap, and text-align: center internally. The view only adds a `max-width: 32ch` override on `mol-empty-state__body` and column layout + centering on `mol-empty-state__cta` to stack the two buttons correctly.
- **Primary CTA sizing**: `width: 100%; max-width: 280px` gives the "Enable notifications" button a full-width feel on small viewports while capping at the comfortable 280px target.
- **Header symmetry**: The `__actions` slot contains an invisible spacer `<span>` matching `var(--touch-target-min)` width. This counterbalances the back button in `__back` so the `__title-wrap` is properly centered even though it contains no text. No inline styles on layout-structural elements; the spacer width uses the token.
- **No composer footer**: This screen is a standalone modal-style gate, not a chat view. No composer region is rendered.
- **No scroll region**: Content is short enough to fit without scrolling. `overflow: hidden` on the body region prevents accidental scroll on the empty-state container.

## Accessibility

| Feature | Implementation |
|---------|---------------|
| Main landmark | `<main role="main" aria-label="Enable notifications">` |
| App header landmark | `<header role="banner">` |
| Back button | `aria-label="Back"` |
| Bell icon | `aria-hidden="true"` on both the wrapper div and SVG — decorative, headline conveys purpose |
| Headline element | `<h1>` — this is a full-screen gate, not a section heading; h1 is appropriate |
| Primary CTA | `aria-label="Enable notifications"` — visible text matches label, explicit for assistive tech |
| "Not now" button | `aria-label="Not now — defer notification permission"` — clarifies deferred intent |
| Status bar / Dynamic Island | `aria-hidden="true"` — purely decorative chrome |
| Empty title wrap | `aria-hidden="true"` — prevents screen reader from announcing an empty landmark |
| Header spacer span | `aria-hidden="true"` — structural layout element, not content |
