---
sequence: 1.5
timeline: Phase 1 — Remediation (post-red-hat review)
status: Planned
parent_roadmap: ./ROADMAP.md
parent_sprint: 1 (Pixel-Perfect UI Components)
upstream_review: red-hat 2026-05-23 (frontend-designer)
scope_exclusion: sessions-list tier (deferred — planned in another session)
---

# Sprint 01b: Sprint 01 Remediation

**Sequence:** 1.5 (between Sprint 01 and Sprint 02)
**Timeline:** Phase 1 — Remediation
**Status:** Planned
**Branch:** `chat-mobile-ui-elements` (continue on the same Phase 1 branch)
**PR:** —

## Overview

The 2026-05-23 red-hat review (frontend-designer) of Sprint 01 returned a
mixed verdict: the chat-view tier (20 view stories, 10 organisms, 19
molecules, 10 atoms) ships clean and typechecks; but Sprint 01's full
Human Testing Gate cannot pass because (a) the mobile theme has perceptible
drift from the desktop ember palette (~36% of comparable tokens), (b) four
component-level bugs were found in built code, (c) the BottomSheet +
AskUserSheet vendor primitives hardcode dark-only colors that break TS-9
light mode, and (d) visual regression evidence (AC-7/AC-8) was never
captured.

This remediation sprint closes those gaps. **Sessions-list tier and the
other missing tiers (Tiptap editor, MessageMarkdown renderer,
PushPrePromptScreen, RebableInSettingsBanner, NotificationIconPreview,
NewChatSheet) are explicitly deferred** — those are NEW builds, not bug
fixes, and will be planned in dedicated follow-up sessions per the user's
direction.

## Human Testing Gate

**Gate:** Reviewer launches `bun storybook` on iOS Simulator and Android
Emulator, toggles light/dark theme via the on-device controls, and confirms
(a) every Storybook view renders correctly on BOTH themes — no dark-only
surfaces visible in light mode, (b) muted text on light backgrounds matches
the desktop visual reference (`apps/desktop/src/renderer/globals.css`
`--color-muted-foreground` value), (c) the PlanReviewScreen Reject button
is disabled when the feedback textarea is empty, (d) the CollapsedBlock and
PickerTrigger chevrons rotate smoothly (Reanimated) rather than snapping,
(e) the SlashCommandOption USER badge renders in the live-green palette
(not destructive-red). The pixel-perfect manifest version is bumped to
v5.4.0 and the `last_review` field references this remediation sprint.

## Test Deliverable

1. From `apps/mobile/`, run `bun storybook` and open both simulators.
2. Toggle to **light** theme. Navigate to `Views/Chat/02-ChatView · Pause · ask_user sheet` — the bottom-sheet surface, drag handle, and text input render with light tokens (white/cream surfaces, dark text). No black rectangles.
3. Same light theme — `Organisms/BottomSheet` → present sheet. Surface + handle render light-themed.
4. Same light theme — `Design System/Colors` → confirm muted-foreground swatch matches the desktop value (`hsl(0 0% 55%)` ≈ `#808080`), not the previous darker mobile value.
5. Same light theme — `Views/Chat/02-ChatView · Pause · approval inline + footer` → tap any Approve / Decline / Always button; the resolving spinner appears with the correct light-theme contrast.
6. Navigate to `Views/Chat/03-PlanReviewModal` → confirm the Reject button is disabled (greyed) while the feedback textarea is empty; type any character; Reject becomes enabled.
7. Navigate to `Views/Chat/02-ChatView · Plan + Reasoning` → tap the Reasoning block's chevron; it rotates smoothly (Reanimated 200ms ease-out), not an instantaneous snap. Same check on `PickerTrigger` chevron via `Views/Chat/02-ChatView · Thinking-level popover`.
8. Navigate to `Views/Chat/02-ChatView · Slash-command popover` → confirm USER-source command rows render with a green/live badge, not red/destructive.
9. Toggle back to **dark** theme and re-walk steps 2-8. Everything still renders correctly.
10. Confirm `apps/mobile/global.css` now contains the `--color-tertiary`, `--color-tertiary-active`, `--color-sidebar*`, and `--color-highlight*` token block (preview for the next sessions-list sprint).
11. Confirm `apps/mobile/design/manifest.json` `last_review` references this remediation sprint and version is bumped.
12. Confirm visual regression evidence is either present at `plans/chat-mobile-plan/visual-baseline-cool-neutral/` and `plans/chat-mobile-plan/visual-postmigration-ember/` OR formally waived in a ROADMAP.md amendment with the rationale recorded.

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| REMED-001 | Align mobile theme dark surfaces to desktop (accent + live-fg + streaming-cursor) | react-native-ui-implementer | 30 min |
| REMED-002 | Align mobile theme light values to desktop (muted-foreground + destructive) | react-native-ui-implementer | 30 min |
| REMED-003 | Resolve state-warning-fg light spec contradiction + apply | frontend-designer | 45 min |
| REMED-004 | Add sidebar / tertiary / highlight tokens (pre-Sprint-02 prep) | react-native-ui-implementer | 30 min |
| REMED-005 | Document mobile-vs-desktop `--color-primary` semantic split | react-native-ui-implementer | 20 min |
| REMED-006 | Fix PlanReviewScreen Reject button disabled-when-empty | react-native-ui-implementer | 20 min |
| REMED-007 | Replace CSS `transition-transform` with Reanimated rotation (CollapsedBlock + PickerTrigger) | react-native-ui-implementer | 60 min |
| REMED-008 | Fix SlashCommandOption USER badge variant (destructive → live) | react-native-ui-implementer | 15 min |
| REMED-009 | BottomSheet + AskUserSheet — useColorScheme pattern for light/dark hex values | react-native-ui-implementer | 60 min |
| REMED-010 | Visual regression evidence: capture baselines OR formally waive in ROADMAP | frontend-designer | 90 min |
| REMED-011 | ROADMAP.md scope amendment: reconcile manifest-vs-ROADMAP contradiction; defer missing tiers to specific sprints | claude | 45 min |

