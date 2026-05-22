# Storybook ↔ Design System Map

**Generated:** 2026-05-22
**Scope:** `designs/` (atoms + molecules + views) ↔ `apps/mobile/**/*.stories.tsx`
**Purpose:** Cross-reference of which design-system entries have React Native Storybook coverage. Pixel-perfect's planning phase consumes this map to target unbuilt items precisely. Pure mirror — no priorities, no opinionated build order.

## How to read

Each row links one design-system entry (`designs/{tier}/{name}/`) to its RN equivalent (a story under `apps/mobile/`) with a status icon and a Notes column that calls out scope, refinement TODOs, or composing relationships.

## Status legend

| Icon | Status | Meaning |
|---|---|---|
| ✅ | EXACT | RN story exists and matches design spec well enough to use as-is |
| 🟡 | PARTIAL | RN story exists but diverges from design spec — needs refinement pass |
| 🟡 | IMPLICIT | Design intent is covered indirectly by another RN primitive (no dedicated atom) |
| 🔴 | MISSING | Design exists in `designs/`, no RN story yet |
| ⚫ | MOCK-ONLY | Design exists for HTML mock framing only — not needed in RN (real device chrome) |
| 🆕 | RN-ONLY | RN story exists, no design counterpart — app shell / out of chat-domain scope |

---

## Atoms (27 design entries)

