# atom · badge

## Purpose

A compact count or status indicator that sits *atop* another element or inline beside a label. Smaller than `pill` (16–20px height). Carries a single token of content — a number, a short abbreviation, or nothing (dot-only indicator). Has no interactive states beyond default and disabled.

Not the same as `pill`: badge is non-interactive, positionally anchored to a parent (typically `position: absolute`), and tightly sized to its content.

---

## Anatomy

```
┌──────────────┐
│  .atom-badge │  ← outer element (span or div)
│  ┌────────┐  │
│  │ [text] │  │  ← .type-meta or .type-label text node (pill shape)
│  └────────┘  │     (absent for dot shape)
└──────────────┘
```

**Dot shape** has no inner text — it is a pure 8×8 circle.

---

## Variants

| Class modifier          | Background              | Text color               | Use case                                 |
|-------------------------|-------------------------|--------------------------|------------------------------------------|
| `atom-badge--accent` (default) | `--accent-primary`      | `--accent-primary-fg`    | New sessions, primary count, ember dot   |
| `atom-badge--neutral`   | `--surface-soft`        | `--text-body`            | "1 of N" progress indicator              |
| `atom-badge--live`      | `--state-live-fg`       | `--accent-primary-fg`    | Streaming count, active agent indicator  |
| `atom-badge--danger`    | `--state-danger-fg`     | `--accent-primary-fg`    | Error count, alert badge                 |

---

## Shape variants

| Class modifier        | Description                                                        |
|-----------------------|--------------------------------------------------------------------|
| `atom-badge--pill` (default) | Rounded rectangle. Padding `var(--space-1) var(--space-2)`. `border-radius: var(--radius-pill)`. |
| `atom-badge--dot`     | Solid circle, 8×8px. No text. Pure presence indicator.             |

---

## Sizes (pill shape only — dot is single-size)

| Class modifier       | Height | Min-width | Typography class |
|----------------------|--------|-----------|------------------|
| `atom-badge--sm` (default) | 16px   | 16px      | `.type-meta`     |
| `atom-badge--md`     | 18px   | 18px      | `.type-meta`     |
| `atom-badge--lg`     | 20px   | 20px      | `.type-label`    |

Dot badges ignore size modifiers — they are always 8×8px.

---

## States

| State class   | Behaviour                       |
|---------------|---------------------------------|
| _(none)_      | Default visible state           |
| `is-disabled` | `opacity: 0.5` — no pointer events |

---

## Token recipe

| Property         | Token                        | Notes                                          |
|------------------|------------------------------|------------------------------------------------|
| background       | `--accent-primary` etc.      | Per variant table above                        |
| color            | `--accent-primary-fg` etc.   | Per variant table above                        |
| border-radius    | `--radius-pill`              | Pill shape; `--radius-round` (50%) for dot     |
| padding (pill)   | `var(--space-1) var(--space-2)` | 4px 8px                                     |
| font-family      | `--font-mono`                | Via `.type-meta` / `.type-label`               |
| font-size        | `--font-size-meta` / `--font-size-label` | Never declare numerics directly   |
| font-weight      | `--font-weight-meta` / `--font-weight-label` | Via type module classes         |
| letter-spacing   | `--tracking-mono`            | Via type module classes                        |
| text-transform   | uppercase                    | Via `.type-meta` / `.type-label`               |
| height (sm)      | 16px                         | Structural geometry — numeric allowed          |
| height (md)      | 18px                         | Structural geometry — numeric allowed          |
| height (lg)      | 20px                         | Structural geometry — numeric allowed          |
| dot size         | 8×8px                        | Structural geometry — numeric allowed          |

---

## Accessibility

**Standalone status badge with semantic meaning** (e.g., unread count on a tab that has no adjacent label):
```html
<span class="atom-badge atom-badge--accent atom-badge--sm"
      role="status"
      aria-label="3 unread messages">3</span>
```

**Numeric counter badge with an adjacent visible label** (parent text already describes the count):
```html
<!-- Parent: "Chat (3 unread)" — badge is decorative -->
<span class="atom-badge atom-badge--accent atom-badge--sm"
      aria-hidden="true">3</span>
```

**Dot indicator as a standalone signal** (e.g., live streaming dot with no adjacent text):
```html
<span class="atom-badge atom-badge--accent atom-badge--dot"
      role="img"
      aria-label="streaming"></span>
```

**Dot indicator alongside a label** (label already communicates state):
```html
<!-- "Live" label is visible — dot is decorative -->
<span class="atom-badge atom-badge--live atom-badge--dot"
      aria-hidden="true"></span>
```

**Positional placement** — badges that overlay icons use `position: absolute` on a `position: relative` wrapper. The wrapper receives the accessible label, not the badge element.
