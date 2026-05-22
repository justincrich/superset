# sessions-list-loaded

**UC-NAV §A** — Canonical Chat tab landing. The project-first sessions list, shown when the user has at least one session and the list is fully loaded.

## Purpose

This is the root view for the Chat tab. It answers the question: "what is the user looking at when they tap the Chat tab and have existing sessions?" The project chip header lets users switch between projects; the sessions list shows all sessions for the active project with branch + host + recency metadata.

## Composition

| Region | Component |
|--------|-----------|
| Device frame | `atom-device-bezel` (iPhone 16 Pro Max, 444 × 962) |
| Header | `mol-project-chip-header --multi-project` — hamburger + project chip (superset) + search input + settings/filter icon-button |
| Sessions list | Scroll region with 5 × `mol-session-row` + `atom-divider --hairline` between rows |
| FAB | `atom-fab-base --accent --md` with plus icon, `aria-label="New chat"`, positioned `absolute` bottom-right above tab bar |
| Tab bar | `view-sessions-list-loaded__tab-bar` — 3 × `mol-bottom-tab-bar-item`: Tasks (with `atom-badge --dot` notification) · Chat (is-selected) · More |

## Session row data

Each row uses `mol-session-row` with an inline-composed meta line (view-local classes). The meta line renders: `atom-icon-glyph --xs --faint` (git-branch SVG) + branch name + `·` separator + `atom-icon-glyph --xs --faint` (laptop or cloud SVG) + host name + `·` + timestamp + optional status badge.

| # | Status dot | Title | Branch | Host | Time / Status |
|---|---|---|---|---|---|
| 1 | `--live` (pulsing mint) | Chat-v2 design | chat-mobile-plan | macbook (laptop) | 2m ago · streaming |
| 2 | `--live` | Migration plan | api-rewrite | cloud-1 (cloud) | 5m ago · streaming |
| 3 | `--neutral` | API cleanup | chat-mobile-plan | macbook (laptop) | 1h ago |
| 4 | `--warning` | Auth refactor | main | desktop (laptop) | pause pending |
| 5 | `--neutral` | Hot-fix backport | main | desktop (laptop) | 1d ago |

## View-local classes

All layout glue lives under the `view-sessions-list-loaded__*` namespace. No `.atom-*` or `.mol-*` rules are redefined.

| Class | Purpose |
|-------|---------|
| `__list` | `flex: 1; overflow-y: auto` — grows to fill space between header and tab bar |
| `__items` | Unstyled ordered list container |
| `__meta-row` | Flex row for branch icon + branch name + separator + host icon + host + time |
| `__meta-sep` | Faint `·` separator glyph |
| `__meta-text` | Mono, meta-size, muted — branch/host/time labels |
| `__meta-status--live` | `var(--state-live-fg)` — "streaming" label |
| `__meta-status--warning` | `var(--state-warning-fg)` — "pause pending" label |
| `__tab-bar` | Flex row, hairline top border, `--surface-page` bg, `backdrop-filter: blur(20px)` |
| `__fab-wrap` | `position: absolute; right: --space-4; bottom: touch-target + --space-6` — above tab bar |

## Theme

Renders in both dark (default) and light panes, stacked vertically. All colors resolve through `tokens.css` — no hex literals.

## Design decisions

- Meta line is composed inline in the view (not a new molecule) because the project-first branch + host layout differs from the workspace-first `mol-session-row` original. Rule of 2 not met — single view usage.
- FAB uses `atom-fab-base --accent --md` (not `mol-scroll-back-button`) as specified. Positioned above the tab bar via absolute + bottom offset.
- Tab bar backdrop blur is view-local layout glue — a structural property of this screen, not a molecule concern.
- No `atom-scroll-fade` on the list because the list is short enough to be fully visible; it can be added by consuming views when content overflows.
