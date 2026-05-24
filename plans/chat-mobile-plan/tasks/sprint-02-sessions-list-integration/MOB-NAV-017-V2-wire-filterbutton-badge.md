# MOB-NAV-017-V2: Wire FilterButton badge count to activeFilters state

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 45 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** S

---

## BACKGROUND

MOB-NAV-017-UI created the `FilterButton` component which accepts a `count: number` prop and renders the `·N` badge when count > 0. This task WIRES that prop to the live `activeFilters` state held by `SessionsListScreen` (per the SessionsListScreen spec in `11-technical-requirements/05-ui-infrastructure.md:9` — "Holds two pieces of in-memory state (cleared on screen exit): `searchQuery: string` and `activeFilters: { workspaceIds: string[]; statuses: SessionStatus[] }`").

The formula per UC-NAV-08 spec line 367 is exact: `N = activeFilters.workspaceIds.length + activeFilters.statuses.length`. The badge MUST be hidden when N is 0 — that's already encapsulated in the FilterButton component's internal conditional render, so this task just passes the computed `count` value.

Per the spec, this wiring is a SMALL slice that lives inside `SessionsListScreen.tsx` (MOB-NAV-005-INT). However, the badge-count derivation can be extracted into a tiny memoized helper (`useFilterCount(activeFilters)`) so it's reusable and testable in isolation. This task creates that helper + wires it.

Note: Most of the wiring physically lives in MOB-NAV-005-INT (which assembles the full screen). This task carves out the badge-count derivation specifically so it ships as a focused, testable slice and so MOB-NAV-005-INT can compose it cleanly.

