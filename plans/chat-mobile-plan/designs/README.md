# Superset Mobile Chat — High-Fidelity HTML Mockups

26 high-fidelity HTML mockups for the chat-mobile-sprint-1 PRD, designed as a precursor to the `pixel-perfect:build` skill. Each mockup renders inside an iPhone 16 Pro Max frame (430 × 932 viewport) so the design can be reviewed at correct aspect ratio.

> Open [`index.html`](./index.html) for the contact sheet of all 26 frames.

## Aesthetic direction

**"Refined developer minimalism, OLED-first."** Dark, technical, editorial. The Superset mobile app forces dark mode (`#09090b`), so the mockups lean into that with OLED black + cool neutrals + one strategic live-state accent.

| Token | Value | Used for |
| --- | --- | --- |
| `--bg` | `hsl(240 10% 3.9%)` | App background |
| `--surface` | `hsl(240 6% 8%)` | Cards, sheet bodies, user bubbles |
| `--surface-elev` | `hsl(240 5% 12%)` | Popovers, elevated surfaces |
| `--surface-popover` | `hsl(240 5% 14%)` | Popover ceiling |
| `--border` | `hsl(240 4% 16%)` | Hairline dividers |
| `--border-strong` | `hsl(240 4% 22%)` | Input outlines, sticky-footer edges |
| `--fg` | `hsl(0 0% 98%)` | Primary text |
| `--fg-muted` | `hsl(240 5% 65%)` | Timestamps, secondary text |
| `--fg-dim` | `hsl(240 4% 45%)` | Tertiary, placeholders |
| `--accent-live` | `hsl(160 84% 55%)` | Streaming, running, FAB ring (sparing) |
| `--accent-warn` | `hsl(38 92% 60%)` | Pause-pending, approval prompts |
| `--accent-danger` | `hsl(0 72% 58%)` | Errors, decline, stop |
| `--accent-success` | `hsl(142 50% 50%)` | Approve confirmations |

## Typography

| Role | Font | Why |
| --- | --- | --- |
| Display + UI body | **Geist** (300/400/500/600) | Modern grotesque; portable to mobile via `@expo-google-fonts/geist` |
| Mono · timestamps, tool names, model IDs, code, badges | **Geist Mono** (400/500) | Matches Geist's geometry; clearly differentiates technical metadata |

Both fonts load via Google Fonts CDN in `tokens.css`. Discipline > variety — no third font.

## Distinctive details

1. **Status glyphs** — small custom dots/rings: filled mint pulsing for *streaming*, amber ring for *pause pending*, solid muted for *idle*, hollow hairline for *dormant*. Same set across sessions list, composer, and pending-action pill.
2. **Streaming caret** — solid 2×16px mint block at end of assistant text, blinks via `@keyframes blink` at 1s, with mint glow.
3. **Tool-call cards** — thin-bordered cards with a 3px colored left rule whose hue encodes status (mint=running, neutral=done, amber=pending, red=error). Tool name in Geist Mono.
4. **Workspace section headers** — sticky, mono uppercase labels with 0.06em tracking, distinct gradient mask on the bottom edge.
5. **Sticky approval footer** — 64px tall (well above 44pt min hit target), three buttons (Decline / Approve / Always-allow), 1px top border in `--accent-warn`.
6. **Dynamic Island as live activity** — when streaming, tool-calling, or paused, the Island shows a pulsing dot + uppercase label (`Streaming`, `Bash`, `Question`, `Approve`, `Pending`). Static otherwise.
7. **Microcopy is real** — session titles, prompts, tool outputs, code blocks, plan steps use plausible Superset-context content (relay reconnect, JWT rotation, Drizzle migration, chat_events schema). No Lorem ipsum.

## iPhone Pro Max frame spec

```
Outer device:    444 × 962 px (7.5px bezel × 2 + viewport)
Viewport:        430 × 932 px (iPhone 16 Pro Max logical)
Corner radius:   60 px outer, 54 px inner
Dynamic Island:  126 × 37 px, top: 11px, centered
Status bar:      54 px tall, 9:41 in Geist Mono
Home indicator:  134 × 5 px, bottom: 8px, centered
Bezel:           linear-gradient(160deg, #1a1a1a → #050505)
```

## File structure