| Design atom | RN equivalent | Status | Notes |
|---|---|---|---|
| `designs/atoms/avatar` | `apps/mobile/components/ui/avatar.tsx` + `avatar.stories.tsx` | ✅ EXACT | Vendor rn-reusables primitive. Storied under `Components/Avatar`. |
| `designs/atoms/backdrop` | (internal to `dialog.tsx` / `alert-dialog.tsx`) | 🟡 IMPLICIT | `bg-black/50` overlay rendered by vendor dialog primitives. No standalone RN atom; documented exception in `apps/mobile/components/ui/AUDIT.md`. |
| `designs/atoms/badge` | `apps/mobile/components/ui/badge.tsx` + `badge.stories.tsx` | ✅ EXACT | Distinct from `designs/atoms/pill` — Badge is the compact counter chip; Pill is the chat-domain tappable chip. |
| `designs/atoms/button` | `apps/mobile/components/ui/button.tsx` + `button.stories.tsx` | ✅ EXACT | Vendor primitive. 6 variants × 4 sizes per `button.stories.tsx`. |
| `designs/atoms/checkbox` | `apps/mobile/components/ui/checkbox.tsx` + `checkbox.stories.tsx` | ✅ EXACT | Vendor primitive. |
| `designs/atoms/device-bezel` | — | ⚫ MOCK-ONLY | HTML mock framing only. On a real iPhone 16 Pro Max the device IS the bezel — no RN component needed. |
| `designs/atoms/divider` | `apps/mobile/components/ui/separator.tsx` + `separator.stories.tsx` | ✅ EXACT | Vendor primitive named `separator` (rn-reusables convention). Renders as `divider`. |
| `designs/atoms/fab-base` | — | 🔴 MISSING | 56pt circular FAB. Needed by `NewChatFab` (sessions list `+`) and `scroll-back-button` molecule. |
| `designs/atoms/hit-target-wrapper` | — | 🔴 MISSING | 44pt invisible tap-zone wrapper. Planned in original 7-atom batch; not built. Referenced in commit `5aa11ebf3` as deferred. |
| `designs/atoms/home-indicator` | — | ⚫ MOCK-ONLY | iOS native chrome — system renders the home indicator on real devices. Not an RN component. |
| `designs/atoms/icon-button` | `apps/mobile/components/IconButton/IconButton.tsx` + story | 🟡 PARTIAL | Built in commit `5aa11ebf3`; needs refinement against `designs/atoms/icon-button/README.md` — current variants don't match spec (--ghost as default, add --soft / --neutral; add `--pill` shape modifier; add `--xs` size 28×28). |
| `designs/atoms/icon-glyph` | `apps/mobile/components/ui/icon.tsx` + `icon.stories.tsx` | ✅ EXACT | Vendor primitive wrapping `lucide-react-native` via `withUniwind`. Catalog of 22 chat-domain icons in the story. |
| `designs/atoms/kbd` | — | 🔴 MISSING | Out of chat-view scope per `designs/AUDIT.md`. Build when needed for shortcut hints. |
| `designs/atoms/live-activity-dot` | — | 🔴 MISSING | Dynamic Island pulsing dot. Out of immediate chat-view scope per AUDIT.md. |
| `designs/atoms/pill` | `apps/mobile/components/Pill/Pill.tsx` + story | 🟡 PARTIAL | Built in commit `5aa11ebf3`; needs refinement against `designs/atoms/pill/README.md` — 6 variants per spec (default / strong / accent / live / warning / danger), 3 sizes (sm/md/lg), monospace + uppercase modifiers, separate `<button>` for the dismiss `✕`. |
| `designs/atoms/progress-dots` | — | 🔴 MISSING | 3-dot loading indicator. Used by slash-command preview loading per `designs/AUDIT.md`. |
| `designs/atoms/radio` | `apps/mobile/components/ui/radio-group.tsx` + `radio-group.stories.tsx` | ✅ EXACT | Vendor primitive named `radio-group`. Storied with the thinking-level row mock data. |
| `designs/atoms/scroll-fade` | — | 🔴 MISSING | Top/bottom gradient fade. Planned in original 7-atom batch; not built. `expo-linear-gradient` was installed during exploration then removed — re-add when building. |
| `designs/atoms/section-label` | (use `Text` variant) | 🟡 IMPLICIT | Mono uppercase wide-tracking label. Achievable via `Text` variant=small with Tailwind `font-mono uppercase tracking-wider` classes. Could be promoted to a dedicated atom if usage proliferates. |
| `designs/atoms/spinner` | (use RN `ActivityIndicator` or `Skeleton`) | 🟡 IMPLICIT | No dedicated RN atom. React Native ships `ActivityIndicator`; `components/ui/skeleton.tsx` covers pulsing-block loading. Build a wrapper if a custom design is needed. |
| `designs/atoms/status-dot` | `apps/mobile/components/StatusDot/StatusDot.tsx` + story | 🟡 PARTIAL | Built in commit `5aa11ebf3`; needs refinement against `designs/atoms/status-dot/README.md` — spec calls for 6px / 8px / 10px exact sizes (sm 8px is default), `live` variant needs pulse animation, `warning` needs `box-shadow` ring, `prefers-reduced-motion` support. |
| `designs/atoms/streaming-cursor` | `apps/mobile/components/StreamingCursor/StreamingCursor.tsx` + story | 🟡 PARTIAL | Built in commit `5aa11ebf3`; needs refinement against `designs/atoms/streaming-cursor/README.md` — spec geometry is 2px width × 1em height with 6px box-shadow glow, 1s `steps(2)` animation, `--default` / `--steady` / `--paused` variants. |
| `designs/atoms/text-input` | `apps/mobile/components/ui/input.tsx` + `input.stories.tsx` | ✅ EXACT | Vendor primitive. |
| `designs/atoms/textarea` | `apps/mobile/components/ui/textarea.tsx` + `textarea.stories.tsx` | ✅ EXACT | Vendor primitive. Multiline autogrow per RN spec. |
| `designs/atoms/toast-base` | — | 🔴 MISSING | Single-toast layout. Vendor `alert.tsx` covers inline alerts; toast requires a separate transient layer (positioned overlay + timeout). |
| `designs/atoms/tool-status-rule` | `apps/mobile/components/ToolStatusRule/ToolStatusRule.tsx` + story | 🟡 PARTIAL | Built in commit `5aa11ebf3`; needs refinement against `designs/atoms/tool-status-rule/README.md` — spec calls for 5 status variants (`--running` / `--done` / `--pending` / `--error` / `--neutral`), `--vertical` / `--horizontal` orientation modifiers, and glow `box-shadow` on `--running` + `--pending`. Width-only currently; needs horizontal support. |
| `designs/atoms/tooltip` | `apps/mobile/components/ui/tooltip.tsx` + `tooltip.stories.tsx` | ✅ EXACT | Vendor primitive. Long-press on mobile per design spec. |

**Tally:** 10 EXACT · 5 PARTIAL · 3 IMPLICIT · 7 MISSING · 2 MOCK-ONLY = 27 atoms.

---

## Molecules (30 design entries)

