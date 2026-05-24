# MOB-NAV-010-V2: Build empty-state rendering for the five UC-NAV-06 variants

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 90 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

UC-NAV-06 (`plans/chat-mobile-plan/09-uc-nav.md:315-332`) defines five distinct empty states that the sessions list must render based on real data conditions:

1. `no-projects` — user has 0 `v2_projects` in the active org (project chip omitted)
2. `no-workspaces` — selected project has 0 `v2_workspaces` (chip retained, FAB hidden)
3. `no-sessions` — workspaces exist but contain no sessions (FAB visually emphasized)
4. `search-no-match` — non-empty search returns 0 sessions (Clear search CTA)
5. `filters-no-match` — ≥1 filter applied with 0 results (Clear filters CTA)

Sprint 01 shipped the visual templates as Storybook view stories at `apps/mobile/screens/sessions-list/views/SessionsListEmpty{NoProjects,NoSessions,NoWorkspaces,SearchNoMatch,FiltersNoMatch}/` using mock data. This task builds a single **dispatcher hook + helper component** that picks the correct variant based on real Electric data + screen state, so MOB-NAV-005-INT can call `<SessionsEmptyDispatcher variant={...} ... />` (or `<SessionsEmptyState ...>` if named that way) to render the right empty UI.

Note per universal rule "one view, many states": the empty states are STATES of the SAME `SessionsListScreen` view, not separate screens. This task creates a thin dispatcher that maps state → variant component.

Current state: 5 isolated Storybook views with mock data, no dispatcher. Desired state: a `SessionsEmptyDispatcher` (or `<SessionsEmptyState>`) component at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx` that takes `{ variant, projectName, searchQuery, onClearSearch, onClearFilters }` props and renders the correct UI; a `useSessionsEmptyVariant({ projects, sessions, searchQuery, activeFilters })` hook returns `SessionsEmptyVariant | null` (null = render the populated list).

---

## CRITICAL CONSTRAINTS

- MUST place the dispatcher component at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx` with co-located `index.ts` + `.test.tsx`.
- MUST place the variant-selection hook at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.ts` with co-located `.test.ts`.
- MUST reuse `EmptyState` from `@/components/EmptyState` for each variant body — DO NOT re-implement the icon + heading + body + cta layout.
- MUST cover all 5 variants from `SessionsEmptyVariant` (`apps/mobile/screens/sessions-list/types.ts:79-85`).
- MUST derive the variant from input data per the spec:
  - `projects.length === 0` AND `isReady === true` → `"no-projects"`
  - `workspacesInProject.length === 0` AND `isReady === true` → `"no-workspaces"`
  - `sessionsInProject.length === 0` AND searchQuery=="" AND filters empty AND `isReady === true` → `"no-sessions"`
  - `filteredSessions.length === 0` AND searchQuery !== "" → `"search-no-match"`
  - `filteredSessions.length === 0` AND (workspaceIds.length>0 OR statuses.length>0) AND searchQuery === "" → `"filters-no-match"`
  - else → `null` (render populated list)
- MUST be cache-first per AGENTS.md TanStack DB rule: return `null` (not an empty state) when `isReady === false` AND any persisted rows might still arrive — i.e., gate empty-state branching on `isReady === true`. Populated-row rendering happens regardless.
- MUST set stable `testID`s on each variant for Maestro probing: `testID="empty-no-projects"`, `testID="empty-no-workspaces"`, `testID="empty-no-sessions"`, `testID="empty-search-no-match"`, `testID="empty-filters-no-match"`.
- MUST surface "Clear search" CTA on `search-no-match` that invokes `onClearSearch` (passed from screen state).
- MUST surface "Clear filters" CTA on `filters-no-match` that invokes `onClearFilters`.
- MUST render the FAB's visual emphasis hint (the `no-sessions` variant has the FAB visually emphasized — the dispatcher signals this by returning `{ variant: "no-sessions", showFab: true, emphasizeFab: true }` in a future iteration; for this task, the dispatcher only owns the body text — the FAB visibility decision lives at the SessionsList layer where `showFab` already exists).
- NEVER duplicate the icon/heading/body strings across components — keep copy in a single `variantCopy` lookup map in the dispatcher component.
- NEVER render any empty state when `isReady === false` — the cache-first rule MUST gate empty-state branching strictly.
- STRICTLY adhere to the 44pt minimum hit target for the CTA buttons (use existing `Button` variant from `@/components/ui/button` with `size="default"` which is ≥44pt; or render via `Pressable` with `min-h-touch-min`).

---

## SPECIFICATION

**Objective:** Provide a `SessionsEmptyState` dispatcher component + `useSessionsEmptyVariant` hook that, given the live data + screen state, render one of the five UC-NAV-06 variants (or `null` for the populated case). Wires the existing 5 Storybook view templates into a single composable surface used by MOB-NAV-005-INT.

**Success state:** `SessionsEmptyState.tsx` and `useSessionsEmptyVariant.ts` exist; mounted with synthetic state, the dispatcher renders the correct variant including testIDs and CTA wiring; `bun run typecheck` exits 0; the dispatcher returns `null` when persisted sessions exist (cache-first preserved).

---

## ACCEPTANCE CRITERIA

### AC-1: useSessionsEmptyVariant returns the correct variant per state

**GIVEN** seven test cases covering (1) projects=[]+ready, (2) workspaces=[]+ready, (3) sessions=[]+ready+no-search+no-filters, (4) filtered=[]+search="x"+no-filters, (5) filtered=[]+filters w/ workspaceIds=[w1], (6) populated, (7) isReady=false
**WHEN** the hook is called for each case
**THEN** the returned variant matches: `"no-projects"`, `"no-workspaces"`, `"no-sessions"`, `"search-no-match"`, `"filters-no-match"`, `null`, `null` (respectively).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts`

