# mol-bottom-tab-bar-item

A single tappable item in the bottom tab navigation bar. Stacks an icon over a mono-uppercase label; receives an optional accent notification dot. Part of the UC-NAV §A bottom navigation pattern.

Corresponds to the `✓ Tasks | 💬 Chat | ⋯ More` wireframe row from UC-NAV §A.

---

## Purpose

- Gives the user a persistent, thumb-reachable primary navigation affordance at the bottom of every view.
- Communicates which tab is active via ember accent color on both icon and label.
- Signals pending content via a notification dot (badge) on the icon without expanding the tap footprint.

---

## Anatomy

```html
<button class="mol-bottom-tab-bar-item mol-bottom-tab-bar-item--chat is-selected"
        aria-current="page"
        aria-label="Chat tab, currently selected">

  <span class="mol-bottom-tab-bar-item__icon-wrap">
    <svg class="atom-icon-glyph atom-icon-glyph--md mol-bottom-tab-bar-item__icon"
         aria-hidden="true">…message-square…</svg>
  </span>

  <span class="atom-section-label mol-bottom-tab-bar-item__label">Chat</span>

</button>
```

With notification dot:
```html
<button class="mol-bottom-tab-bar-item mol-bottom-tab-bar-item--tasks is-notification"
        aria-label="Tasks tab, 3 new tasks">

  <span class="mol-bottom-tab-bar-item__icon-wrap">
    <svg class="atom-icon-glyph atom-icon-glyph--md mol-bottom-tab-bar-item__icon"
         aria-hidden="true">…check…</svg>
    <span class="atom-badge atom-badge--accent atom-badge--dot mol-bottom-tab-bar-item__notif"
          aria-hidden="true"></span>
  </span>

  <span class="atom-section-label mol-bottom-tab-bar-item__label">Tasks</span>

</button>
```

---

## Variants (kind)

| Class modifier | Icon glyph | Label text |
|---|---|---|
| `mol-bottom-tab-bar-item--tasks` (default tab) | `check` (20×20) | Tasks |
| `mol-bottom-tab-bar-item--chat` | `message-square` (20×20) | Chat |
| `mol-bottom-tab-bar-item--more` | `more-horizontal` (20×20) | More |

---

## States

| Class | Effect |
|---|---|
| `default` (unselected) | `color: var(--text-muted)` — icon + label both muted |
| `is-selected` | `color: var(--accent-primary)` — icon + label both ember accent; `aria-current="page"` added |
| `is-hover` | `color: var(--text-body)` (only when not selected) |
| `is-active` | `opacity: 0.7` + `transform: scale(0.95)` — pressed feedback |
| `is-focus` | `outline: 2px solid var(--border-focus)` inset, `border-radius: var(--radius-default)` |
| `is-notification` | Renders `.mol-bottom-tab-bar-item__notif` dot (accent badge) overlaid top-right of the icon wrap |

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-icon-glyph` | `--md` | Tab icon (check / message-square / more-horizontal) |
| `atom-section-label` | base (muted); add no modifier — color inherits from parent via `color: inherit` | Tab label (TASKS / CHAT / MORE) |
| `atom-badge` | `--accent --dot` | Notification dot — optional, overlaid top-right of icon-wrap |

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `flex` | `1` | Each item takes equal share of bar width |
| `flex-direction` | `column` | Icon stacked above label |
| `gap` | `var(--space-1)` | 4px icon-to-label vertical gap |
| `padding` | `var(--space-2) var(--space-1)` | 8px block / 4px inline |
| `min-height` | `var(--touch-target-min)` | 44px — WCAG AA + iOS HIG |
| `color` (default) | `var(--text-muted)` | Unselected state |
| `color` (selected) | `var(--accent-primary)` | ember brand accent |
| `color` (hover) | `var(--text-body)` | Hover uplift (not selected) |
| `opacity` (active) | `0.7` | Press feedback |
| `transform` (active) | `scale(0.95)` | Press feedback |
| `outline` (focus) | `2px solid var(--border-focus)` | Focus ring |
| `outline-offset` (focus) | `-2px` | Inset ring |
| `border-radius` (focus) | `var(--radius-default)` | Follows button shape |
| notif `top` | `-2px` | Structural overlap offset |
| notif `right` | `-4px` | Structural overlap offset |
| transition | `color var(--motion-fast) var(--motion-ease-out)` | Color crossfade on state change |

**Structural exceptions**: `-2px` / `-4px` notif offsets are geometry values required to overlap the icon-wrap corner. These are structural layout constants consistent with other atom overlay offsets (e.g. `atom-avatar--live-indicator::after right: -2px`).

---

## Accessibility

- The active tab button carries `aria-current="page"` so screen readers announce it as the current page without relying on visual color alone.
- Unselected tabs omit `aria-current` entirely (do not set `aria-current="false"` — that leaks implementation detail to AT users).
- When a notification dot is present, the button's `aria-label` describes the count: `"Tasks tab, 3 new tasks"`. The dot itself is `aria-hidden="true"` because the label already conveys the information.
- Icon SVGs are `aria-hidden="true"` — the button's `aria-label` is the accessible name.
- `min-height: var(--touch-target-min)` (44px) satisfies WCAG 2.5.5 target size and iOS HIG.
- The button is a native `<button>` element — keyboard activation (Enter/Space) and focus management work without additional ARIA roles.
- Color is not the sole indicator of state — selected tab also uses `aria-current="page"`.
