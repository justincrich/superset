# MOB-NAV-013-V2: Wire SessionFilterSheet to activeFilters state

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 120 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

The Sprint 01 `SessionFilterSheet` organism (`apps/mobile/screens/sessions-list/components/SessionFilterSheet/SessionFilterSheet.tsx:39-135`) accepts props `workspaces: FilterValueWorkspace[]`, `initialFilters: SessionsFilters`, `onApply`, `onClose`. It manages its own internal selection state and commits via `onApply` only when Apply is tapped.

MOB-NAV-005-INT MOUNTS the sheet inline and seeds `workspaces` from `useSessionsForProject().workspaceJoinIndex`. This task EXTRACTS that wiring into a dedicated connected wrapper (`SessionFilterSheetConnected`) and refines the workspace shaping:

1. Pull `workspaces` from `useSessionsForProject().workspaceJoinIndex` — converting the Map values into the `FilterValueWorkspace[]` shape (`{ id, branch, hostName, hostKind }`).
2. Accept `activeFilters` + `onApply` as props (caller-owned state per UC-NAV-08 spec line 364).
3. Sort workspace rows by `branch ASC` then `hostName ASC` for stable presentation; ensure rows with duplicate branch on different hosts BOTH appear with host suffix (per UC-NAV-08 wireframe §C lines 128-144).
4. Status rows are static (Streaming / Pause pending / Idle) — already encoded in the SessionFilterSheet organism.
5. Add testIDs per `11-technical-requirements/05-ui-infrastructure.md:33-44`: `filter-sheet-workspace-row-{workspaceId}`, `filter-sheet-status-row-{status}`, `filter-sheet-apply`, `filter-sheet-clear`.

Current state: SessionFilterSheet inline in MOB-NAV-005-INT with raw workspace shaping. Desired state: dedicated `SessionFilterSheetConnected` wrapper owning the hook-to-props translation, workspace shaping, sorting, and testID forwarding; MOB-NAV-005-INT consumes the wrapper.

---

## CRITICAL CONSTRAINTS

- MUST place the connected wrapper at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.tsx` with co-located `index.ts` + `.test.tsx`.
- MUST forward a `BottomSheetRef` via `forwardRef`.
- MUST accept props `activeFilters: SessionsFilters`, `onApply: (next: SessionsFilters) => void`.
- MUST consume `useSessionsForProject()` internally to get `workspaceJoinIndex` (so the workspace rows reflect the actual project's workspaces).
- MUST shape `Map<workspaceId, V2Workspace>` → `FilterValueWorkspace[]` with sort: branch ASC, then hostName ASC. Output type must match `apps/mobile/screens/sessions-list/types.ts:62-67`.
- MUST pass `initialFilters={activeFilters}` to the underlying SessionFilterSheet on each mount AND on each Apply round-trip (the sheet's internal state syncs from initialFilters when re-presented).
- MUST forward `onApply` directly to the underlying sheet; the wrapper's `onApply` callback is invoked when user taps Apply.
- MUST forward `onClose` to dismiss the sheet without committing.
- MUST add testIDs to workspace rows and status rows via small patches to `FilterCheckboxRow` or `SessionFilterSheet` if not already present (verify; this task may need to add `testID` prop forwarding). The testIDs required:
  - `filter-sheet-workspace-row-{workspaceId}`
  - `filter-sheet-status-row-{statusValue}`
  - `filter-sheet-apply` (Apply button)
  - `filter-sheet-clear` (Clear all button)
- MUST be cache-first: render the sheet with persisted workspaces even when `isReady=false` from useSessionsForProject.
- MUST handle empty workspaces (project has zero workspaces) gracefully — the sheet still renders with an empty Workspaces section + the static Status section. (In practice, the screen-level empty-no-workspaces variant would hide the filter button before this state is reachable, but defense-in-depth.)
- NEVER persist filter state across screen exits — pure pass-through. Internal sheet state resets when the sheet re-presents with new `initialFilters`.
- NEVER mutate `activeFilters` — call `onApply` with a new object.
- NEVER bypass the workspace-shape conversion — always pass a properly-typed `FilterValueWorkspace[]` to the organism.
- STRICTLY adhere to 44pt minimum hit target — FilterCheckboxRow already satisfies this.

---

## SPECIFICATION

**Objective:** Provide `<SessionFilterSheetConnected ref activeFilters onApply />` — a connected wrapper that pulls workspace data from `useSessionsForProject()`, shapes it for the underlying organism, passes through `activeFilters` and `onApply`, and adds the testIDs required by Maestro.

**Success state:** Mounted with a ref + activeFilters + onApply, the wrapper presents the sheet on `ref.current?.present()`, displays workspaces in the selected project sorted by branch+hostName, displays the 3 static status rows, commits filter changes via the onApply callback when Apply is tapped, and dismisses without committing on backdrop tap.

---

## ACCEPTANCE CRITERIA

### AC-1: Connected wrapper shapes workspaces from useSessionsForProject

**GIVEN** `useSessionsForProject()` returns `workspaceJoinIndex` with 3 workspaces: `[{id:"w1", branch:"main", hostName:"macbook", hostKind:"laptop", projectId:"p1"}, {id:"w2", branch:"feature-x", hostName:"cloud-1", hostKind:"cloud", projectId:"p1"}, {id:"w3", branch:"main", hostName:"desktop", hostKind:"laptop", projectId:"p1"}]`
**WHEN** `<SessionFilterSheetConnected>` is mounted and presented
**THEN** the underlying SessionFilterSheet's `workspaces` prop receives an array of 3 items shaped as `FilterValueWorkspace[]` sorted by branch ASC then hostName ASC: order is `[feature-x/cloud-1, main/desktop, main/macbook]`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx`

