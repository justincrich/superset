# MOB-NAV-005-INT: Assemble SessionsListScreen with real Electric data

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 240 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** L

---

## BACKGROUND

This is the **Sprint 02 assembly task** — the integration that ties everything together. It replaces the placeholder `SessionsListScreen` body from MOB-NAV-001 with a fully-wired surface composing:

- `ProjectChipHeader` (multi-project vs single-project variant per project count) — Sprint 01 molecule, MOB-NAV-007-UI + MOB-NAV-017-UI refactored its row 2
- `SessionSearchBar` (controlled via in-memory `searchQuery` state, debounced ~100ms) — MOB-NAV-007-UI deliverable
- `FilterButtonConnected` (badge wired to `activeFilters`) — MOB-NAV-017-V2 deliverable
- `AppliedFilterTags` row below search (MOB-NAV-014-V2's responsibility to wire chip removal — this task just renders the row slot)
- `SessionsList` organism (FlashList of `SessionRow` rows + FAB) — Sprint 01 organism
- `NewChatFab` (placeholder onPress for Sprint 02; Sprint 04 wires the workspace picker) — MOB-NAV-004-V2-UI deliverable
- `SessionsEmptyState` dispatcher (5 variants) — MOB-NAV-010-V2 deliverable
- `ProjectPickerSheet` (mounted, opened on chip press when multi-project) — wired by MOB-NAV-008-V2
- `SessionFilterSheet` (mounted, opened on filter button press) — wired by MOB-NAV-013-V2

The state model lives ONLY in this screen (per UC-NAV-08 spec line 364 — "in-memory only and clears when the user leaves the sessions list"):
- `searchQuery: string` (controlled value for SessionSearchBar)
- `activeFilters: SessionsFilters` (passed to FilterButtonConnected + AppliedFilterTags + SessionFilterSheet)

The data layer comes from:
- `useSelectedProject()` → `selectedProjectId` (MOB-INFRA-006-V2)
- `useAccessibleProjects()` → `projects[]`, decides multi/single-project header variant (MOB-INFRA-011)
- `useSessionsForProject({ searchQuery, activeFilters })` → `sessions[]`, `isReady`, `workspaceJoinIndex` (MOB-INFRA-007-V2)
- `useSessionsEmptyVariant(...)` → which empty-state to render (MOB-NAV-010-V2)

Current state: placeholder body. Desired state: live `SessionsListScreen` rendering real Electric data via the cache-first contract, with all interaction wiring functional (sheet opens, search filters, filter chips display, FAB visible). Backed-by Maestro flow `.maestro/sessions-list-real.yaml` verifies the human-test deliverable.

---

## CRITICAL CONSTRAINTS

- MUST place the full implementation in `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` — replace the MOB-NAV-001 placeholder.
- MUST be ONE screen handling all 6 behavioral states (loading-cache-first, populated, no-projects, no-workspaces, no-sessions, search-no-match, filters-no-match). Per universal rule "one view, many states", these are STATES of THIS screen, not separate screens. The single SessionsListScreen.tsx file owns the variant dispatch; the existing `screens/sessions-list/views/SessionsList*` files are Storybook fixtures only — not separate screens.
- MUST hold in-memory state: `const [searchQuery, setSearchQuery] = useState("")` and `const [activeFilters, setActiveFilters] = useState<SessionsFilters>({ workspaceIds: [], statuses: [] })`. Both reset on screen unmount via React's natural state lifecycle.
- MUST debounce `searchQuery` flowing INTO `useSessionsForProject` by ~100ms per UC-NAV-07 spec line 348 — use a small `useDebouncedValue` helper (create co-located if not extant).
- MUST be cache-first per AGENTS.md TanStack DB rule: render the populated `SessionsList` with the persisted `sessions` array even when `isReady === false`. Only branch to empty-state UI when `useSessionsEmptyVariant` returns a non-null variant (which itself gates on isReady).
- MUST render `<ProjectChipHeader variant={ accessibleProjects.length >= 2 ? "multi-project" : "single-project" }>` so the chip is tappable iff org has ≥2 projects (UC-NAV-01 spec lines 266-274).
- MUST pass `onProjectChipPress={() => projectPickerRef.current?.present()}` so tapping the chip opens the ProjectPickerSheet (MOB-NAV-008-V2 owns the sheet wiring, but this task mounts the sheet ref).
- MUST pass `onFilterPress={() => filterSheetRef.current?.present()}` opening SessionFilterSheet (MOB-NAV-013-V2 owns full wiring; this task mounts the sheet ref).
- MUST mount `<BottomSheetModalProvider>` if not already mounted at the layout layer — `(chat)/_layout.tsx` from MOB-NAV-001 might not include it. If missing, add to `_layout.tsx` (modifying a file outside this task's primary scope; the WRITE-ALLOWED list includes `_layout.tsx` for this purpose).
- MUST set `showFab={variant !== "no-workspaces" && variant !== "no-projects"}` so the FAB hides when there's no project or no workspaces.
- MUST set `onNewChatPress={() => {}}` placeholder — Sprint 04 MOB-NAV-009-INT wires this.
- MUST tag root view with `testID="sessions-list-screen"` for Maestro probing.
- MUST also render a smoke Maestro flow `.maestro/sessions-list-real.yaml` covering the populated state.
- MUST handle the `selectedProjectId === null` case: when the SelectedProjectProvider has `isReady=false`, show a minimal loading state (e.g., empty View with safe-area-aware header skeleton). When `isReady=true` AND `selectedProjectId === null` AND `projects.length === 0` → dispatcher returns `"no-projects"`.
- NEVER hold `searchQuery` or `activeFilters` in a provider, context, or persisted store — strictly in-memory `useState` per spec.
- NEVER re-implement the SessionsList organism — compose it.
- NEVER persist filter state across screen exits.
- NEVER block render on `isReady === false` — cache-first applies.
- STRICTLY adhere to 44pt minimum hit target on all interactive elements (header, search clear, filter button, applied-tag dismisses, session rows, FAB — all already satisfied by composed components).

---

## SPECIFICATION

**Objective:** Implement `SessionsListScreen` as the live sessions-list surface composing all Sprint 01 components + Sprint 02 infra, with in-memory search + filters, real Electric data via cache-first hooks, project-first scoping, and Maestro-verified end-to-end behavior on iOS Simulator + Android Emulator.

**Success state:** Navigating to `/(authenticated)/(chat)` after sign-in shows the real sessions list scoped to the user's selected project (or correct empty state); typing in search filters the list within ~100ms; tapping the chip opens the project picker; tapping the filter button opens the filter sheet; both sheets dismiss without committing changes when swiped down; a session created on desktop appears within ~3 seconds; `.maestro/sessions-list-real.yaml` passes on both platforms.

---

## ACCEPTANCE CRITERIA

### AC-1: Screen mounts and renders populated state with real sessions (cache-first)

**GIVEN** the user is signed in with `selectedProjectId="proj-a"`, `chatSessions` has 5 persisted rows in proj-a, and the screen is freshly mounted (Electric may still be syncing)
**WHEN** the screen renders
**THEN** the `SessionsList` shows the 5 sessions sorted by `lastActiveAt` DESC in the populated layout, the `ProjectChipHeader` shows the project name, and rendering happens BEFORE `isReady=true` (persisted rows do not wait for sync to complete).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx`

### AC-2: Header variant flips between multi-project and single-project

**GIVEN** the user is signed in with `useAccessibleProjects()` returning (case A) 1 project, (case B) 3 projects
**WHEN** the screen renders in each case
**THEN** case A renders `<ProjectChipHeader variant="single-project">` (static label, no chevron, no onProjectChipPress wired) AND case B renders `<ProjectChipHeader variant="multi-project">` (tappable chip with chevron, onProjectChipPress opens ProjectPickerSheet).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx`

### AC-3: Search updates session list within ~100ms debounce

**GIVEN** sessions include titles `"Fix auth bug"`, `"Refactor billing"`, `"AUTH refactor"`
**WHEN** the user types `"auth"` in the search bar AND ~100ms elapses
**THEN** the visible session list reduces to `"Fix auth bug"` and `"AUTH refactor"` (case-insensitive); typing then clearing via `✕` restores the full list.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` (with `jest.useFakeTimers()` or bun-test equivalent to advance the debounce)

### AC-4: Empty-state dispatcher renders correct variant

**GIVEN** four state combinations: (1) projects=[], (2) projects=[p1] + workspaces=[], (3) projects+workspaces present + sessions=[], (4) search="zzzz" + zero matches
**WHEN** the screen renders each
**THEN** the body shows `SessionsEmptyState` with variant `"no-projects"`, `"no-workspaces"`, `"no-sessions"`, `"search-no-match"` (respectively), each with the correct testID.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx`

### AC-5: FAB visibility responds to empty-state variant

**GIVEN** the empty-state variant is `"no-workspaces"` or `"no-projects"`
**WHEN** the screen renders
**THEN** the FAB is HIDDEN (`showFab={false}` on SessionsList); for `"no-sessions"`, `"search-no-match"`, `"filters-no-match"`, and populated states the FAB is VISIBLE.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx`

### AC-6: Sheets open on chip/filter button press and dismiss without commit

**GIVEN** the screen renders with `accessibleProjects.length >= 2` AND `activeFilters` is non-trivial
**WHEN** the user taps the project chip → swipes down to dismiss the sheet without selecting, AND taps the filter button → swipes down to dismiss
**THEN** both sheets open and dismiss correctly, `selectedProjectId` and `activeFilters` remain unchanged.

**Verify:** Manual: `cd apps/mobile && bun dev` → tap chip → swipe down → tap filter → swipe down.

### AC-7: Maestro flow asserts populated list + search round-trip

**GIVEN** Maestro installed (MOB-INFRA-003) and a test account has ≥1 session in the default project
**WHEN** `.maestro/sessions-list-real.yaml` runs (`runFlow: subflows/login.yaml`, tap Chat tab, assert visible `session-row-*` testID, tap search bar, type query, assert filtered list, clear, assert full list)
**THEN** the flow exits 0 on iOS Simulator AND Android Emulator.

**Verify:** `cd apps/mobile && maestro test .maestro/sessions-list-real.yaml` (both platforms)

### AC-8: Multi-device sync — session created on desktop appears within 3s

**GIVEN** the mobile app is on the sessions list with a real account
**WHEN** the same account creates a new session via the desktop client (manual step)
**THEN** the new session appears in the mobile list within ~3 seconds via the Electric `chat_sessions` shape, with no manual refresh.

**Verify:** Manual: dual-device test (desktop + iOS Simulator); see MOB-PLATF-009 for the formal Maestro coverage.

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | Screen renders populated SessionsList when sessions array is non-empty regardless of isReady | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-2 | ProjectChipHeader receives variant='single-project' when accessibleProjects.length === 1 | AC-2 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-3 | ProjectChipHeader receives variant='multi-project' when accessibleProjects.length >= 2 | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-4 | Typing 'auth' + 100ms wait reduces visible sessions to 2 (case-insensitive title match) | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-5 | Tapping clear ✕ restores full session list | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-6 | Empty state 'no-projects' renders when projectsCount=0 + isReady=true | AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-7 | Empty state 'no-workspaces' renders when workspaces=[] + isReady=true | AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-8 | Empty state 'no-sessions' renders when sessions=[] + no search + no filters + isReady=true | AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-9 | Empty state 'search-no-match' renders when search='zzzz' yields zero matches | AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-10 | showFab is false when variant is 'no-projects' or 'no-workspaces' | AC-5 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-11 | showFab is true when variant is null OR 'no-sessions' OR 'search-no-match' OR 'filters-no-match' | AC-5 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-12 | Tapping chip opens ProjectPickerSheet; swipe-down dismisses without committing | AC-6 | happy_path | Manual smoke |
| TC-13 | Tapping filter button opens SessionFilterSheet; swipe-down dismisses without committing | AC-6 | happy_path | Manual smoke |
| TC-14 | Maestro sessions-list-real.yaml exits 0 on iOS Simulator | AC-7 | happy_path | `cd apps/mobile && maestro test .maestro/sessions-list-real.yaml` |
| TC-15 | Maestro sessions-list-real.yaml exits 0 on Android Emulator | AC-7 | edge | `cd apps/mobile && maestro test .maestro/sessions-list-real.yaml --device <android>` |
| TC-16 | Manual: desktop-created session appears in mobile list within 3s | AC-8 | happy_path | Manual dual-device |
| TC-17 | searchQuery and activeFilters state reset on screen unmount | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx` | 1-165 | Organism API — `projectName`, `headerProps`, `sessions`, `emptyBody`, `showFab`, `onNewChatPress` |
| `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx` | 1-162 | Header API — variant, search/filter slots, belowSearch slot for AppliedFilterTags |
| `apps/mobile/screens/sessions-list/views/SessionsListLoaded/SessionsListLoaded.tsx` | 1-46 | Reference for header props wiring |
| `apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/` | (from MOB-INFRA-006-V2) | Selected project hook contract |
| `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/` | (from MOB-INFRA-007-V2) | Sessions selector contract |
| `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/` | (from MOB-INFRA-011) | Accessible projects hook |
| `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/` | (from MOB-NAV-010-V2) | Variant dispatcher hook |
| `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/` | (from MOB-NAV-010-V2) | Empty-state component |
| `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/` | (from MOB-NAV-017-V2) | Connected filter button |
| `apps/mobile/components/NewChatFab/` | (from MOB-NAV-004-V2-UI) | FAB wrapper |
| `apps/mobile/components/SessionSearchBar/` | (from MOB-NAV-007-UI) | Search bar wrapper |
| `apps/mobile/components/BottomSheet/BottomSheet.tsx` | 1-106 | BottomSheet wrapper + BottomSheetModalProvider requirement |
| `apps/mobile/screens/sessions-list/components/ProjectPickerSheet/ProjectPickerSheet.tsx` | 1-73 | Sheet mounted by this screen; full wiring in MOB-NAV-008-V2 |
| `apps/mobile/screens/sessions-list/components/SessionFilterSheet/SessionFilterSheet.tsx` | 1-135 | Sheet mounted by this screen; full wiring in MOB-NAV-013-V2 |
| `plans/chat-mobile-plan/09-uc-nav.md` | 259-373 | UC-NAV-01/06/07/08 specs |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 9-25 | SessionsListScreen state model + composition spec |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` (MODIFY — replace placeholder with real implementation)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` (MODIFY — expand from MOB-NAV-001's placeholder test)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/index.ts` (MODIFY — barrel re-export remains)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useDebouncedValue/useDebouncedValue.ts` (NEW — small debounce helper if not extant)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useDebouncedValue/useDebouncedValue.test.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useDebouncedValue/index.ts` (NEW)
- `apps/mobile/app/(authenticated)/(chat)/_layout.tsx` (MODIFY ONLY if BottomSheetModalProvider is not mounted — add it)
- `apps/mobile/.maestro/sessions-list-real.yaml` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/**` — atom/molecule/organism layer is fixed; this task composes them
- `apps/mobile/screens/sessions-list/components/**` — `SessionsList`, `ProjectPickerSheet`, `SessionFilterSheet`, `NewChatSheet` organisms are stable; this task consumes them
- `apps/mobile/screens/sessions-list/views/**` — Storybook fixtures only; do not mutate
- `apps/mobile/screens/sessions-list/types.ts` — type contracts are stable
- `apps/mobile/lib/collections/collections.ts` — owned by MOB-INFRA-005-V2
- `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/**` — owned by MOB-INFRA-006-V2
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/**` / `useSessionsForProject/**` / `useAccessibleProjects/**` — owned by respective infra tasks
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/**` — owned by MOB-NAV-010-V2
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/**` — owned by MOB-NAV-017-V2
- `apps/mobile/global.css` — established ember tokens

---

## CODE PATTERN

**Reference:** Screen-level composition pattern — pull data from hooks, hold UI state locally, render the organism with composed slots.

**Source:** `apps/mobile/screens/sessions-list/views/SessionsListLoaded/SessionsListLoaded.tsx:14-46` (header-props wiring shape — but with mocks, this task uses real hooks).

**Example:**
```tsx
// apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx
import { useRef, useState } from "react";
import { View } from "react-native";
import type { BottomSheetRef } from "@/components/BottomSheet";
import { ProjectPickerSheet } from "@/screens/sessions-list/components/ProjectPickerSheet";
import { SessionFilterSheet } from "@/screens/sessions-list/components/SessionFilterSheet";
import { SessionsList } from "@/screens/sessions-list/components/SessionsList";
import type { SessionsFilters } from "@/screens/sessions-list/types";
import { useSelectedProject } from "@/screens/(authenticated)/(chat)/hooks/useSelectedProject";
import { useAccessibleProjects } from "@/screens/(authenticated)/(chat)/hooks/useAccessibleProjects";
import { useSessionsForProject } from "@/screens/(authenticated)/(chat)/hooks/useSessionsForProject";
import { FilterButtonConnected } from "./components/FilterButtonConnected";
import { SessionsEmptyState } from "./components/SessionsEmptyState";
import { useSessionsEmptyVariant } from "./hooks/useSessionsEmptyVariant";
import { useDebouncedValue } from "./hooks/useDebouncedValue";

export function SessionsListScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<SessionsFilters>({
    workspaceIds: [],
    statuses: [],
  });

  const debouncedQuery = useDebouncedValue(searchQuery, 100);

  const { selectedProjectId, setSelectedProjectId, isReady: projectReady } = useSelectedProject();
  const { projects, isReady: projectsReady } = useAccessibleProjects();
  const { sessions, isReady: sessionsReady, workspaceJoinIndex } = useSessionsForProject({
    searchQuery: debouncedQuery,
    activeFilters,
  });

  const overallReady = projectReady && projectsReady && sessionsReady;
  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const projectName = currentProject?.name ?? "";

  const variant = useSessionsEmptyVariant({
    isReady: overallReady,
    projectsCount: projects.length,
    workspacesInProjectCount: workspaceJoinIndex.size,
    sessionsInProjectCount: /* count without search/filters */ 0,
    filteredSessionsCount: sessions.length,
    searchQuery: debouncedQuery,
    activeFilters,
  });

  const projectPickerRef = useRef<BottomSheetRef>(null);
  const filterSheetRef = useRef<BottomSheetRef>(null);

  const showFab = variant !== "no-projects" && variant !== "no-workspaces";
  const isMultiProject = projects.length >= 2;

  return (
    <View testID="sessions-list-screen" className="flex-1 bg-background">
      <SessionsList
        projectName={projectName}
        sessions={sessions}
        showFab={showFab}
        headerProps={{
          variant: isMultiProject ? "multi-project" : "single-project",
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          onClearSearch: () => setSearchQuery(""),
          filterCount: activeFilters.workspaceIds.length + activeFilters.statuses.length,
          onProjectChipPress: isMultiProject ? () => projectPickerRef.current?.present() : undefined,
          onFilterPress: () => filterSheetRef.current?.present(),
          onMenuPress: () => {},
        }}
        appliedFilters={/* derived in MOB-NAV-014-V2 */ undefined}
        onClearFilters={() => setActiveFilters({ workspaceIds: [], statuses: [] })}
        onFilterDismiss={(id) => {
          // MOB-NAV-014-V2 owns full chip-remove logic; placeholder ok
        }}
        onSessionPress={(s) => {
          // Sprint 03 wires navigation
        }}
        onSessionLongPress={(s) => {}}
        onNewChatPress={() => {}}
        emptyBody={
          variant ? (
            <SessionsEmptyState
              variant={variant}
              projectName={projectName}
              searchQuery={debouncedQuery}
              onClearSearch={() => setSearchQuery("")}
              onClearFilters={() => setActiveFilters({ workspaceIds: [], statuses: [] })}
            />
          ) : undefined
        }
      />
      {isMultiProject ? (
        <ProjectPickerSheet
          ref={projectPickerRef}
          projects={projects}
          selectedProjectId={selectedProjectId ?? ""}
          onProjectSelect={(p) => {
            setSelectedProjectId(p.id);
            projectPickerRef.current?.dismiss();
          }}
          onClose={() => projectPickerRef.current?.dismiss()}
        />
      ) : null}
      <SessionFilterSheet
        ref={filterSheetRef}
        workspaces={Array.from(workspaceJoinIndex.values()).map((w) => ({
          id: w.id,
          branch: w.branch,
          hostName: w.hostName,
          hostKind: w.hostKind,
        }))}
        initialFilters={activeFilters}
        onApply={(next) => {
          setActiveFilters(next);
          filterSheetRef.current?.dismiss();
        }}
        onClose={() => filterSheetRef.current?.dismiss()}
      />
    </View>
  );
}
```

```yaml
# apps/mobile/.maestro/sessions-list-real.yaml
appId: sh.superset.mobile
---
- runFlow: subflows/login.yaml
- tapOn:
    text: "Chat"