Current state: FilterButton component exists with `count` prop, but no consumer wires the count. Desired state: `useFilterCount` helper exists, `SessionsListScreen` passes `count={useFilterCount(activeFilters)}` to the FilterButton (through ProjectChipHeader's filter wiring slot), and Maestro can verify the badge appears with `·N` text.

---

## CRITICAL CONSTRAINTS

- MUST place the helper at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.ts` with co-located `index.ts` + `.test.ts`.
- MUST implement the formula EXACTLY: `count = activeFilters.workspaceIds.length + activeFilters.statuses.length`.
- MUST use `useMemo` to memoize the computation so reference identity is stable across re-renders with identical inputs.
- MUST take a `SessionsFilters` argument (type from `@/screens/sessions-list/types`).
- MUST return a `number`.
- MUST also wire the helper at the `SessionsListScreen` level — that means MOB-NAV-005-INT's `ProjectChipHeader`/`FilterButton` rendering will receive `count={useFilterCount(activeFilters)}`. For this task to be SHIPPABLE without MOB-NAV-005-INT existing, ALSO create a tiny `<FilterButtonConnected>` wrapper at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.tsx` that takes `activeFilters` + `onPress` and renders `<FilterButton count={useFilterCount(activeFilters)} onPress={onPress} />`.
- MUST NOT introduce reducers, contexts, or selectors — pure props-driven.
- NEVER duplicate the formula at the component layer — the FilterButtonConnected component MUST call the hook, not redo the math inline.
- STRICTLY adhere to the 44pt minimum hit target — already enforced by the underlying FilterButton/IconButton size="md".

---

## SPECIFICATION

**Objective:** Provide `useFilterCount(activeFilters)` + `<FilterButtonConnected activeFilters={...} onPress={...} />` so the badge count is derived consistently from the screen's `activeFilters` state across both the FilterButton and any other UI that needs to display the count.

**Success state:** Helper hook + connected wrapper exist, both tested; calling `<FilterButtonConnected activeFilters={{ workspaceIds: ["w1","w2"], statuses: ["live"] }} onPress={() => {}} />` renders a FilterButton with `count=3` and badge `·3` visible; mutating `activeFilters` to empty arrays hides the badge.

---

## ACCEPTANCE CRITERIA

### AC-1: useFilterCount returns workspaceIds.length + statuses.length

**GIVEN** five test cases: (1) both empty, (2) workspaceIds=[w1], (3) statuses=[live], (4) workspaceIds=[w1,w2] + statuses=[live], (5) workspaceIds=[w1,w2,w3] + statuses=[live,pause-pending]
**WHEN** `useFilterCount` is called for each
**THEN** the returned counts are `0`, `1`, `1`, `3`, `5` respectively.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts`

### AC-2: useFilterCount is memoized and reference-stable

**GIVEN** the same `activeFilters` reference is passed on two successive renders
**WHEN** `useFilterCount` is called each time
**THEN** the returned number is the same (numbers are primitives so they're always equal by value; the stability concern here is the absence of expensive recomputation). The internal `useMemo` dependency array is `[activeFilters.workspaceIds, activeFilters.statuses]` so a parent re-render with the SAME array references does not re-run the computation.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` (assert via spy on a `recomputed` counter inside the hook test fixture).

### AC-3: FilterButtonConnected renders FilterButton with computed count

**GIVEN** `<FilterButtonConnected activeFilters={{ workspaceIds: ["w1"], statuses: ["live"] }} onPress={mockHandler} />`
**WHEN** the component renders
**THEN** a `FilterButton` is rendered with `count={2}` AND the badge displays `·2` AND `testID="filter-button"` is present on the IconButton AND `testID="filter-badge"` is present on the badge.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx`

### AC-4: FilterButtonConnected hides badge when both axes are empty

**GIVEN** `<FilterButtonConnected activeFilters={{ workspaceIds: [], statuses: [] }} onPress={mockHandler} />`
**WHEN** the component renders
**THEN** the FilterButton receives `count={0}` AND NO badge is rendered (verified via `queryByTestId("filter-badge")` returning null).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx`

### AC-5: onPress forwards to underlying FilterButton

**GIVEN** `<FilterButtonConnected activeFilters={...} onPress={mockHandler} />`
**WHEN** the user taps the button
**THEN** `mockHandler` is invoked exactly once with no arguments.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx`

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | useFilterCount returns 0 when both axes empty | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` |
| TC-2 | useFilterCount returns 1 when only workspaceIds has 1 entry | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` |
| TC-3 | useFilterCount returns 1 when only statuses has 1 entry | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` |
| TC-4 | useFilterCount returns 3 when workspaceIds=[w1,w2] + statuses=[live] | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` |
| TC-5 | useFilterCount returns 5 when workspaceIds=[w1,w2,w3] + statuses=[live,pause-pending] | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` |
| TC-6 | useFilterCount internal recompute counter is incremented only when array references change | AC-2 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` |
| TC-7 | FilterButtonConnected renders FilterButton with count=2 when activeFilters has 1 ws + 1 status | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx` |
| TC-8 | FilterButtonConnected renders badge with text '·2' when count=2 | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx` |
| TC-9 | FilterButtonConnected does NOT render badge when count=0 | AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx` |
| TC-10 | FilterButtonConnected invokes onPress exactly once when tapped | AC-5 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/components/FilterButton/FilterButton.tsx` | (MOB-NAV-017-UI deliverable) | FilterButton API — `count`, `onPress`, internal badge render |
| `apps/mobile/screens/sessions-list/types.ts` | 69-74 | `SessionsFilters` shape |
| `plans/chat-mobile-plan/09-uc-nav.md` | 351-373 | UC-NAV-08 spec — badge count formula |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 9, 12 | SessionsListScreen state model + FilterButton placement |
| `apps/mobile/components/FilterCheckboxRow/FilterCheckboxRow.tsx` | (read) | `FilterStatusValue` type — sourced by the SessionFilterSheet |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/index.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/index.ts` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/FilterButton/**` — owned by MOB-NAV-017-UI; this task consumes it
- `apps/mobile/components/ProjectChipHeader/**` — uses FilterButton via the MOB-NAV-017-UI refactor; do not edit here
- `apps/mobile/screens/sessions-list/types.ts` — type contract is stable
- `apps/mobile/global.css` — established ember tokens
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` — owned by MOB-NAV-005-INT; that task wires FilterButtonConnected at the appropriate slot

---

## CODE PATTERN

**Reference:** Trivial connected wrapper composing a presentational component with derived props from a memoized hook.

**Source:** Helper-hook pattern. The connected component is intentionally tiny.

**Example:**
```ts
// apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.ts
import { useMemo } from "react";
import type { SessionsFilters } from "@/screens/sessions-list/types";

export function useFilterCount(activeFilters: SessionsFilters): number {
  return useMemo(
    () => activeFilters.workspaceIds.length + activeFilters.statuses.length,
    [activeFilters.workspaceIds, activeFilters.statuses],
  );
}
```

```tsx
// apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.tsx
import { FilterButton } from "@/components/FilterButton";
import type { SessionsFilters } from "@/screens/sessions-list/types";
import { useFilterCount } from "../../hooks/useFilterCount";

export type FilterButtonConnectedProps = {
  activeFilters: SessionsFilters;
  onPress: () => void;
  disabled?: boolean;
};

/**
 * Domain-bound FilterButton — derives the badge count from activeFilters
 * via useFilterCount. Used by SessionsListScreen to avoid scattering the
 * count formula across the screen body.
 */
export function FilterButtonConnected({ activeFilters, onPress, disabled }: FilterButtonConnectedProps) {
  const count = useFilterCount(activeFilters);
  return <FilterButton count={count} onPress={onPress} disabled={disabled} />;
}
```

**Anti-pattern:** Inlining the formula at the call site in `SessionsListScreen.tsx` (`<FilterButton count={activeFilters.workspaceIds.length + activeFilters.statuses.length} ... />`). That duplicates the formula across consumers and risks divergence if a third axis is added in a future sprint. The hook is the single source of truth.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-08 line 367 (badge count formula)
- `apps/mobile/components/FilterButton/FilterButton.tsx` (MOB-NAV-017-UI deliverable — `count` prop contract)

**Interaction notes:**
- 44pt minimum hit target — already enforced by FilterButton's IconButton size="md".
- Light + dark theme — FilterButton's Badge resolves correctly in both themes.
- Project-first scoping — N/A; this task is filter-axis math.
- Cache-first per AGENTS.md TanStack DB rule — N/A; this task operates on in-memory `activeFilters` state, not live queries.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-5):
1. **RED**: Write failing test in `useFilterCount.test.ts` or `FilterButtonConnected.test.tsx`.
2. **GREEN**: Write minimum code.
3. **REFACTOR**: Improve.
4. Move to next AC.

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-NAV-017-V2)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Hook Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts` | Exit 0 |
| Component Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile UI helper + connected component, no data layer beyond a pure derivation. Owned by react-native-ui-implementer.

---

## CODING STANDARDS

- `AGENTS.md` (DRY Rule of 2 — derive count once, reuse)
- `apps/mobile/AGENTS.md` (screen-co-location: hook + component under `SessionsListScreen/`)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (FilterButton atom is the base; configure via props)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (N/A here; reinforces hands-off `global.css`)

---

## DEPENDENCIES

- **Depends on:** MOB-NAV-017-UI (FilterButton must exist with `count` prop)
- **Blocks:** MOB-NAV-005-INT (assembly task consumes FilterButtonConnected via the ProjectChipHeader slot)

---

## NOTES

- This task is a small slice carved from MOB-NAV-005-INT to keep the assembly task focused on screen composition rather than wiring math.
- The recomputation-stability assertion (TC-6) is best implemented by wrapping `useFilterCount` in a fixture that increments a counter on every body execution, then asserting the counter doesn't increment on a parent re-render with same-reference args.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN 5 test cases (empty / wsIds=[w1] / statuses=[live] / wsIds=[w1,w2]+statuses=[live] / wsIds=[w1,w2,w3]+statuses=[live,pause-pending]) WHEN useFilterCount called THEN returns 0/1/1/3/5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN same activeFilters reference passed on two renders WHEN useFilterCount called each time THEN internal useMemo does not re-run (counter unchanged)",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN FilterButtonConnected with activeFilters {wsIds:[w1], statuses:[live]} WHEN rendered THEN FilterButton receives count=2, badge shows '·2', testIDs filter-button and filter-badge present",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN FilterButtonConnected with both axes empty WHEN rendered THEN FilterButton receives count=0 and NO badge rendered (queryByTestId 'filter-badge' returns null)",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN FilterButtonConnected with onPress=mockHandler WHEN tapped THEN mockHandler invoked exactly once",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "useFilterCount returns 0 when both axes empty",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "useFilterCount returns 1 when only workspaceIds has 1 entry",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "useFilterCount returns 1 when only statuses has 1 entry",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "useFilterCount returns 3 when workspaceIds=[w1,w2] + statuses=[live]",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "useFilterCount returns 5 when workspaceIds=[w1,w2,w3] + statuses=[live,pause-pending]",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "useFilterCount internal recompute counter is incremented only when array references change",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/hooks/useFilterCount/useFilterCount.test.ts"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "FilterButtonConnected renders FilterButton with count=2 when activeFilters has 1 ws + 1 status",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "FilterButtonConnected renders badge with text '·2' when count=2",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "FilterButtonConnected does NOT render badge when count=0",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "FilterButtonConnected invokes onPress exactly once when tapped",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/FilterButtonConnected/FilterButtonConnected.test.tsx"
    }
  ]
}
-->