No RN molecule layer exists yet — every entry below is `🔴 MISSING`. Notes column references the composing atoms (extracted from each molecule's `README.md` purpose paragraph) so pixel-perfect's molecules phase has the build order inline.

| Design molecule | RN equivalent | Status | Notes |
|---|---|---|---|
| `designs/molecules/app-header` | — | 🔴 MISSING | Top nav header: `icon-button` (back) + title block + `icon-button` (more). Three-region flex below status bar. Every chat view. |
| `designs/molecules/applied-filter-tag` | — | 🔴 MISSING | Dismissible chip in filter-tag row: `icon-glyph` + label + dismiss `<button>`. UC-NAV-08 §C. |
| `designs/molecules/approval-footer` | — | 🔴 MISSING | Sticky footer with 3 × 44pt action buttons + 1-of-N badge. UC-PAUSE-01 §A. |
| `designs/molecules/assistant-message-head` | — | 🔴 MISSING | Header row for assistant messages: `avatar` + label + timestamp + optional status segment. Composes `assistant-message-head` molecule. UC-RENDER-01. |
| `designs/molecules/banner` | — | 🔴 MISSING | Full-width status banner: `icon-glyph` + `tool-status-rule` (horizontal) + `button` link. 4 variants (offline / unpaid / dispatch-failed / permission-denied). UC-PLATF-01 + UC-PLATF-03. |
| `designs/molecules/bottom-tab-bar-item` | — | 🔴 MISSING | Single tab item: stacked icon over mono-uppercase label + optional notification dot. UC-NAV §A. (Note: live app uses `@superset/tab-bar` SwiftUI bridge; this molecule may stay design-only.) |
| `designs/molecules/code-block` | — | 🔴 MISSING | Fenced code with language label + Copy button + divider + monospace body. UC-RENDER-03 §A. Composes `icon-button` (Copy) + divider + Text variant=code. |
| `designs/molecules/collapsed-block` | — | 🔴 MISSING | `<details>`/`<summary>` collapsible: icon + label + collapsed preview. Plan / reasoning / subagent variants. UC-RENDER-05 + UC-RENDER-06. |
| `designs/molecules/composer-row` | — | 🔴 MISSING | Composer input row: textarea (left) + icon-button (right). 4 state variants (idle / typing / streaming / sending). UC-COMP-01. |
| `designs/molecules/composer-toolbar` | — | 🔴 MISSING | Horizontal row of 3 picker-trigger chips above composer textarea. Composes `picker-trigger` × 3 + `scroll-fade`. UC-COMP-01 §A. |
| `designs/molecules/empty-state` | — | 🔴 MISSING | Centered "nothing here yet" with hero icon + section-label + heading + body + optional CTA button. Used for UC-NAV-06 5 empty-state variants. |
| `designs/molecules/filter-checkbox-row` | — | 🔴 MISSING | Filter sheet row: `checkbox` + domain icon(s) + label. Workspace + status filter groups. UC-NAV-08 §C. |
| `designs/molecules/host-chip` | — | 🔴 MISSING | Compact pill in chat tab header showing selected host + status dot. (Note: v2.0.0 PRD replaces with `project-chip-header` — may become deprecated.) |
| `designs/molecules/host-picker-row` | — | 🔴 MISSING | Tappable row in host-picker sheet: status indicators + hostname + meta + check mark. (Note: v2.0.0 PRD replaces with project-picker-sheet flow.) |
| `designs/molecules/load-more-pill` | — | 🔴 MISSING | Pagination affordance at bottom of workspace section. Full-width or inline pill button. (Note: v2.0.0 PRD removed workspace sections; molecule retained for legacy/reference.) |
| `designs/molecules/modal-header` | — | 🔴 MISSING | Modal-specific header for full-screen modals: close button + title + optional trailing slot. Distinct from `app-header`. UC-PAUSE-03 §A. |
| `designs/molecules/model-picker-option` | — | 🔴 MISSING | Single row in model-picker popover: `radio` + model name + optional "NEW" badge. Section dividers separate vendor groups. UC-COMP-04. |
| `designs/molecules/pending-action-pill` | — | 🔴 MISSING | Floating pill above composer when a pause is dismissed. Reanimated FadeIn/FadeOut. UC-PAUSE-04. |
| `designs/molecules/pending-approval-card` | — | 🔴 MISSING | Inline approval card in message stream: `tool-status-rule` + icon + body + args preview + badge. Paired with `approval-footer`. UC-PAUSE-01 §A. |
| `designs/molecules/picker-trigger` | — | 🔴 MISSING | Pill-shaped picker trigger: leading icon + label + value + chevron. Used in composer toolbar (model · thinking · permission). UC-COMP-01. |
| `designs/molecules/project-chip-header` | — | 🔴 MISSING | Sessions list sticky header: hamburger + project chip + search input + filter button. Two-row layout. UC-NAV §A v2.0.0. |
| `designs/molecules/scroll-back-button` | — | 🔴 MISSING | Floating circular button when scrolled away from latest message. Composes `fab-base` (md, 56px) + `icon-glyph` (↓) + optional dot badge. Reanimated FadeIn/FadeOut. UC-RENDER-07. |
| `designs/molecules/search-bar` | — | 🔴 MISSING | Sessions search bar: `text-input` (inset) + search/clear `icon-glyph` + `hit-target-wrapper` (clear button). UC-NAV-07. |
| `designs/molecules/session-row` | — | 🔴 MISSING | Sessions list row: leading `status-dot` + title + metadata + timestamp + trailing chevron. Two-line layout per v2.0.0. UC-NAV-01 / UC-SESS-01. |
| `designs/molecules/slash-command-option` | — | 🔴 MISSING | Slash-command popover row: slash-prefixed name (monospace accent) + description + optional source badge. UC-COMP-01 §C. |
| `designs/molecules/suggested-answer-pill` | — | 🔴 MISSING | Tappable pill in ask_user sheet horizontal-scroll row. Composes `pill` (accent) + `hit-target-wrapper`. UC-PAUSE-02. |
| `designs/molecules/thinking-level-option` | — | 🔴 MISSING | Thinking-level (and permission-mode) picker row: `radio` + level label + token-budget hint. UC-COMP-05. |
| `designs/molecules/tool-call-card` | — | 🔴 MISSING | Collapsed tool-invocation card: `tool-status-rule` + icon + model pill + status badge + args preview. UC-RENDER-04. |
| `designs/molecules/user-message-bubble` | — | 🔴 MISSING | User message bubble: right-aligned, styled bg, long-press context menu. Composes `avatar` + body + timestamp + `hit-target-wrapper`. UC-RENDER-01. |
| `designs/molecules/workspace-section-header` | — | 🔴 MISSING | Sessions list sticky workspace section header: `section-label` + badge (count) + chevron + divider. (Note: v2.0.0 removed workspace sectioning — molecule retained as legacy reference.) |

**Tally:** 0 EXACT · 0 PARTIAL · 30 MISSING.

---

## Views (37 design entries)

No RN view layer exists yet — every entry below is `🔴 MISSING`. Notes column references the UC and key composing molecules/atoms.

| Design view | RN equivalent | Status | Notes |
|---|---|---|---|
| `designs/views/01-sessions-list/states/loaded` | — | 🔴 MISSING | Rendered sessions list with project-first chrome. UC-NAV-01 + UC-SESS-01. |
| `designs/views/01-sessions-list/states/empty-no-projects` | — | 🔴 MISSING | Empty-state branch — org has zero accessible projects. UC-NAV-06 §1. |
| `designs/views/01-sessions-list/states/empty-no-workspaces` | — | 🔴 MISSING | Empty-state — project has zero workspaces. UC-NAV-06 §2. |
| `designs/views/01-sessions-list/states/empty-no-sessions` | — | 🔴 MISSING | Empty-state — project has workspaces but no sessions. UC-NAV-06 §3. |
| `designs/views/01-sessions-list/states/search-no-match` | — | 🔴 MISSING | Search returned no sessions. UC-NAV-07. |
| `designs/views/01-sessions-list/states/filters-no-match` | — | 🔴 MISSING | Filters returned no sessions. UC-NAV-08. |
| `designs/views/01-sessions-list/states/_combined-empty` | — | 🔴 MISSING | Contact sheet — all 5 empty states stacked. Reference view. |
| `designs/views/01-sessions-list/overlays/project-picker-sheet` | — | 🔴 MISSING | Project picker bottom sheet — projects with workspace + session counts. UC-NAV-08. |
| `designs/views/01-sessions-list/overlays/filter-sheet` | — | 🔴 MISSING | Filter bottom sheet — workspace + status multi-select. UC-NAV-08 §C. |
| `designs/views/01-sessions-list/overlays/new-chat-sheet` | — | 🔴 MISSING | New chat workspace-picker bottom sheet. UC-NAV-04. |
| `designs/views/02-chat-view/states/loading` | — | 🔴 MISSING | Chat view skeleton during history fetch. UC-SESS-02 §A. |
| `designs/views/02-chat-view/states/error-retry` | — | 🔴 MISSING | Chat view error + retry banner. UC-SESS-02 §B. |
| `designs/views/02-chat-view/states/streaming` | — | 🔴 MISSING | **CANONICAL** — header + thread + streaming cursor + composer. UC-RENDER-01 §A. |
| `designs/views/02-chat-view/states/markdown` | — | 🔴 MISSING | Markdown rendering with code blocks + inline code + Copy button. UC-RENDER-03. |
| `designs/views/02-chat-view/states/tool-calls` | — | 🔴 MISSING | 3 × tool-call cards (running / done / error). UC-RENDER-04. |
| `designs/views/02-chat-view/states/reasoning-plan` | — | 🔴 MISSING | Plan + Reasoning collapsible blocks. UC-RENDER-05. |
| `designs/views/02-chat-view/states/subagent` | — | 🔴 MISSING | Nested subagent execution with collapsed-block hierarchy. UC-RENDER-06. |
| `designs/views/02-chat-view/states/scroll-back-visible` | — | 🔴 MISSING | Floating scroll-back FAB above composer when scrolled up. UC-RENDER-07. |
| `designs/views/02-chat-view/states/pause-approval` | — | 🔴 MISSING | Inline pending-approval-card + sticky approval-footer. UC-PAUSE-01. |
| `designs/views/02-chat-view/states/pause-pending-pill` | — | 🔴 MISSING | Floating pending-action pill when sheet/modal dismissed without responding. UC-PAUSE-04. |
| `designs/views/02-chat-view/states/host-offline` | — | 🔴 MISSING | Host-offline banner above chat. UC-PLATF-03 §A. |
| `designs/views/02-chat-view/states/dispatch-failed` | — | 🔴 MISSING | Dispatch-failed banner variant. UC-PLATF-03 §B. |
| `designs/views/02-chat-view/states/plan-required` | — | 🔴 MISSING | Plan upgrade required banner variant. UC-PLATF-03. |
| `designs/views/02-chat-view/states/_platform-errors-combined` | — | 🔴 MISSING | Contact sheet — all 3 platform-error banner variants stacked. Reference view. |
| `designs/views/02-chat-view/composer-states/idle` | — | 🔴 MISSING | Composer idle/empty state with placeholder + disabled Send. UC-COMP-01 §A. |
| `designs/views/02-chat-view/composer-states/typing-send-enabled` | — | 🔴 MISSING | Composer typing state with content + active Send. UC-COMP-01 §B. |
| `designs/views/02-chat-view/composer-states/streaming-stop` | — | 🔴 MISSING | Composer streaming state with disabled input + Stop button. UC-COMP-03 §A. |
| `designs/views/02-chat-view/composer-states/_combined` | — | 🔴 MISSING | Contact sheet — all 3 composer states stacked. Reference view. |
| `designs/views/02-chat-view/overlays/slash-command-popover` | — | 🔴 MISSING | Slash command popover above composer. UC-COMP-01 §C. |
| `designs/views/02-chat-view/overlays/model-picker-popover` | — | 🔴 MISSING | Model picker popover with Anthropic / OpenAI radio sections. UC-COMP-04 §A. |
| `designs/views/02-chat-view/overlays/thinking-level-popover` | — | 🔴 MISSING | Thinking-level picker popover with token-budget hints. UC-COMP-05 §A. |
| `designs/views/02-chat-view/overlays/ask-user-sheet` | — | 🔴 MISSING | ask_user bottom sheet with question + suggested-answer pills + BottomSheetTextInput. UC-PAUSE-02 §A. |
| `designs/views/03-plan-review-modal/plan-review-modal` | — | 🔴 MISSING | Full-screen plan review modal with scrollable markdown + expandable feedback + docked Reject/Approve. UC-PAUSE-03 §A. |
| `designs/views/04-push-pre-prompt/push-pre-prompt` | — | 🔴 MISSING | Pre-OS push-notification permission prompt. UC-PLATF-01. |
| `designs/views/05-settings-screen/states/permission-denied-banner` | — | 🔴 MISSING | Re-enable-in-Settings banner when notification permission revoked. UC-PLATF-01 §B. |
| `designs/views/shared-overlays/delete-confirmation-dialog` | — | 🔴 MISSING | Delete session confirmation modal. UC-SESS-05. |
| `designs/views/shared-overlays/session-overflow-sheet` | — | 🔴 MISSING | Session overflow bottom sheet (Rename / End / Delete). UC-SESS-04 §A. |

**Tally:** 0 EXACT · 0 PARTIAL · 37 MISSING.

---

## RN-Only inventory (no design counterpart)

These components have Storybook stories but no entry in `designs/`. They're either app-shell components outside the chat domain, scaffolding references, or token catalogs. None are pixel-perfect targets — they're documented here for inventory completeness.

| RN component | Story | Why no design counterpart |
|---|---|---|
| `apps/mobile/components/HelloWorld/HelloWorld.tsx` | `Components/HelloWorld` | Scaffold reference component from `/pixel-perfect:scaffold`. Not chat-domain. |
| `apps/mobile/screens/(authenticated)/(home)/workspaces/components/OrganizationSwitcherSheet/components/OrganizationAvatar/OrganizationAvatar.tsx` | `Components/OrganizationAvatar` | Org switcher avatar — not chat-domain. |
| `apps/mobile/screens/(authenticated)/(home)/workspaces/components/OrganizationHeaderButton/OrganizationHeaderButton.tsx` | `Components/OrganizationHeaderButton` | Workspaces screen header — not chat-domain. |
| `apps/mobile/screens/(authenticated)/components/OrgDropdown/OrgDropdown.tsx` | `Components/OrgDropdown` | Authenticated header dropdown — not chat-domain. |
| `apps/mobile/screens/(authenticated)/components/TabBarAccessory/TabBarAccessory.tsx` | `Components/TabBarAccessory` | Tab bar accessory row — not chat-domain. |
| `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` | `Components/AuthenticatedTabBar` | Native tab bar wrapper — uses `@superset/tab-bar` SwiftUI bridge. |
| `apps/mobile/screens/(auth)/sign-in/components/SocialButton/SocialButton.tsx` | `Components/SocialButton` | OAuth provider button — not chat-domain. |
| `apps/mobile/screens/(auth)/sign-in/components/DevSignInButton/DevSignInButton.tsx` | `Components/DevSignInButton` | Dev-only sign-in shortcut — not chat-domain. |
| `apps/mobile/screens/(authenticated)/(home)/workspaces/components/OrganizationSwitcherSheet/OrganizationSwitcherSheet.tsx` | `Components/OrganizationSwitcherSheet` | iOS-only SwiftUI BottomSheet — not chat-domain. |

### Design System catalog (token reference, not components)

| Story | Purpose |
|---|---|
| `Design System/Colors` (`apps/mobile/.rnstorybook/stories/DesignSystem/Colors.stories.tsx`) | Token swatches for semantic + state palette + chat domain colors |
| `Design System/Typography` (`apps/mobile/.rnstorybook/stories/DesignSystem/Typography.stories.tsx`) | Font families (Geist + Geist Mono) + type variants |
| `Design System/Spacing` (`apps/mobile/.rnstorybook/stories/DesignSystem/Spacing.stories.tsx`) | Spacing scale + radius scale visualization |
| `Design System/Icons` (`apps/mobile/.rnstorybook/stories/DesignSystem/Icons.stories.tsx`) | Lucide icon catalog reference |

---

## Summary

| Tier | Total designs | EXACT | PARTIAL | IMPLICIT | MISSING | MOCK-ONLY |
|---|---|---|---|---|---|---|
| Atoms | 27 | 10 | 5 | 3 | 7 | 2 |
| Molecules | 30 | 0 | 0 | 0 | 30 | 0 |
| Views | 37 | 0 | 0 | 0 | 37 | 0 |
| **Total** | **94** | **10** | **5** | **3** | **74** | **2** |

Plus 9 RN-only app-shell components + 4 Design System catalog stories (no design counterpart, not chat-domain — out of scope by design).

## Companion docs

- `designs/AUDIT.md` — wireframe-to-component coverage audit + Wave 1/2/3 build order
- `apps/mobile/components/ui/AUDIT.md` — vendor primitive token-bypass findings
- `apps/mobile/screens/AUDIT.md` — first-party app-component token-compliance audit (Path A fixes applied)
- `plans/chat-mobile-plan/14-token-migration-audit.md` — token migration audit (Path A spec)
- `apps/mobile/design/manifest.json` — pixel-perfect manifest (gates + tools per platform)