**Estimated total:** ~7.5 hours of focused remediation work.

## Source Coverage

- Red-hat review (frontend-designer, 2026-05-23) — `report` in conversation history; key sections:
  - §1 AC verdict table (TS-1 through TS-9)
  - §2 Token bypass findings F-1 through F-5
  - §3 Design gaps DG-1 through DG-16
  - §7 THEME ALIGNMENT AUDIT (desktop ↔ mobile) — §7.2 dark mismatches, §7.3 light mismatches, §7.4 missing tokens, §7.8 critical drift summary, §7.9 quantification, §7.10 recommended diff
- `plans/chat-mobile-plan/14-token-migration-audit.md` — Path A migration target spec
- `apps/desktop/src/renderer/globals.css` — desktop ember palette (source of truth for alignment)
- `packages/ui/src/globals.css` — shared UI tokens
- `designs/tokens/tokens.css` — canonical two-tier ember spec
- `apps/mobile/global.css` + `apps/mobile/lib/theme.ts` — current mobile theme state
- ROADMAP.md Sprint 01 §Human Testing Gate + §Test Steps

## Blocks

- Sprint 02 (Sessions List Integration): blocked until REMED-004 (sidebar/tertiary/highlight tokens) lands, otherwise sessions-list components will need to inline-define tokens or fail TS-9 light mode.
- Sprint 02+ all: blocked by REMED-011 (ROADMAP scope amendment) for clarity on what was deferred vs. completed.

## Explicit Out-of-Scope (deferred to dedicated sprints)

Per user direction 2026-05-23: these are NEW builds, not remedial fixes, and each warrants its own session/sprint:

- **Sessions-list tier** (9 components): SessionRow, ProjectChip, ProjectPickerSheet, FilterButton, AppliedFilterTags, SessionFilterSheet, NewChatFab, SessionSearchBar, SessionsEmptyState. User: "doing in another session."
- **TiptapPromptEditor** (`@10play/tentap-editor` WebView shell) + SlashCommandNode + FileMentionNode Tiptap extensions. Composer tier.
- **MessageMarkdown** renderer (`react-native-markdown-display` integration). Chat-tree tier.
- **NewChatSheet** (workspace-row bottom sheet). Composer tier.
- **PushPrePromptScreen**, **RebableInSettingsBanner**, **NotificationIconPreview**. Platform-surface tier.

REMED-011 documents this deferral in ROADMAP.md so the manifest-vs-ROADMAP contradiction is resolved.

## Task Detail Files

Generated by /kb-sprint-tasks-plan on 2026-05-23T20:30:00Z (direct write — agent dispatch bypassed because all task scope is well-defined by the upstream red-hat review report)

- REMED-001-align-theme-dark-surfaces-to-desktop.md
- REMED-002-align-theme-light-values-to-desktop.md
- REMED-003-resolve-state-warning-fg-light-spec.md
- REMED-004-add-sidebar-tertiary-highlight-tokens.md
- REMED-005-document-primary-semantic-split.md
- REMED-006-fix-plan-review-reject-disabled.md
- REMED-007-replace-css-transitions-with-reanimated.md
- REMED-008-fix-slash-command-user-variant.md
- REMED-009-bottomsheet-useColorScheme-light-dark.md
- REMED-010-visual-regression-evidence-or-waive.md
- REMED-011-roadmap-scope-amendment.md
