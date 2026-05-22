# fab-base

## Purpose

The floating action button (FAB) is the primary affordance for starting a new chat session in the sessions list view. It floats above the content layer, is always absolutely positioned, and carries a shadow elevation distinguishing it from all other button atoms. It is never inline — it lives at a fixed layer above the UI.

Distinguished from `icon-button` by: shadow elevation (`--elevation-modal`), larger fixed diameter (56pt / 64pt), pill/round shape only, and absolute positioning requirement.

---

## Anatomy

```html
<!-- Minimal: icon-only FAB (default) -->
<button
  class="atom-fab-base atom-fab-base--accent atom-fab-base--md"
  aria-label="New chat session"
  type="button"
>
  <svg class="atom-fab-base__icon" aria-hidden="true" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
</button>

<!-- Extended: icon + label (--with-label modifier) -->
<button
  class="atom-fab-base atom-fab-base--accent atom-fab-base--md atom-fab-base--with-label"
  aria-label="New chat session"
  type="button"
>
  <svg class="atom-fab-base__icon" aria-hidden="true" width="24" height="24"
       viewBox="0 0 24 24" fill="none" stroke="currentColor"
       stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/>
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
  <span class="atom-fab-base__label">New chat</span>
</button>

<!-- Live-ring: decorative pulse ring during active streaming -->
<div class="atom-fab-base__live-ring-wrap" aria-hidden="true">
  <div class="atom-fab-base__live-ring"></div>
  <button
    class="atom-fab-base atom-fab-base--accent atom-fab-base--md atom-fab-base--live-ring"
    aria-label="New chat session"
    type="button"
  >
    <svg class="atom-fab-base__icon" aria-hidden="true" width="24" height="24"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"/>
      <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  </button>
</div>
```

### Element reference

| Element | Selector | Role |
|---|---|---|
| Button root | `.atom-fab-base` | Interactive button; carries variant, size, state modifiers |
| Icon | `.atom-fab-base__icon` | `aria-hidden="true"` SVG; sized by `--fab-icon-size` local var |
| Label | `.atom-fab-base__label` | Visible text, only present with `--with-label` modifier |
| Live ring wrap | `.atom-fab-base__live-ring-wrap` | Positions the decorative ring behind the button |
| Live ring | `.atom-fab-base__live-ring` | `aria-hidden="true"` — purely decorative pulsing ring |

---

## Variants

| Class | Background token | Text/icon token | Border | Use case |
|---|---|---|---|---|
| `atom-fab-base--accent` (default) | `--accent-primary` | `--accent-primary-fg` | none | Standard ember NewChatFab |
| `atom-fab-base--neutral` | `--surface-inverse` | `--text-on-inverse` | none | High-contrast alternative |
| `atom-fab-base--overlay` | `--surface-overlay` | `--text-body` | `1px solid var(--border-default)` | Subtle FAB (rare) |

---

## Sizes

| Class | Diameter | Icon size | Notes |
|---|---|---|---|
| `atom-fab-base--md` (default) | 56px | 24px | Standard sessions-list FAB |
| `atom-fab-base--lg` | 64px | 28px | Enlarged for reachability or emphasis |

Width/height values are structural geometry — they define the fixed circular form. Icon sizes 24/28 are also structural (SVG viewBox spec).

---

## Modifiers

| Class | Effect |
|---|---|
| `atom-fab-base--with-label` | Extended FAB: pill shape (`--radius-pill`), icon left + label text right; min-width expands to fit content with side padding `--space-5` |
| `atom-fab-base--live-ring` | Applied to the button when an active session is streaming; triggers a mint-colored pulse ring rendered via `.atom-fab-base__live-ring` sibling element |

---

## States

| Class / pseudo | Spec |
|---|---|
| default | Base appearance; elevation `--elevation-modal` |
| `:hover` / `.is-hover` | Elevation lifts slightly; scale 1.05 |
| `:active` / `.is-active` | Scale 0.97; pressed feel |
| `:focus-visible` / `.is-focus` | Focus ring: `box-shadow: 0 0 0 2px var(--surface-page), 0 0 0 4px var(--border-focus)` at 2px gap |
| `.is-disabled` | opacity 0.4; pointer-events: none |
| `.is-loading` | Icon hidden; circular spinner rendered via `::after` pseudo-element |

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `background-color` (accent) | `--accent-primary` | Ember brand |
| `background-color` (accent hover) | `--accent-primary-hover` | color-mix lighter |
| `background-color` (accent active) | `--accent-primary-pressed` | color-mix darker |
| `color` (accent) | `--accent-primary-fg` | Dark surface on ember |
| `background-color` (neutral) | `--surface-inverse` | Inverted neutral |
| `color` (neutral) | `--text-on-inverse` | Text on inverted bg |
| `background-color` (overlay) | `--surface-overlay` | Popover/modal bg |
| `color` (overlay) | `--text-body` | Primary body text |
| `border-color` (overlay) | `--border-default` | Component border |
| `box-shadow` | `--elevation-modal` | FAB floats above content |
| `border-radius` (icon-only) | `--radius-round` (50%) | Perfect circle |
| `border-radius` (with-label) | `--radius-pill` (999px) | Pill extension |
| `transition` timing | `--motion-medium` + `--motion-ease-out` | Scale + shadow transitions |
| Live-ring color | `--state-live-fg` | Mint green |
| Live-ring animation duration | `--motion-cadence-pulse-medium` | 1.4s loop |
| FAB diameter (md) | 56px | Structural geometry exception |
| FAB diameter (lg) | 64px | Structural geometry exception |
| Icon size (md) | 24px | Structural geometry exception |
| Icon size (lg) | 28px | Structural geometry exception |
| Placement right | `--space-4` | From right edge of scroll area |
| Placement bottom | `calc(var(--tab-bar-height) + var(--space-4))` | Above tab bar |

---

## Accessibility

- **Required `aria-label`**: Every FAB must carry an explicit `aria-label`. Recommended values: `"New chat session"` (icon-only) or `"Start new chat"`. The label must describe the action, not the icon.
- **Keyboard order**: The FAB is positioned absolutely outside normal document flow. Ensure it is NOT the first focusable element when keyboard-tabbing into a screen. Place it after the main content list in DOM order so Tab traversal reaches content first.
- **Live ring**: The `.atom-fab-base__live-ring` element and its wrapper carry `aria-hidden="true"`. The ring is purely decorative. The active session status is communicated through other semantic mechanisms (page title, session list items) — not through the ring visual.
- **Loading state**: Use `aria-busy="true"` on the button while `.is-loading` is active. Pair with an `aria-live` region elsewhere on the page announcing the operation result.
- **Disabled state**: Use `aria-disabled="true"` rather than the native `disabled` attribute where possible, to keep the FAB in the focus order for AT users who may need to understand why it is unavailable.
- **Long-press expansion**: When a long-press gesture opens a secondary actions menu (e.g., new chat per workspace), that menu is a separate molecule. The FAB itself does not manage that state.

---

## Structural geometry exceptions

The following raw pixel values are intentional structural geometry and do not have corresponding tokens:

| Value | Reason |
|---|---|
| `56px` / `64px` diameter | FAB fixed sizes per spec; no token maps to these |
| `24px` / `28px` icon size | SVG viewBox structural spec |
| `2px` spinner border width | CSS border-spinner convention (same pattern as `atom-spinner`) |
| `4px` focus ring offset | Standard 2px gap, 4px total ring — visual spec |