- assertVisible:
    id: "sessions-list-screen"
- assertVisible:
    id: "new-chat-fab"
- tapOn:
    id: "session-search-bar"
- inputText: "auth"
- assertVisible:
    text: "auth"
- tapOn:
    id: "session-search-bar-clear"
```

**Anti-pattern:** Splitting the screen into multiple sibling screen files (`SessionsListPopulated.tsx`, `SessionsListEmpty.tsx`, etc.). Per the "one view, many states" universal rule, this is ONE screen with state-driven body rendering. Splitting them creates routing complexity, breaks the in-memory state model, and confuses Maestro selectors.

Another anti-pattern: passing `searchQuery` directly to `useSessionsForProject` without the 100ms debounce — every keystroke would trigger a re-derivation of the full filtered list, which is expensive on large session sets.

Another anti-pattern: hiding `SessionsList` and conditionally rendering only the empty body. The composed `SessionsList` organism already supports the `emptyBody` slot — pass it through so the header continues to render correctly.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-01 (wireframe §A), UC-NAV-06 (variants), UC-NAV-07 (search), UC-NAV-08 (filter sheet)
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (SessionsListScreen composition)
- `apps/mobile/screens/sessions-list/views/SessionsListLoaded/SessionsListLoaded.tsx` (visual reference for props wiring)

**Interaction notes:**
- 44pt minimum hit target — already enforced by all composed components.
- Light + dark theme — `bg-background` resolves correctly; all child components use tokens from `apps/mobile/global.css`.
- Project-first scoping — every Electric query filters by `selectedProjectId` via `useSessionsForProject` and `useAccessibleProjects`.
- Cache-first per AGENTS.md TanStack DB rule — STRICTLY enforced: render persisted `sessions` array regardless of `isReady`; only branch to empty-state UI when `useSessionsEmptyVariant` returns non-null (which itself gates on isReady).
- The screen is ONE view with 6+ behavioral states. Storybook fixtures at `screens/sessions-list/views/SessionsList*` are reference templates, NOT additional screens.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-5):
1. **RED**: Write failing test in `SessionsListScreen.test.tsx` using `@testing-library/react-native` + mocked hooks (`useSelectedProject`, `useSessionsForProject`, `useAccessibleProjects`).
2. **GREEN**: Modify `SessionsListScreen.tsx` to satisfy.
3. **REFACTOR**: Improve memoization / conditional rendering.
4. Move to next AC.

After AC-1 through AC-5 pass in tests:
- AC-6 (manual sheet smoke) — run dev build, test interactively
- AC-7 (Maestro) — write `.maestro/sessions-list-real.yaml`, run on iOS + Android
- AC-8 (multi-device sync) — dual-device manual test; formal coverage in MOB-PLATF-009

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-NAV-005-INT)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Screen Tests Pass | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` | Exit 0 |
| Debounce Helper Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useDebouncedValue/useDebouncedValue.test.ts` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Dev Smoke | `cd apps/mobile && bun dev` → sign in → tap Chat → exercise search, chip tap, filter tap | Manual ✓ |
| Maestro iOS | `cd apps/mobile && maestro test .maestro/sessions-list-real.yaml` | Exit 0 |
| Maestro Android | `cd apps/mobile && maestro test .maestro/sessions-list-real.yaml --device <android>` | Exit 0 |
| Multi-device sync (manual) | Create session on desktop with same account; observe mobile list | New session appears within 3s |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile screen composition + Maestro flow authoring. Pure React Native + Maestro work owned by react-native-ui-implementer per the mobile AGENTS.md and `13-testing-strategy.md`.

---

## CODING STANDARDS

- `AGENTS.md` rule 9 (TanStack DB cache-first — strictly enforced at this screen layer)
- `apps/mobile/AGENTS.md` (screens own UI; app/ owns routing)
- `plans/chat-mobile-plan/13-testing-strategy.md` (Maestro for E2E verification)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (compose existing organisms, do not re-implement)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (preserve `global.css`)

---

## DEPENDENCIES

- **Depends on:** ALL Wave 0 + Wave 1 + Wave 2 + Wave 3 tasks — MOB-NAV-004-V2-UI, MOB-NAV-007-UI, MOB-NAV-017-UI, MOB-INFRA-005-V2, MOB-INFRA-006-V2, MOB-INFRA-007-V2, MOB-INFRA-011, MOB-NAV-001, MOB-NAV-010-V2, MOB-NAV-017-V2. Also MOB-INFRA-003 for Maestro AC-7.
- **Blocks:** MOB-NAV-008-V2, MOB-NAV-013-V2, MOB-NAV-014-V2 (downstream sheet wiring tasks compose with this screen), MOB-PLATF-009 (multi-device sync verification builds on the screen).

---

## NOTES

- AppliedFilterTags slot remains a placeholder (`appliedFilters={undefined}`) in this task — MOB-NAV-014-V2 will wire the per-chip remove + Clear all + stale-tombstone handling.
- ProjectPickerSheet and SessionFilterSheet are MOUNTED here (with refs + open handlers) but their full data wiring is in MOB-NAV-008-V2 and MOB-NAV-013-V2 respectively. The basic open/close/apply contract works after this task; the wiring tasks refine the data flow.
- `useSessionsForProject` returns `workspaceJoinIndex` which seeds the filter sheet's workspace rows. The shape conversion `Array.from(workspaceJoinIndex.values()).map(...)` is suboptimal — refactor to a dedicated derived selector when MOB-NAV-013-V2 fleshes out the filter sheet wiring.
- BottomSheetModalProvider must wrap the entire app or at minimum the (chat) layout. Check `apps/mobile/screens/RootLayout/` for an existing provider before adding to `(chat)/_layout.tsx`; do NOT double-mount.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN signed-in user with selectedProjectId=proj-a, 5 persisted chatSessions in proj-a, freshly mounted screen (Electric may still be syncing) WHEN screen renders THEN SessionsList shows 5 sessions sorted by lastActiveAt DESC BEFORE isReady=true (cache-first)",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN useAccessibleProjects returns 1 project (case A) or 3 projects (case B) WHEN screen renders THEN case A renders ProjectChipHeader variant='single-project'; case B renders variant='multi-project'",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN sessions include 'Fix auth bug','Refactor billing','AUTH refactor' WHEN user types 'auth' and 100ms elapses THEN visible list reduces to the 2 case-insensitive matches; tapping ✕ restores full list",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN 4 state combinations (projects=[]/workspaces=[]/sessions=[]/search='zzzz') WHEN screen renders each THEN body shows SessionsEmptyState with no-projects/no-workspaces/no-sessions/search-no-match variants",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN variant is 'no-workspaces' or 'no-projects' WHEN screen renders THEN FAB hidden; for 'no-sessions','search-no-match','filters-no-match',populated FAB visible",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN multi-project screen with non-trivial filters WHEN user taps chip then swipes down + taps filter then swipes down THEN both sheets open/dismiss correctly with selectedProjectId and activeFilters unchanged",
      "verify": "Manual: cd apps/mobile && bun dev"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN Maestro installed and test account has ≥1 session WHEN .maestro/sessions-list-real.yaml runs THEN exits 0 on iOS and Android",
      "verify": "cd apps/mobile && maestro test .maestro/sessions-list-real.yaml"
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "description": "GIVEN mobile on sessions list WHEN same account creates new session on desktop THEN new session appears in mobile list within ~3s with no manual refresh",
      "verify": "Manual: dual-device test"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Screen renders populated SessionsList when sessions array is non-empty regardless of isReady",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "ProjectChipHeader receives variant='single-project' when accessibleProjects.length === 1",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "ProjectChipHeader receives variant='multi-project' when accessibleProjects.length >= 2",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Typing 'auth' + 100ms wait reduces visible sessions to 2 (case-insensitive title match)",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Tapping clear ✕ restores full session list",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Empty state 'no-projects' renders when projectsCount=0 + isReady=true",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Empty state 'no-workspaces' renders when workspaces=[] + isReady=true",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Empty state 'no-sessions' renders when sessions=[] + no search + no filters + isReady=true",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Empty state 'search-no-match' renders when search='zzzz' yields zero matches",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "showFab is false when variant is 'no-projects' or 'no-workspaces'",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "showFab is true when variant is null or 'no-sessions' or 'search-no-match' or 'filters-no-match'",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "Tapping chip opens ProjectPickerSheet; swipe-down dismisses without committing",
      "maps_to_ac": "AC-6",
      "verify": "Manual: cd apps/mobile && bun dev"
    },
    {
      "id": "TC-13",
      "type": "test_criterion",
      "description": "Tapping filter button opens SessionFilterSheet; swipe-down dismisses without committing",
      "maps_to_ac": "AC-6",
      "verify": "Manual: cd apps/mobile && bun dev"
    },
    {
      "id": "TC-14",
      "type": "test_criterion",
      "description": "Maestro sessions-list-real.yaml exits 0 on iOS Simulator",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && maestro test .maestro/sessions-list-real.yaml"
    },
    {
      "id": "TC-15",
      "type": "test_criterion",
      "description": "Maestro sessions-list-real.yaml exits 0 on Android Emulator",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && maestro test .maestro/sessions-list-real.yaml --device <android>"
    },
    {
      "id": "TC-16",
      "type": "test_criterion",
      "description": "Manual: desktop-created session appears in mobile list within 3s",
      "maps_to_ac": "AC-8",
      "verify": "Manual dual-device"
    },
    {
      "id": "TC-17",
      "type": "test_criterion",
      "description": "searchQuery and activeFilters state reset on screen unmount",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    }
  ]
}
-->
