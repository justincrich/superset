# Atom Inventory — Phase 2

Single-purpose, indivisible primitives used by chat + adjacent surfaces. Each atom is dispatched sequentially via the design-deconstruct PHASE-CONTRACTS § 2 template.

| # | Atom | Source reference (production code) | Status |
|---|------|------------------------------------|--------|
| 1 | `button` | `packages/ui/src/components/ui/button.tsx` (shadcn cva) | completed |
| 2 | `icon-button` | square 44pt variant of button + `lucide-react` icons | completed |
| 3 | `status-dot` | live (mint pulse) · warning (amber ring) · danger (red) · success · neutral · streaming | completed |
| 4 | `streaming-cursor` | inline mint block, blinks via `@keyframes blink` 1s | completed |
| 5 | `divider` | hairline horizontal + vertical, default / strong variants | completed |
| 6 | `text-input` | single-line text field; default / focus / error / disabled | completed |
| 7 | `textarea` | multi-line auto-grow; placeholder / typing / disabled | completed |
| 8 | `pill` | base pill — used by chips, slash command pills, model badges; default / selected / dismissible | completed |
| 9 | `kbd` | keyboard glyph for shortcut hints (`⌘ ⏎`, `Esc`) | completed |
| 10 | `backdrop` | full-screen dimmer; opaque / translucent / blur variants | completed |
| 11 | `tooltip` | positioned bubble with arrow; top / bottom / left / right | completed |
| 12 | `spinner` | circular spinner + ASCII spinner (matches `AsciiSpinner.tsx`) | completed |
| 13 | `progress-dots` | 3-dot loading indicator | completed |
| 14 | `toast-base` | single toast layout; success / error / info / loading | completed |
| 15 | `avatar` | single-letter / icon / image; circle, sizes sm/md/lg | completed |
| 16 | `icon-glyph` | lucide stroke icons sized 14/16/20/24 via tokens | completed |
| 17 | `live-activity-dot` | Dynamic Island pulsing dot — live / paused / dormant | completed |
| 18 | `section-label` | mono uppercase wide-tracking label (`.type-meta` consumer) | completed |
| 19 | `tool-status-rule` | 3px left accent in 4 status colors (running/done/pending/error) | completed |
| 20 | `fab-base` | 56pt circular floating action button | completed |
| 21 | `hit-target-wrapper` | invisible 44pt min tap zone wrapper | completed |
| 22 | `scroll-fade` | top/bottom gradient fade overlay | completed |
| 23 | `badge` | small count / status badge (`1 of N`, `New`) | completed |
| 24 | `device-bezel` | iPhone 16 Pro Max bezel shell (used to frame views) | completed |
| 25 | `home-indicator` | iOS home-indicator pill | completed |

**Dispatch order**: priority on visual-language-defining atoms first (button → status-dot → streaming-cursor → pill → icon-glyph → divider), then chrome (device-bezel, home-indicator, live-activity-dot), then remaining.

**Cascade policy**: if a higher-layer subagent (molecule/organism/view) requests a missing variant via VARIANT_REQUEST, orchestrator dispatches a targeted update to the relevant atom + regenerates the variant table per REGEN-CASCADE.md.
