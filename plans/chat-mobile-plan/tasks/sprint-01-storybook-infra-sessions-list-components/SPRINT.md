---
sprint: 1
title: Storybook Infra + Sessions List Components
sequence: 1
timeline: Phase 1 — UI Components
status: In Progress
branch: sprint-1-chat-mobile-storybook-sessions
worktree: .claude/worktrees/sprint-1-chat-mobile-storybook-sessions
pr: —
gate_strategy: storybook-on-simulator
---

# Sprint 1: Storybook Infra + Sessions List Components

**Sequence:** 1
**Timeline:** Phase 1 — UI Components
**Status:** 🟠 In flight
**Branch:** `sprint-1-chat-mobile-storybook-sessions`
**PR:** —

> **Gate-strategy note.** Phase 1 sprints (01–05) use Storybook on simulator/emulator as the human verification surface per user direction (recorded in `../../ROADMAP.md` — gate_strategy: ui-first-via-storybook). This overrides the `kb-sprint-plan` skill's default rule that bans `\bstorybook\b` in test steps. Implementer tasks ship pure, props-driven components with co-located Storybook stories — NO mock-data adapters bleed into production code. Real-screen assembly happens in Phase 2 (Sprint 06+).

---

## Overview

This sprint frontloads the visual layer for the Mobile Chat v2 sessions list. It establishes the Storybook 9 infrastructure (root toggle via `EXPO_PUBLIC_STORYBOOK=true` with build-time stripping for production bundles) and ships every sessions-list-tier component as a pure, props-driven React Native component with a co-located `*.stories.tsx` file covering every documented state. No data hooks, no Electric collections, no real-screen assembly — those land in Sprint 06.

The sprint's deliverable is a Storybook story library a reviewer can navigate on iOS Simulator and Android Emulator to confirm visual fidelity against design sticker sheets before any backend wiring begins. This locks in design correctness early, freeing Sprint 06 to focus purely on data integration without re-litigating component visuals.

---

## Human Test Deliverable

A reviewer launches the mobile app in Storybook mode (`EXPO_PUBLIC_STORYBOOK=true bun start`) on both iOS Simulator and Android Emulator and visually confirms every documented state of the sessions-list-tier components renders correctly against the design sticker sheets on both light and dark themes.

**Test Steps:**
1. From `apps/mobile/`, start the app in Storybook mode: `EXPO_PUBLIC_STORYBOOK=true bun start` — open the iOS Simulator AND the Android Emulator simultaneously.
2. Navigate Storybook's on-device controls to **SessionRow** stories and tap through each variant — confirm the streaming (`⌖`), pause-pending (`⚠`), idle (`●`), and dormant (`○`) status icons render with the correct token-derived colors, and long-press copies the title to the clipboard.
3. Navigate to **WorkspaceSection** stories — verify collapsed/expanded chevron states, the sticky-header visual layout, and the empty-workspace-with-CTA variant.
4. Navigate to **LoadMorePill** stories — confirm the "Load more (N more)" button at 44pt with `--color-secondary` background and `--radius` corners.
5. Navigate to **HostChip**, **NewChatFab**, and **SessionSearchBar** stories — confirm shadow + 56pt FAB, online/offline chip indicator, placeholder + focused state + clear (✕) affordance.
6. Navigate to **SessionsEmptyState** stories — verify all four variants (no-hosts / no-workspaces / no-sessions / no-search) render with the correct icon, heading, body copy, and CTA per the design sticker sheet.
7. Navigate to **HostPickerSheet** stories — confirm sheet handle, header, online/offline row badges, currently-selected check, and meta-line typography across populated and empty variants.
8. Toggle Storybook's on-device theme switcher between light and dark and re-verify every component renders correctly on both themes.

---

## Tasks

| ID | Title | Agent | Estimate |
|----|-------|-------|----------|
| MOB-INFRA-001 | Install chat-tree runtime dependencies in apps/mobile | react-native-ui-implementer | 60 min |
| MOB-INFRA-002 | Configure Storybook 9 with root toggle and custom .rnstorybook directory | react-native-ui-implementer | 180 min |
| MOB-NAV-002 | Build SessionRow component with status icon and Storybook stories | react-native-ui-implementer | 120 min |
| MOB-NAV-003 | Build WorkspaceSection + LoadMorePill subcomponents with stories | react-native-ui-implementer | 180 min |
| MOB-NAV-004 | Build HostChip, NewChatFab, SessionSearchBar, and SessionsEmptyState components with stories | react-native-ui-implementer | 180 min |
| MOB-NAV-008-UI | Build HostPickerSheet component (props-driven; no real data wiring) with stories | react-native-ui-implementer | 150 min |
| DESIGN-NAV-001 | Sticker sheet — SessionsListScreen header, session row, workspace section header, LoadMorePill | frontend-designer | 90 min |
| DESIGN-NAV-002 | Sticker sheet — HostPickerSheet (host picker bottom sheet) | frontend-designer | 45 min |
| DESIGN-NAV-003 | Sticker sheet — NewChatSheet (workspace picker) + empty states | frontend-designer | 60 min |
| DESIGN-PLATF-003 | Iconography spec — Lucide icon set for chat actions | frontend-designer | 30 min |

---

## Human Testing Gate

**Gate:** A reviewer launches the mobile app in Storybook mode on iOS Simulator and Android Emulator and navigates every sessions-list-tier component (SessionRow, WorkspaceSection, LoadMorePill, HostChip, NewChatFab, SessionSearchBar, SessionsEmptyState, HostPickerSheet) seeing every documented state render correctly against design tokens on both light and dark themes.

---

## Source Coverage

- `../../09-uc-nav.md` (UC-NAV-01, UC-NAV-02, UC-NAV-03, UC-NAV-04, UC-NAV-06, UC-NAV-07 — components only)
- `../../11-technical-requirements/04-dependencies.md` (new packages to install)
- `../../11-technical-requirements/05-ui-infrastructure.md` (component tree, file paths, hit-target rules, Tailwind translation table)
- `../../12-component-organization-addendum.md` (folder-per-component, subcomponent nesting, barrel export conventions)
- `../../13-testing-strategy.md` (Storybook 9 setup + custom root toggle + build-time stripping)

---

## Blocks

- Sprint 02 (Chat View Components) — needs Storybook infra in place to add chat-tree render stories
- Sprint 03 (Composer Components) — needs Storybook infra to add composer stories
- Sprint 04 (Pause Container Components) — needs Storybook infra to add pause stories
- Sprint 05 (Platform Surface Components) — needs Storybook infra to add platform surface stories
- Sprint 06 (Sessions List Integration) — needs all sessions-list components to compose into the real SessionsListScreen