### AC-2: Apply invokes onApply with new SessionsFilters

**GIVEN** the sheet is presented with `activeFilters={ workspaceIds: [], statuses: [] }`
**WHEN** the user toggles workspace `w1` and status `live`, then taps Apply
**THEN** the wrapper's `onApply` callback is invoked exactly once with `{ workspaceIds: ["w1"], statuses: ["live"] }`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx`

### AC-3: TestIDs are present on workspace rows, status rows, and footer buttons

**GIVEN** the sheet is presented with 2 workspaces (`w1`, `w2`)
**WHEN** the rendered tree is queried
**THEN** the tree contains: `testID="filter-sheet-workspace-row-w1"`, `testID="filter-sheet-workspace-row-w2"`, `testID="filter-sheet-status-row-streaming"`, `testID="filter-sheet-status-row-pause-pending"`, `testID="filter-sheet-status-row-idle"`, `testID="filter-sheet-apply"`, `testID="filter-sheet-clear"`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx`

### AC-4: Initial filter state is sourced from activeFilters prop

**GIVEN** the wrapper is mounted with `activeFilters={ workspaceIds: ["w2"], statuses: ["pause-pending"] }`
**WHEN** the sheet is presented
**THEN** the workspace row for `w2` AND the status row for `pause-pending` render with `checked=true` (visible check mark) initially.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx`

### AC-5: Backdrop dismiss does NOT commit filter changes