### AC-2: SessionsEmptyState renders no-projects copy + testID

**GIVEN** `<SessionsEmptyState variant="no-projects" />`
**WHEN** the component renders
**THEN** an `EmptyState` is rendered with the lucide `Package` icon, heading `"No projects yet"`, body referencing "create a project on desktop", AND the root view carries `testID="empty-no-projects"`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx`

### AC-3: SessionsEmptyState renders search-no-match with working Clear search CTA

**GIVEN** `<SessionsEmptyState variant="search-no-match" projectName="superset" searchQuery="zzzz" onClearSearch={mockClear} />`
**WHEN** the component renders AND the user taps the "Clear search" button
**THEN** the body text references the query string `"zzzz"` and the project name `"superset"`, `onClearSearch` is invoked exactly once, AND `testID="empty-search-no-match"` is present on the root view.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx`

### AC-4: SessionsEmptyState renders filters-no-match with working Clear filters CTA

**GIVEN** `<SessionsEmptyState variant="filters-no-match" onClearFilters={mockClear} />`
**WHEN** the component renders AND the user taps the "Clear filters" button
**THEN** the body text says "No sessions match the active filters" (generic copy), `onClearFilters` is invoked exactly once, AND `testID="empty-filters-no-match"` is present on the root view.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx`

### AC-5: Hook returns null when isReady is false (cache-first)

**GIVEN** the hook is called with `isReady=false` AND `sessions=[]` AND `projects=[]`
**WHEN** the hook runs
**THEN** the returned variant is `null` (NOT `"no-projects"`) — empty states only render once data is known to be empty, never during initial sync.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts`

### AC-6: Storybook stories render all 5 variants without errors

**GIVEN** Storybook is launched with `EXPO_PUBLIC_STORYBOOK=true`
**WHEN** the reviewer navigates to `Screens/SessionsListScreen/SessionsEmptyState` with `variant` arg toggled across `no-projects | no-workspaces | no-sessions | search-no-match | filters-no-match`
**THEN** all 5 variants render correctly on both light and dark themes, each showing the icon + heading + body + (optionally) CTA appropriate to the variant.

