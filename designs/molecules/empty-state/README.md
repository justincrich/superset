# mol-empty-state

A centered "nothing here yet" surface that appears when a list has no items to show. Composes atoms to form an accessible status region with a hero icon, optional section label, heading, body copy, and optional CTA button.

---

## Purpose

- Communicates absence of content across four distinct contexts (no hosts, no workspaces, no sessions, no search matches)
- Provides a single clear action for the user to take when one is applicable
- Announces itself to screen readers via `role="status"` and `aria-live="polite"` so dynamic appearance is surfaced without requiring focus movement
- Shares layout and class contract across all four contexts — only slot content changes

---

## Anatomy

```html
<section
  class="mol-empty-state mol-empty-state--no-hosts"
  role="status"
  aria-live="polite"
>
  <!-- Hero icon -->
  <div class="mol-empty-state__hero">
    <svg
      class="atom-icon-glyph atom-icon-glyph--xl atom-icon-glyph--faint"
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <!-- lucide: package-x -->
      <path d="M21 10V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l2-1.14"/>
      <path d="m7.5 4.27 9 5.15"/>
      <polyline points="3.29 7 12 12 20.71 7"/>
      <line x1="12" y1="22" x2="12" y2="12"/>
      <path d="m17 13 5 5m-5 0 5-5"/>
    </svg>
  </div>

  <!-- Optional section label (omit for --no-matches) -->
  <p class="mol-empty-state__label atom-section-label atom-section-label--faint">
    NO HOSTS
  </p>

  <!-- Heading -->
  <h2 class="mol-empty-state__heading type-h2">No devices yet</h2>

  <!-- Body copy -->
  <p class="mol-empty-state__body type-body">
    Connect a Mac running Superset Desktop or sign in there to add your first host.
  </p>

  <!-- CTA (hidden on --no-matches via CSS) -->
  <a
    href="#workspaces"
    class="mol-empty-state__cta atom-button atom-button--primary atom-button--md"
  >
    Go to Workspaces
  </a>
</section>
```

---

## Variants

| Class modifier | Icon (lucide) | Heading | Body copy | CTA |
|---|---|---|---|---|
| `mol-empty-state--no-hosts` (default) | `package-x` | "No devices yet" | "Connect a Mac running Superset Desktop or sign in there to add your first host." | "Go to Workspaces" |
| `mol-empty-state--no-workspaces` | `layers` | "No workspaces on this host" | "Create your first workspace in Superset Desktop on macbook-pro." | "Open macbook-pro" |
| `mol-empty-state--no-sessions` | `message-square-dashed` | "Start your first chat" | "Tap + to start a new chat session in any workspace." | "Start chat" |
| `mol-empty-state--no-matches` | `search` | "No sessions match 'reconnect'" | "Try a shorter or different search term." | (none — hidden by CSS) |

---

## States

Only `default` — the molecule itself carries no interactive states. The `atom-button--primary` CTA handles its own hover / active / focus states.

---

## Atoms used

| Atom | Class applied | Role |
|---|---|---|
| `atom-icon-glyph` | `--xl --faint` | Hero illustration (decorative, `aria-hidden`) |
| `atom-section-label` | `--faint` (default) | Optional small label above the heading ("NO HOSTS") |
| `atom-button` | `--primary --md` | CTA action button; hidden on `--no-matches` |

Plus typography modules `type-h2` (heading) and `type-body` (body copy) — these are utility classes, not atoms.

---

## Token recipe

| Property | Token | Notes |
|---|---|---|
| `padding` | `var(--space-12) var(--space-6)` | 48px block, 24px inline |
| `gap` (flex column) | `var(--space-3)` | 12px between all children |
| `margin-bottom` hero | `var(--space-4)` | 16px extra separation between icon and label |
| `margin-top` CTA | `var(--space-4)` | 16px breathing room above button |
| `max-width` body | `36ch` | Content-adaptive character measure — allowed exception per spec |
| `color` body copy | `var(--text-muted)` | De-emphasised relative to heading |
| `opacity` hero | `0.7` | Softens the xl icon into an illustrative, non-competing role |

**`36ch` exception**: content-adaptive `max-width` in character units ensures the body paragraph line length is comfortable on all viewport widths at this font size without introducing a magic pixel value. This is an explicitly permitted exception per the quality bar.

No TOKEN_GAPs. All spacing uses `var(--space-*)` tokens.

---

## Accessibility

- `<section role="status" aria-live="polite">` — announces the empty state to screen readers when it appears dynamically (e.g., after a search yields no results). `polite` avoids interrupting ongoing announcements.
- Hero icon: `aria-hidden="true"` — purely decorative; meaning is conveyed by the heading and body copy.
- CTA is a real `<a>` or `<button>` with descriptive visible text — never icon-only.
- Heading uses `<h2>` — assumes this molecule appears beneath an `<h1>` page-level header in the app shell.
- `--no-matches` CTA is hidden via `display: none` (CSS rule on the variant), not `visibility: hidden`, so it is fully removed from the accessibility tree.
- No `aria-label` overrides needed — visible text is descriptive for all four variants.