**GIVEN** the sheet is presented with `activeFilters={ workspaceIds: [], statuses: [] }` AND the user has toggled some rows without tapping Apply
**WHEN** the user swipes down or taps the backdrop to dismiss
**THEN** the wrapper's `onApply` callback is NOT invoked; the parent's `activeFilters` remains `{ workspaceIds: [], statuses: [] }`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx`

### AC-6: Maestro asserts filter sheet open + Apply round-trip + badge appearance

**GIVEN** Maestro installed and a test account with multiple workspaces and at least one live session
**WHEN** `.maestro/session-filter.yaml` runs: login → Chat tab → tap filter button (assert visible sheet) → tap workspace row → tap status `Streaming` → tap Apply → assert sheet dismissed → assert `filter-badge` visible with `·2`
**THEN** the flow exits 0 on both iOS and Android.

**Verify:** `cd apps/mobile && maestro test .maestro/session-filter.yaml`

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | Connected wrapper passes workspaces sorted by branch ASC then hostName ASC | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-2 | Connected wrapper shapes workspaceJoinIndex Map values into FilterValueWorkspace[] | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-3 | Tapping Apply invokes onApply with the toggled filters exactly once | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-4 | Each workspace row carries testID='filter-sheet-workspace-row-{workspaceId}' | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-5 | Each status row carries testID='filter-sheet-status-row-{statusValue}' | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-6 | Apply button carries testID='filter-sheet-apply' | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-7 | Clear all button carries testID='filter-sheet-clear' | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-8 | Workspace row for w2 renders checked=true when activeFilters.workspaceIds includes 'w2' | AC-4 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-9 | Status row for pause-pending renders checked=true when activeFilters.statuses includes 'pause-pending' | AC-4 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-10 | Backdrop dismiss does NOT invoke onApply | AC-5 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` |
| TC-11 | Maestro session-filter.yaml exits 0 on iOS Simulator | AC-6 | happy_path | `cd apps/mobile && maestro test .maestro/session-filter.yaml` |
| TC-12 | Maestro session-filter.yaml exits 0 on Android Emulator | AC-6 | edge | `cd apps/mobile && maestro test .maestro/session-filter.yaml --device <android>` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/screens/sessions-list/components/SessionFilterSheet/SessionFilterSheet.tsx` | 1-135 | Underlying organism — props, internal state, Apply behavior |
| `apps/mobile/components/FilterCheckboxRow/FilterCheckboxRow.tsx` | (read all) | Row component — verify testID forward + `kind` + `checked` props |
| `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/` | (from MOB-INFRA-007-V2) | Hook contract — `workspaceJoinIndex` shape |
| `apps/mobile/screens/sessions-list/types.ts` | 62-74 | `FilterValueWorkspace`, `SessionsFilters` types |
| `plans/chat-mobile-plan/09-uc-nav.md` | 105-145 | UC-NAV-08 §C wireframe — workspace + status rows + Apply/Clear footer |
| `plans/chat-mobile-plan/09-uc-nav.md` | 358-373 | UC-NAV-08 ACs including testID registry |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 18, 33-44 | SessionFilterSheet co-location + testID registry |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/index.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` (MODIFY ONLY — swap inline SessionFilterSheet for `<SessionFilterSheetConnected>`)
- `apps/mobile/screens/sessions-list/components/SessionFilterSheet/SessionFilterSheet.tsx` (MODIFY ONLY IF — to forward testID props for workspace rows, status rows, Apply/Clear buttons. Small additions, safe.)
- `apps/mobile/components/FilterCheckboxRow/FilterCheckboxRow.tsx` (MODIFY ONLY IF — to add a `testID` prop forwarded to the root Pressable. Small addition.)
- `apps/mobile/.maestro/session-filter.yaml` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/BottomSheet/**` — atom is fixed
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/**` — owned by MOB-INFRA-007-V2
- `apps/mobile/screens/sessions-list/types.ts` — type contract is stable
- `apps/mobile/global.css` — established ember tokens

---

## CODE PATTERN

**Reference:** ForwardRef connected wrapper with hook-derived data + activeFilters pass-through.

**Source:** `apps/mobile/screens/sessions-list/components/SessionFilterSheet/SessionFilterSheet.tsx:39-135` (organism's forwardRef pattern).

**Example:**
```tsx
// apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.tsx
import { forwardRef, useMemo } from "react";
import type { BottomSheetRef } from "@/components/BottomSheet";
import { SessionFilterSheet } from "@/screens/sessions-list/components/SessionFilterSheet";
import type { FilterValueWorkspace, SessionsFilters } from "@/screens/sessions-list/types";
import { useSessionsForProject } from "@/screens/(authenticated)/(chat)/hooks/useSessionsForProject";

export type SessionFilterSheetConnectedProps = {
  activeFilters: SessionsFilters;
  onApply: (next: SessionsFilters) => void;
};

export const SessionFilterSheetConnected = forwardRef<
  BottomSheetRef,
  SessionFilterSheetConnectedProps
>(function SessionFilterSheetConnected({ activeFilters, onApply }, ref) {
  // Re-derive workspaces from the cache-first selector (workspaceJoinIndex)
  const { workspaceJoinIndex } = useSessionsForProject();

  const workspaces = useMemo<FilterValueWorkspace[]>(() => {
    return Array.from(workspaceJoinIndex.values())
      .map((w) => ({
        id: w.id,
        branch: w.branch,
        hostName: w.hostName,
        hostKind: w.hostKind,
      }))
      .sort((a, b) => {
        const branchCmp = a.branch.localeCompare(b.branch);
        if (branchCmp !== 0) return branchCmp;
        return a.hostName.localeCompare(b.hostName);
      });
  }, [workspaceJoinIndex]);

  return (
    <SessionFilterSheet
      ref={ref}
      workspaces={workspaces}
      initialFilters={activeFilters}
      onApply={onApply}
      onClose={() => {
        if (ref && typeof ref !== "function" && ref.current) {
          ref.current.dismiss();
        }
      }}
    />
  );
});
```

```yaml
# apps/mobile/.maestro/session-filter.yaml
appId: sh.superset.mobile
---
- runFlow: subflows/login.yaml
- tapOn:
    text: "Chat"
- assertVisible:
    id: "sessions-list-screen"
- tapOn:
    id: "filter-button"
- assertVisible:
    text: "Filter sessions"
- tapOn:
    id: "filter-sheet-workspace-row-{some-workspace-id}"
- tapOn:
    id: "filter-sheet-status-row-streaming"
- tapOn:
    id: "filter-sheet-apply"
- assertNotVisible:
    text: "Filter sessions"
- assertVisible:
    id: "filter-badge"
```

**Anti-pattern:** Shaping the workspace array inside the JSX without `useMemo`. Each render produces a new array reference, defeating React's prop-change shallow-equality optimization for `SessionFilterSheet`.

Another anti-pattern: Persisting the sheet's open-state in a local `useState` and toggling it imperatively. The sheet's `present()`/`dismiss()` API (forwarded via ref) is the canonical interface — don't shadow it with local state.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-08 §C wireframe (lines 105-145)
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-08 ACs (lines 358-373)
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` line 18 + 33-44

**Interaction notes:**
- 44pt minimum hit target — FilterCheckboxRow already satisfies this.
- Light + dark theme — sheet handles styling via BottomSheet wrapper.
- Project-first scoping — workspaces shown are EXACTLY the workspaces in the selected project (sourced via useSessionsForProject which scopes by selectedProjectId).
- Cache-first per AGENTS.md TanStack DB rule — workspaceJoinIndex is cache-first per MOB-INFRA-007-V2; the sheet inherits this property.
- Workspace rows render `{branch} · {hostIcon} {hostName}` to disambiguate cross-host duplicates per UC-NAV-08 spec line 143-144.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-5):
1. **RED**: Write failing test with mocked `useSessionsForProject`.
2. **GREEN**: Modify wrapper.
3. **REFACTOR**: Clean up.
4. Move to next AC.

After AC-5: write `.maestro/session-filter.yaml` and run on both platforms (AC-6).

Patch `FilterCheckboxRow` and `SessionFilterSheet` to forward testID props if not already present (small additions; AC-3 depends on this).

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-NAV-013-V2)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Connected Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx` | Exit 0 |
| FilterCheckboxRow Tests | `bun test apps/mobile/components/FilterCheckboxRow/` | Exit 0 |
| SessionFilterSheet Tests | `bun test apps/mobile/screens/sessions-list/components/SessionFilterSheet/` | Exit 0 (if it exists; else no-op) |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Maestro iOS | `cd apps/mobile && maestro test .maestro/session-filter.yaml` | Exit 0 |
| Maestro Android | `cd apps/mobile && maestro test .maestro/session-filter.yaml --device <android>` | Exit 0 |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile UI connected wrapper + Maestro flow. Owned by react-native-ui-implementer.

---

## CODING STANDARDS

- `AGENTS.md` rule 9 (TanStack DB cache-first)
- `apps/mobile/AGENTS.md` (screen co-location)
- `plans/chat-mobile-plan/13-testing-strategy.md` (Maestro YAML conventions)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (SessionFilterSheet organism is the base)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (N/A here)

---

## DEPENDENCIES

- **Depends on:** MOB-NAV-005-INT (screen mounts the wrapper), MOB-INFRA-007-V2 (useSessionsForProject + workspaceJoinIndex)
- **Blocks:** None within Sprint 02

---

## NOTES

- This task assumes MOB-NAV-005-INT initially wires SessionFilterSheet inline — after this task lands, MOB-NAV-005-INT swaps to `<SessionFilterSheetConnected ref={filterSheetRef} activeFilters={activeFilters} onApply={setActiveFilters} />`.
- Workspace ordering (branch ASC, then hostName ASC) keeps the cross-host duplicates adjacent in the list, matching the UC-NAV-08 §C wireframe.
- The MOB-NAV-014-V2 task (applied tags wiring) consumes `activeFilters` independently from this sheet — the two are coordinated only via the parent screen's state, not directly.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN workspaceJoinIndex with 3 workspaces (w1:main/macbook, w2:feature-x/cloud-1, w3:main/desktop) WHEN connected wrapper mounted and presented THEN underlying SessionFilterSheet workspaces prop receives sorted array order [feature-x/cloud-1, main/desktop, main/macbook]",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN sheet presented with empty activeFilters WHEN user toggles workspace w1 + status live then taps Apply THEN onApply invoked exactly once with {workspaceIds:[w1], statuses:[live]}",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN sheet presented with 2 workspaces WHEN tree queried THEN contains testID='filter-sheet-workspace-row-w1', filter-sheet-workspace-row-w2, filter-sheet-status-row-streaming, filter-sheet-status-row-pause-pending, filter-sheet-status-row-idle, filter-sheet-apply, filter-sheet-clear",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN wrapper mounted with activeFilters {workspaceIds:[w2], statuses:[pause-pending]} WHEN sheet presented THEN workspace row w2 and status row pause-pending render with checked=true",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN sheet presented with empty activeFilters and user toggled rows WHEN user swipes down or taps backdrop THEN onApply is NOT invoked and parent activeFilters remains empty",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN Maestro installed and test account with multiple workspaces + at least one live session WHEN .maestro/session-filter.yaml runs THEN exits 0 on iOS and Android",
      "verify": "cd apps/mobile && maestro test .maestro/session-filter.yaml"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Connected wrapper passes workspaces sorted by branch ASC then hostName ASC",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Connected wrapper shapes workspaceJoinIndex Map values into FilterValueWorkspace[]",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Tapping Apply invokes onApply with the toggled filters exactly once",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Each workspace row carries testID='filter-sheet-workspace-row-{workspaceId}'",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Each status row carries testID='filter-sheet-status-row-{statusValue}'",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Apply button carries testID='filter-sheet-apply'",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Clear all button carries testID='filter-sheet-clear'",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Workspace row for w2 renders checked=true when activeFilters.workspaceIds includes w2",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Status row for pause-pending renders checked=true when activeFilters.statuses includes pause-pending",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Backdrop dismiss does NOT invoke onApply",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionFilterSheetConnected/SessionFilterSheetConnected.test.tsx"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "Maestro session-filter.yaml exits 0 on iOS Simulator",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && maestro test .maestro/session-filter.yaml"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "Maestro session-filter.yaml exits 0 on Android Emulator",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && maestro test .maestro/session-filter.yaml --device <android>"
    }
  ]
}
-->
