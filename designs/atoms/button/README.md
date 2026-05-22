# button

## Purpose
The fundamental tappable action affordance — primary CTAs, secondary actions, destructive operations, ghost toolbar controls. Mobile-tuned with a 44pt minimum touch target on `md`.

## Anatomy
```html
<button class="atom-button atom-button--primary atom-button--md">
  Send
</button>
```

## Variants
| Class | Bg token | Text token | Border token | Use case |
|---|---|---|---|---|
| `atom-button--primary` | `--accent-primary` | `--accent-primary-fg` | — | Send, Approve, ember CTAs |
| `atom-button--neutral` | `--surface-inverse` | `--text-on-inverse` | — | High-contrast neutral CTA |
| `atom-button--secondary` | `--surface-soft` | `--text-body` | — | Less prominent actions |
| `atom-button--ghost` | transparent | `--text-body` | — | Toolbar buttons |
| `atom-button--outline` | transparent | `--text-body` | `--border-default` | Secondary affordance |
| `atom-button--destructive` | `--state-danger-fg` | `--accent-primary-fg` | — | Delete, decline |
| `atom-button--link` | transparent | `--text-link` | — | Inline link-as-button |

## Sizes
| Class | Height | Padding-X | Min hit |
|---|---|---|---|
| `atom-button--sm` | 36px | `var(--space-3)` | desktop only |
| `atom-button--md` (default) | `var(--touch-target-min)` 44px | `var(--space-4)` | mobile-safe |
| `atom-button--lg` | 56px | `var(--space-6)` | pause-footer, hero |

## States
| Class | Spec |
|---|---|
| default | base |
| `.is-hover` | hover surrogate — lighten bg via opacity / hover token |
| `.is-active` | pressed — darken bg / shift transform |
| `.is-focus` | `box-shadow: 0 0 0 3px var(--border-focus)`, no outline |
| `.is-disabled` | opacity 0.5, pointer-events: none |
| `.is-loading` | spinner replaces label; size preserved |

## Token recipe

| CSS Property | Token Used | Notes |
|---|---|---|
| `background-color` (primary) | `--accent-primary` | Ember brand |
| `background-color` (primary hover) | `--accent-primary-hover` | color-mix lighter |
| `background-color` (primary active) | `--accent-primary-pressed` | color-mix darker |
| `color` (primary) | `--accent-primary-fg` | Dark surface on ember |
| `background-color` (neutral) | `--surface-inverse` | Inverted neutral fill |
| `color` (neutral) | `--text-on-inverse` | Text on inverted bg |
| `background-color` (secondary) | `--surface-soft` | Subtle panel bg |
| `color` (secondary) | `--text-body` | Primary body text |
| `background-color` (secondary hover) | `--surface-active` | Highlighted row bg |
| `color` (ghost) | `--text-body` | Primary body text |
| `background-color` (ghost hover) | `--surface-soft` | Subtle hover fill |
| `border-color` (outline) | `--border-default` | Component border |
| `color` (outline) | `--text-body` | Primary body text |
| `background-color` (outline hover) | `--surface-soft` | Subtle hover fill |
| `background-color` (destructive) | `--state-danger-fg` | Danger red |
| `color` (destructive) | `--accent-primary-fg` | White on red |
| `color` (link) | `--text-link` | Ember link color |
| `border-radius` | `--radius-default` | 8px base radius |
| `padding-inline` (sm) | `--space-3` | 12px |
| `padding-inline` (md) | `--space-4` | 16px |
| `padding-inline` (lg) | `--space-6` | 24px |
| `height` (sm) | `36px` literal (no token) | Compact toolbar |
| `height` (md) | `var(--touch-target-min)` | 44px WCAG/iOS HIG |
| `height` (lg) | `56px` literal (no token) | Hero CTA |
| `gap` (icon + label) | `--space-2` | 8px |
| `box-shadow` (focus) | `0 0 0 3px var(--border-focus)` | Focus ring |
| `font-family` | `var(--font-body)` | via base reset |
| `font-size` | `var(--font-size-label)` | 12px label scale |
| `font-weight` | `var(--font-weight-label)` | 500 |
| `letter-spacing` | `var(--tracking-mono)` | 0.02em |
| `transition` | `var(--motion-fast)` | 120ms |
| `@keyframes spin` duration | `var(--motion-slow)` | 360ms spinner |

## Accessibility
- `role="button"` (implicit for `<button>`)
- Keyboard: `Enter` / `Space` activate
- Focus ring rendered via `--border-focus` ring, NEVER removed without replacement
- Disabled state sets `aria-disabled="true"` and `pointer-events: none`
- Loading state sets `aria-busy="true"`
- All variants meet WCAG 2.1 contrast AA:
  - `primary`: ember (`#e07850`) on dark surface (`#151110`) — ember-fg is the same dark surface ensuring adequate contrast on ember bg
  - `neutral`: near-white/near-black text on inverted surface — maximum contrast
  - `destructive`: white-ish fg on red bg — checked against `--_red` values
  - `ghost` / `secondary` / `outline`: body text on page/soft surfaces — body text is `--_neutral-fg-0` (near-white in dark, near-black in light)
  - `link`: ember hue meets AA against both surface-page backgrounds