```
designs/
├── README.md                  ← you are here
├── index.html                 ← contact sheet of all 26 frames
├── tokens.css                 ← CSS variables + Google Fonts import
├── components.css             ← shared atoms & molecules
├── icons.js                   ← Lucide CDN swap helper
└── screens/
    ├── 00-empty-no-hosts.html             UC-NAV-06.1
    ├── 01-empty-no-workspaces.html        UC-NAV-06.2
    ├── 02-empty-no-sessions.html          UC-NAV-06.3
    ├── 03-sessions-list-multi.html        UC-NAV-01,02
    ├── 04-sessions-list-single.html       UC-NAV-02
    ├── 05-sessions-search-active.html     UC-NAV-07
    ├── 06-sessions-search-no-matches.html UC-NAV-07
    ├── 07-host-picker-sheet.html          UC-NAV-03
    ├── 08-new-chat-sheet.html             UC-NAV-04
    ├── 09-chat-empty.html                 UC-SESS-03
    ├── 10-chat-history-loading.html       UC-SESS-02
    ├── 11-chat-message-thread.html        UC-RENDER-01
    ├── 12-chat-streaming.html             UC-RENDER-02
    ├── 13-chat-markdown.html              UC-RENDER-03
    ├── 14-chat-tool-calls.html            UC-RENDER-04
    ├── 15-chat-reasoning-plan.html        UC-RENDER-05
    ├── 16-chat-subagent.html              UC-RENDER-06
    ├── 17-composer-idle.html              UC-COMP-01
    ├── 18-composer-slash-menu.html        UC-COMP-01
    ├── 19-composer-model-picker.html      UC-COMP-04
    ├── 20-composer-thinking-picker.html   UC-COMP-05
    ├── 21-approval-card-footer.html       UC-PAUSE-01
    ├── 22-question-sheet.html             UC-PAUSE-02
    ├── 23-plan-review-modal.html          UC-PAUSE-03
    ├── 24-pending-action-pill.html        UC-PAUSE-04
    ├── 25-host-offline-banner.html        UC-PLATF-03
    └── 26-push-pre-prompt.html            UC-PLATF-01
```

## Shared component vocabulary

Each shared class is defined once in `components.css` and reused across screens — designed so `pixel-perfect:deconstruct` can identify atoms, molecules, and organisms cleanly.

| Layer | Class | Used in |
| --- | --- | --- |
| **Chrome** | `.iphone-frame`, `.iphone-viewport`, `.dynamic-island`, `.status-bar`, `.home-indicator` | All 26 |
| **Atoms** | `.pill-btn`, `.send-btn`, `.host-chip`, `.glyph` (.streaming / .paused / .idle / .dormant), `.streaming-caret` | Multiple |
| **Molecules** | `.session-row`, `.workspace-section`, `.msg-user`, `.msg-asst`, `.tool-card`, `.plan-card`, `.reasoning-card`, `.subagent-block`, `.sheet-row`, `.pop-row`, `.composer`, `.search-bar`, `.empty-state`, `.banner-offline`, `.pending-pill` | Multiple |
| **Organisms** | `.app-header`, `.tab-bar`, `.session-scroll`, `.chat-scroll`, `.composer-wrap`, `.footer-sticky`, `.sheet`, `.modal-full`, `.popover`, `.pre-prompt` | Multiple |

## Source-of-truth alignment

Every screen maps to one or more use cases in the chat-mobile-plan PRD:

- **UC-NAV** (`09-uc-nav.md`) → screens 00–08
- **UC-SESS** (`04-uc-sess.md`) → screens 09, 10
- **UC-RENDER** (`06-uc-render.md`) → screens 11–16
- **UC-COMP** (`05-uc-comp.md`) → screens 17–20
- **UC-PAUSE** (`07-uc-pause.md`) → screens 21–24
- **UC-PLATF** (`08-uc-platf.md`) → screens 25, 26

ASCII wireframes from the PRD are honored — workspace sticky headers, 5-cap + Load more, status glyphs (`⌖`, `⚠`, `●`, `○`), sticky approval footer with "1 of N", suggestion pills on ask_user sheet, scrollable plan modal with feedback area, floating pending-action pill, host-offline banner, push pre-prompt — every wireframe element is rendered at fidelity.

## How to view

1. **Single screen** — open any `screens/*.html` in a modern browser at iPhone 16 Pro Max emulation (Chrome DevTools → device mode → 430 × 932).
2. **All 26 at once** — open `index.html` for the contact sheet with iframe previews. Click any tile to drill in.

## What's next (handoff)

These mockups are the input to `pixel-perfect:build`, which will:
1. Deconstruct each frame into atoms / molecules / organisms via `pixel-perfect:deconstruct`.
2. Generate per-component React Native (Uniwind) implementations in `apps/mobile/components/chat/`.
3. Wire screens together in `apps/mobile/screens/(authenticated)/(chat)/` following the file structure proposed in `12-component-organization-addendum.md`.
4. Verify each component against the source mock via Storybook 9 stories.
5. Diff live RN screens against these mockups via Maestro flows + simulator screenshots.

Do not commit shipped RN code to this folder — the mocks are reference, the implementation lives under `apps/mobile/`.