**Verify:** Manual: `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook`

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | useSessionsEmptyVariant returns 'no-projects' when projects=[] and isReady=true | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` |
| TC-2 | useSessionsEmptyVariant returns 'no-workspaces' when workspacesInProject=[] and isReady=true | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` |
| TC-3 | useSessionsEmptyVariant returns 'no-sessions' when sessionsInProject=[] + no-search + no-filters + isReady=true | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` |
| TC-4 | useSessionsEmptyVariant returns 'search-no-match' when filtered=[] + searchQuery !== '' | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` |
| TC-5 | useSessionsEmptyVariant returns 'filters-no-match' when filtered=[] + filters non-empty + searchQuery='' | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` |
| TC-6 | useSessionsEmptyVariant returns null when sessions populated | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` |
| TC-7 | useSessionsEmptyVariant returns null when isReady=false (cache-first gate) | AC-5 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` |
| TC-8 | SessionsEmptyState renders 'No projects yet' heading and Package icon when variant='no-projects' | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx` |
| TC-9 | SessionsEmptyState search-no-match body text contains the search query and project name | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx` |
| TC-10 | SessionsEmptyState Clear search button invokes onClearSearch when tapped | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx` |
| TC-11 | SessionsEmptyState filters-no-match body uses generic copy 'No sessions match the active filters' | AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx` |
| TC-12 | SessionsEmptyState Clear filters button invokes onClearFilters when tapped | AC-4 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx` |
| TC-13 | Each variant carries its prescribed testID | AC-2, AC-3, AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx` |
| TC-14 | Storybook story renders all 5 variants without errors | AC-6 | happy_path | Manual: `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/screens/sessions-list/views/SessionsListEmptyNoProjects/SessionsListEmptyNoProjects.tsx` | 1-36 | Variant 1 template — Package icon + "No projects yet" copy |
| `apps/mobile/screens/sessions-list/views/SessionsListEmptyNoSessions/SessionsListEmptyNoSessions.tsx` | (read) | Variant 3 template |
| `apps/mobile/screens/sessions-list/views/SessionsListEmptyNoWorkspaces/SessionsListEmptyNoWorkspaces.tsx` | (read) | Variant 2 template |
| `apps/mobile/screens/sessions-list/views/SessionsListSearchNoMatch/SessionsListSearchNoMatch.tsx` | 1-58 | Variant 4 template — Search icon + query-referencing body + Clear search Pressable |
| `apps/mobile/screens/sessions-list/views/SessionsListFiltersNoMatch/SessionsListFiltersNoMatch.tsx` | (read) | Variant 5 template |
| `apps/mobile/components/EmptyState/EmptyState.tsx` | 1-52 | Reusable EmptyState atom — icon + heading + body + cta slot |
| `apps/mobile/screens/sessions-list/types.ts` | 79-85 | `SessionsEmptyVariant` union |
| `plans/chat-mobile-plan/09-uc-nav.md` | 315-332 | UC-NAV-06 spec — 5 variants + ACs |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.stories.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/index.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/index.ts` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/EmptyState/**` — atom is fixed; this task composes it
- `apps/mobile/components/ui/**` — vendor primitives
- `apps/mobile/screens/sessions-list/views/**` — pre-existing Storybook view templates; leave them as reference fixtures
- `apps/mobile/screens/sessions-list/types.ts` — `SessionsEmptyVariant` union is stable
- `apps/mobile/global.css` — established ember tokens
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` — owned by MOB-NAV-005-INT; this task only provides the empty-state component for it to consume

---

## CODE PATTERN

**Reference:** Single dispatcher component + variant-selection hook. The dispatcher uses a `switch` over `variant` to render the correct `EmptyState` configuration; the hook applies a pure decision tree over input state.

**Source:** `apps/mobile/screens/sessions-list/views/SessionsListEmptyNoProjects/SessionsListEmptyNoProjects.tsx:17-36` (icon + copy pattern); `apps/mobile/screens/sessions-list/views/SessionsListSearchNoMatch/SessionsListSearchNoMatch.tsx:20-58` (cta wiring pattern).

**Example (dispatcher sketch):**
```tsx
// apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx
import { MessageSquare, Package, Search, Settings, Workflow } from "lucide-react-native";
import { Pressable, View } from "react-native";
import { EmptyState } from "@/components/EmptyState";
import { Text } from "@/components/ui/text";
import type { SessionsEmptyVariant } from "@/screens/sessions-list/types";

export type SessionsEmptyStateProps = {
  variant: SessionsEmptyVariant;
  projectName?: string;
  searchQuery?: string;
  onClearSearch?: () => void;
  onClearFilters?: () => void;
};

const testIdByVariant: Record<SessionsEmptyVariant, string> = {
  "no-projects": "empty-no-projects",
  "no-workspaces": "empty-no-workspaces",
  "no-sessions": "empty-no-sessions",
  "search-no-match": "empty-search-no-match",
  "filters-no-match": "empty-filters-no-match",
};

export function SessionsEmptyState(props: SessionsEmptyStateProps) {
  const testID = testIdByVariant[props.variant];
  switch (props.variant) {
    case "no-projects":
      return (
        <View testID={testID} className="flex-1">
          <EmptyState
            icon={Package}
            heading="No projects yet"
            body="Create a project on desktop to get started."
          />
        </View>
      );
    case "no-workspaces":
      return (
        <View testID={testID} className="flex-1">
          <EmptyState
            icon={Workflow}
            heading={`No workspaces in ${props.projectName ?? ""}`}
            body="Create one on desktop."
          />
        </View>
      );
    case "no-sessions":
      return (
        <View testID={testID} className="flex-1">
          <EmptyState
            icon={MessageSquare}
            heading={`Start your first chat in ${props.projectName ?? ""}`}
            body={`Tap "+" below to pick a workspace.`}
          />
        </View>
      );
    case "search-no-match":
      return (
        <View testID={testID} className="flex-1">
          <EmptyState
            icon={Search}
            heading="No matches"
            body={`No sessions in ${props.projectName ?? "this project"} match "${props.searchQuery ?? ""}".`}
            cta={
              <Pressable
                accessibilityRole="button"
                className="bg-secondary px-4 min-h-touch-min items-center justify-center rounded-md"
                onPress={props.onClearSearch}
                testID="empty-search-no-match-clear"
              >
                <Text>Clear search</Text>
              </Pressable>
            }
          />
        </View>
      );
    case "filters-no-match":
      return (
        <View testID={testID} className="flex-1">
          <EmptyState
            icon={Settings}
            heading="No matches"
            body="No sessions match the active filters."
            cta={
              <Pressable
                accessibilityRole="button"
                className="bg-secondary px-4 min-h-touch-min items-center justify-center rounded-md"
                onPress={props.onClearFilters}
                testID="empty-filters-no-match-clear"
              >
                <Text>Clear filters</Text>
              </Pressable>
            }
          />
        </View>
      );
  }
}
```

**Hook sketch:**
```ts
// useSessionsEmptyVariant.ts
import type { SessionsEmptyVariant, SessionsFilters } from "@/screens/sessions-list/types";

export type UseSessionsEmptyVariantArgs = {
  isReady: boolean;
  projectsCount: number;
  workspacesInProjectCount: number;
  sessionsInProjectCount: number; // pre-search/filter count
  filteredSessionsCount: number;  // post-search+filter count
  searchQuery: string;
  activeFilters: SessionsFilters;
};

export function useSessionsEmptyVariant(args: UseSessionsEmptyVariantArgs): SessionsEmptyVariant | null {
  if (!args.isReady) return null; // cache-first: never render an empty state during initial sync
  if (args.projectsCount === 0) return "no-projects";
  if (args.workspacesInProjectCount === 0) return "no-workspaces";
  if (args.sessionsInProjectCount === 0 && args.searchQuery === "" && args.activeFilters.workspaceIds.length === 0 && args.activeFilters.statuses.length === 0) {
    return "no-sessions";
  }
  if (args.filteredSessionsCount === 0 && args.searchQuery !== "") return "search-no-match";
  if (args.filteredSessionsCount === 0 && (args.activeFilters.workspaceIds.length > 0 || args.activeFilters.statuses.length > 0)) {
    return "filters-no-match";
  }
  return null;
}
```

**Anti-pattern:** Importing the 5 existing Storybook view templates and re-rendering them. They were Storybook fixtures — they wrap the full SessionsList shell. The dispatcher needs to render JUST the empty-state body so MOB-NAV-005-INT can swap it in via the `emptyBody` slot of the existing SessionsList organism.

Another anti-pattern: returning the variant when `isReady === false` and sessions are empty. That causes a "No projects yet" flash on cold launch before sync completes — exactly what the cache-first rule exists to prevent.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-06 + §F wireframes (lines 209-251)
- `apps/mobile/components/EmptyState/EmptyState.tsx` (atom contract — icon, heading, body, cta slot)
- `apps/mobile/screens/sessions-list/views/SessionsListEmpty*/*.tsx` (reference templates for copy and icons)

**Interaction notes:**
- 44pt minimum hit target — CTA buttons use `min-h-touch-min` Tailwind class.
- Light + dark theme — `bg-secondary` + `text-foreground` resolve correctly in both themes from `apps/mobile/global.css`.
- Project-first scoping — variants reference `projectName` where applicable; "no-projects" omits the chip (handled by SessionsListScreen, not this component).
- Cache-first per AGENTS.md TanStack DB rule — hook returns `null` when `isReady === false`, guaranteeing no flash.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-5):
1. **RED**: Write failing test (hook tests for AC-1, AC-5; component tests for AC-2, AC-3, AC-4).
2. **GREEN**: Write minimum code.
3. **REFACTOR**: Improve.
4. Move to next AC.

After AC-1 through AC-5 land, create `SessionsEmptyState.stories.tsx` and manually verify all 5 variants in Storybook (AC-6).

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-NAV-010-V2)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Hook Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts` | Exit 0 |
| Component Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Storybook renders all 5 variants | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook` → `SessionsEmptyState` story → toggle `variant` arg through all 5 values; toggle light/dark | Manual ✓ each variant |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile UI dispatcher + variant-selection hook. Composes existing atoms (`EmptyState`, `Pressable`). Owned by react-native-ui-implementer.

---

## CODING STANDARDS

- `AGENTS.md` (TanStack DB cache-first rule — hook returns null when isReady=false)
- `apps/mobile/AGENTS.md` (screen-co-location: dispatcher + hook live under `SessionsListScreen/components/` and `SessionsListScreen/hooks/`)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (EmptyState atom is the base; configure variants, don't reimplement)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (preserve `global.css`)

---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-005-V2 (so consumer can pass real `projectsCount`/`workspacesInProjectCount`/etc. derived from live queries), MOB-INFRA-007-V2 (provides the filtered counts), MOB-INFRA-011 (provides `projectsCount`). The dispatcher itself only depends on the EmptyState atom shipped in Sprint 01.
- **Blocks:** MOB-NAV-005-INT (assembly task consumes both dispatcher and hook)

---

## NOTES

- The dispatcher does NOT decide whether to show the FAB — that decision lives at the SessionsList layer using its existing `showFab` prop. MOB-NAV-005-INT will compute `showFab = variant !== "no-workspaces" && variant !== "no-projects"`.
- The "no-projects" variant relies on the SessionsListScreen omitting the project chip in the header; the dispatcher renders only the body content.
- Copy strings should match UC-NAV-06 wireframe panels (`09-uc-nav.md:209-251`) — adjust the example body strings to match exactly if needed during implementation.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN seven test cases covering projects=[]+ready / workspaces=[]+ready / sessions=[]+ready+no-search+no-filters / search-no-match / filters-no-match / populated / isReady=false WHEN hook is called THEN returned variant matches no-projects/no-workspaces/no-sessions/search-no-match/filters-no-match/null/null",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN <SessionsEmptyState variant='no-projects' /> WHEN rendered THEN EmptyState with Package icon, heading 'No projects yet', body referencing desktop creation, and testID='empty-no-projects'",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN variant='search-no-match' projectName='superset' searchQuery='zzzz' onClearSearch=mockClear WHEN tapping Clear search button THEN body references 'zzzz' and 'superset', mockClear invoked once, testID='empty-search-no-match'",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN variant='filters-no-match' onClearFilters=mockClear WHEN tapping Clear filters button THEN body 'No sessions match the active filters', mockClear invoked once, testID='empty-filters-no-match'",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN hook called with isReady=false, sessions=[], projects=[] WHEN runs THEN returned variant is null (not 'no-projects')",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN Storybook launched WHEN reviewer toggles variant arg across all 5 values THEN each renders correctly on light + dark themes",
      "verify": "Manual: cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "useSessionsEmptyVariant returns 'no-projects' when projects=[] and isReady=true",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "useSessionsEmptyVariant returns 'no-workspaces' when workspacesInProject=[] and isReady=true",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "useSessionsEmptyVariant returns 'no-sessions' when sessionsInProject=[] + no-search + no-filters + isReady=true",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "useSessionsEmptyVariant returns 'search-no-match' when filtered=[] + searchQuery !== ''",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "useSessionsEmptyVariant returns 'filters-no-match' when filtered=[] + filters non-empty + searchQuery=''",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "useSessionsEmptyVariant returns null when sessions populated",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "useSessionsEmptyVariant returns null when isReady=false (cache-first gate)",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useSessionsEmptyVariant/useSessionsEmptyVariant.test.ts"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "SessionsEmptyState renders 'No projects yet' heading and Package icon when variant='no-projects'",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "SessionsEmptyState search-no-match body text contains the search query and project name",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "SessionsEmptyState Clear search button invokes onClearSearch when tapped",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "SessionsEmptyState filters-no-match body uses generic copy 'No sessions match the active filters'",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "SessionsEmptyState Clear filters button invokes onClearFilters when tapped",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "TC-13",
      "type": "test_criterion",
      "description": "Each variant carries its prescribed testID",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx"
    },
    {
      "id": "TC-14",
      "type": "test_criterion",
      "description": "Storybook story renders all 5 variants without errors",
      "maps_to_ac": "AC-6",
      "verify": "Manual: cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook"
    }
  ]
}
-->
