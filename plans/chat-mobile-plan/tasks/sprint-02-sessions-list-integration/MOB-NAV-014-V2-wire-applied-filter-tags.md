# MOB-NAV-014-V2: Wire AppliedFilterTags below search bar

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 90 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

The Sprint 01 `AppliedFilterTag` molecule (`apps/mobile/components/AppliedFilterTag/AppliedFilterTag.tsx:37-87`) renders a single dismissible chip for a workspace or status filter. The `SessionsList` organism already provides a `belowSearch` slot in the header that renders the chip row (`apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx:98-127`).

MOB-NAV-005-INT mounts SessionsList but passes `appliedFilters={undefined}` as a placeholder. This task WIRES the applied filter tags:

1. Derive a `SessionsListAppliedFilter[]` from the screen's `activeFilters` + `workspaceJoinIndex` (workspace tags need to know the branch+host label).
2. **Silently drop stale workspace tags** when the referenced workspace is no longer in `workspaceJoinIndex` (Electric tombstone) — never crash, never show a placeholder, never show an error toast.
3. Wire `onFilterDismiss(id)` to remove the corresponding entry from `activeFilters.workspaceIds` or `activeFilters.statuses` (depending on the chip kind).
4. Wire `onClearFilters` to reset `activeFilters` to `{ workspaceIds: [], statuses: [] }`.
5. Add a helper `appliedFiltersFromState({ activeFilters, workspaceJoinIndex })` so the derivation is testable in isolation.

Per UC-NAV-08 spec line 371 — "System silently drops a stale workspace chip on next render when the referenced workspace is no longer in the synced `v2_workspaces` collection (Electric tombstone), without crashing or showing a placeholder."

Current state: SessionsList renders no applied tags (placeholder). Desired state: chip row reflects `activeFilters` with per-chip dismiss, Clear all, and silent tombstone handling; Maestro flow verifies the round-trip including the stale-chip case.

---

## CRITICAL CONSTRAINTS

- MUST place the derivation helper at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.ts` with co-located `index.ts` + `.test.ts`.
- MUST take inputs `{ activeFilters: SessionsFilters, workspaceJoinIndex: Map<string, V2Workspace> }` and return `SessionsListAppliedFilter[]` (type from `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx:24-28`).
- MUST produce workspace tags with id format `workspace:${workspaceId}` and status tags with id format `status:${statusValue}` so `onFilterDismiss(id)` can deterministically parse the kind.
- MUST shape workspace tag labels as `{branch} · {hostName}` per UC-NAV-08 spec line 113 wireframe.
- MUST shape status tag labels with the status name (`Streaming` / `Pause pending` / `Idle`).
- MUST silently drop workspace tags whose `workspaceId` is NOT in `workspaceJoinIndex` (stale-chip rule). Do NOT throw, do NOT add a placeholder chip.
- MUST place the dismiss handler at the screen layer (MOB-NAV-005-INT consumes the helper and wires `onFilterDismiss(id)` to update `activeFilters`) — but this task ALSO creates a small `parseAppliedFilterId(id)` helper for the dismiss path: `{ kind: "workspace" | "status", value: string }`.
- MUST modify `MOB-NAV-005-INT`'s `SessionsListScreen.tsx` to use the helper for `appliedFilters` and to wire the dismiss/clearAll handlers correctly.
- MUST add testID `applied-filter-clear-all` on the Clear ✕ chip per `11-technical-requirements/05-ui-infrastructure.md:35`. May require small forward through `AppliedFilterTag` if not present.
- MUST add testIDs `applied-filter-tag-workspace-{workspaceId}` and `applied-filter-tag-status-{status}` per the spec line 33-34.
- MUST NOT compose the chip row inside this helper — that's `SessionsList`'s job. This task only produces the data shape + wires the handlers.
- NEVER throw on a stale workspace id — silent drop, no log.
- NEVER persist applied filter state — it's transient (cleared on screen exit per UC-NAV-08 spec line 364).
- STRICTLY adhere to the 44pt minimum hit target — AppliedFilterTag already encapsulates this (uses IconButton size="xs" with hitSlop=8 per the atom's iconButtonGeometry cva).

---

## SPECIFICATION

**Objective:** Provide an `appliedFiltersFromState` helper + `parseAppliedFilterId` parser that derive the applied-filter chip row from `activeFilters` + `workspaceJoinIndex`, silently dropping stale workspace tags. MOB-NAV-005-INT consumes the helper to populate the `appliedFilters` prop of `SessionsList` and wires dismiss/clear handlers via the parser.

**Success state:** Helper exists and produces correct chip arrays for all activeFilter combinations (including tombstoned workspaces dropping silently); parser correctly identifies kind+value from id; SessionsListScreen wires both; chips render below the search bar; per-chip ✕ removes that filter only; Clear ✕ resets all filters; Maestro flow verifies the round-trip on both platforms.

---

## ACCEPTANCE CRITERIA

### AC-1: appliedFiltersFromState produces correct chip array for workspace + status filters

**GIVEN** `activeFilters = { workspaceIds: ["w1", "w2"], statuses: ["live", "pause-pending"] }` and `workspaceJoinIndex` contains both w1 (branch=`main`, hostName=`macbook`) and w2 (branch=`feature-x`, hostName=`cloud-1`)
**WHEN** the helper is called
**THEN** the returned array contains 4 entries in this order: `[{ id: "workspace:w1", kind: "workspace", label: "main · macbook" }, { id: "workspace:w2", kind: "workspace", label: "feature-x · cloud-1" }, { id: "status:live", kind: "status", label: "Streaming" }, { id: "status:pause-pending", kind: "status", label: "Pause pending" }]`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts`

### AC-2: appliedFiltersFromState silently drops stale workspace tag

**GIVEN** `activeFilters = { workspaceIds: ["w1", "w-deleted"], statuses: [] }` and `workspaceJoinIndex` contains ONLY w1
**WHEN** the helper is called
**THEN** the returned array contains 1 entry `[{ id: "workspace:w1", kind: "workspace", label: "..." }]` (the w-deleted tag is dropped) AND no error is thrown.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts`

### AC-3: parseAppliedFilterId correctly identifies kind and value

**GIVEN** three id inputs: `"workspace:w1"`, `"status:live"`, `"workspace:complex-uuid-with-dashes-1234"`
**WHEN** `parseAppliedFilterId(id)` is called on each
**THEN** the results are `{ kind: "workspace", value: "w1" }`, `{ kind: "status", value: "live" }`, `{ kind: "workspace", value: "complex-uuid-with-dashes-1234" }`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts`

### AC-4: SessionsListScreen onFilterDismiss removes correct entry from activeFilters

**GIVEN** screen mounted with `activeFilters = { workspaceIds: ["w1", "w2"], statuses: ["live"] }`
**WHEN** the user taps the ✕ on the `applied-filter-tag-workspace-w1` chip
**THEN** `activeFilters` updates to `{ workspaceIds: ["w2"], statuses: ["live"] }` (only w1 removed); the status tag for `live` remains.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` (test added in MOB-NAV-005-INT scope; this task's wiring extends those tests)

### AC-5: SessionsListScreen onClearFilters resets activeFilters to empty

**GIVEN** screen mounted with non-trivial `activeFilters`
**WHEN** the user taps the trailing Clear ✕ chip
**THEN** `activeFilters` updates to `{ workspaceIds: [], statuses: [] }`; the applied-filters row disappears.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx`

### AC-6: Stale workspace tag drops silently after Electric tombstone

**GIVEN** the screen renders chips for w1 + w2; on the next render, w2 is removed from `workspaceJoinIndex` (simulating an Electric tombstone)
**WHEN** the next render completes
**THEN** the applied-filters row shows ONLY the chip for w1; no error is thrown; no placeholder/error chip is shown; the status chips (if any) remain.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx`

### AC-7: Maestro asserts chip dismiss + Clear all + stale-chip drop

**GIVEN** Maestro installed and a test account with multiple workspaces; the test pre-state seeds `activeFilters` with 2 workspace chips by applying via the filter sheet
**WHEN** `.maestro/applied-filter-tags.yaml` runs: login → Chat tab → open filter sheet → toggle 2 workspaces + 1 status → Apply → assert 3 chips visible + clear ✕ chip visible → tap workspace chip ✕ → assert 2 chips remain → tap Clear ✕ → assert chips row gone
**THEN** the flow exits 0 on iOS and Android. Stale-chip handling is verified via a manual cross-device test (desktop delete a workspace) — not Maestro-able solo.

**Verify:** `cd apps/mobile && maestro test .maestro/applied-filter-tags.yaml`

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | appliedFiltersFromState produces 4 chips in correct order for 2 workspaces + 2 statuses | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-2 | appliedFiltersFromState chip ids follow format 'workspace:{id}' and 'status:{id}' | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-3 | Workspace chip label is '{branch} · {hostName}' from workspaceJoinIndex | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-4 | Status chip labels are 'Streaming', 'Pause pending', 'Idle' for the three status values | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-5 | Stale workspace tag is silently dropped from returned array | AC-2 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-6 | Stale workspace tag drop does NOT throw | AC-2 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-7 | parseAppliedFilterId('workspace:w1') returns {kind:'workspace', value:'w1'} | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-8 | parseAppliedFilterId('status:live') returns {kind:'status', value:'live'} | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-9 | parseAppliedFilterId handles dashed UUID workspace ids correctly | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` |
| TC-10 | Tapping workspace chip ✕ removes only that workspace from activeFilters.workspaceIds | AC-4 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-11 | Tapping status chip ✕ removes only that status from activeFilters.statuses | AC-4 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-12 | Tapping Clear ✕ resets activeFilters to empty | AC-5 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-13 | Stale workspace chip removed from rendered row after workspaceJoinIndex update | AC-6 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-14 | Maestro applied-filter-tags.yaml exits 0 on iOS Simulator | AC-7 | happy_path | `cd apps/mobile && maestro test .maestro/applied-filter-tags.yaml` |
| TC-15 | Maestro applied-filter-tags.yaml exits 0 on Android Emulator | AC-7 | edge | `cd apps/mobile && maestro test .maestro/applied-filter-tags.yaml --device <android>` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/components/AppliedFilterTag/AppliedFilterTag.tsx` | 1-87 | Atom — `kind`, `label`, `onDismiss`, `dismissAccessibilityLabel` props |
| `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx` | 24-127 | Organism — `appliedFilters`, `onFilterDismiss`, `onClearFilters` props; belowSearch slot rendering |
| `apps/mobile/screens/sessions-list/types.ts` | 7-11, 62-74 | `AppliedFilterTagKind`, `FilterValueWorkspace`, `SessionsFilters` types |
| `plans/chat-mobile-plan/09-uc-nav.md` | 105-118, 351-373 | UC-NAV-08 §C wireframe + ACs including silent-drop spec |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 13, 33-36 | AppliedFilterTags co-location + testID registry |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/index.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` (MODIFY — wire `appliedFilters` + `onFilterDismiss` + `onClearFilters` props on SessionsList using the helper)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` (MODIFY — add tests for dismiss/clear paths)
- `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx` (MODIFY ONLY IF — to forward `testID` per applied filter chip if not already supported. Should accept `testID: filter.id` derived to `applied-filter-tag-workspace-{workspaceId}` or `applied-filter-tag-status-{status}`. Small addition.)
- `apps/mobile/components/AppliedFilterTag/AppliedFilterTag.tsx` (MODIFY ONLY IF — to add a `testID` prop forwarded to the root View)
- `apps/mobile/.maestro/applied-filter-tags.yaml` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/IconButton/**` — atom is fixed
- `apps/mobile/screens/sessions-list/types.ts` — type contract is stable
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/**` — owned by MOB-INFRA-007-V2
- `apps/mobile/global.css` — established ember tokens

---

## CODE PATTERN

**Reference:** Pure helper + screen-level wiring with deterministic id format for the dismiss path.

**Source:** `apps/mobile/screens/sessions-list/views/SessionsListLoaded/SessionsListLoaded.tsx` (passes mocked `appliedFilters` directly).

**Example (helper):**
```ts
// apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.ts
import type { SessionsListAppliedFilter } from "@/screens/sessions-list/components/SessionsList";
import type { FilterStatusValue } from "@/components/FilterCheckboxRow";
import type { SessionsFilters } from "@/screens/sessions-list/types";

type WorkspaceLike = {
  id: string;
  branch: string;
  hostName: string;
};

const STATUS_LABEL: Record<FilterStatusValue, string> = {
  streaming: "Streaming",
  "pause-pending": "Pause pending",
  idle: "Idle",
};

export function appliedFiltersFromState(args: {
  activeFilters: SessionsFilters;
  workspaceJoinIndex: ReadonlyMap<string, WorkspaceLike>;
}): SessionsListAppliedFilter[] {
  const out: SessionsListAppliedFilter[] = [];

  for (const wsId of args.activeFilters.workspaceIds) {
    const ws = args.workspaceJoinIndex.get(wsId);
    if (!ws) continue; // silent drop — Electric tombstone
    out.push({
      id: `workspace:${wsId}`,
      kind: "workspace",
      label: `${ws.branch} · ${ws.hostName}`,
    });
  }

  for (const status of args.activeFilters.statuses) {
    out.push({
      id: `status:${status}`,
      kind: "status",
      label: STATUS_LABEL[status as FilterStatusValue] ?? status,
    });
  }

  return out;
}

export function parseAppliedFilterId(id: string):
  | { kind: "workspace"; value: string }
  | { kind: "status"; value: string }
  | null {
  if (id.startsWith("workspace:")) {
    return { kind: "workspace", value: id.slice("workspace:".length) };
  }
  if (id.startsWith("status:")) {
    return { kind: "status", value: id.slice("status:".length) };
  }
  return null;
}
```

**Example (screen wiring delta in SessionsListScreen.tsx):**
```tsx
const appliedFilters = useMemo(
  () => appliedFiltersFromState({ activeFilters, workspaceJoinIndex }),
  [activeFilters, workspaceJoinIndex],
);

const handleFilterDismiss = useCallback((id: string) => {
  const parsed = parseAppliedFilterId(id);
  if (!parsed) return;
  if (parsed.kind === "workspace") {
    setActiveFilters((curr) => ({
      ...curr,
      workspaceIds: curr.workspaceIds.filter((w) => w !== parsed.value),
    }));
  } else {
    setActiveFilters((curr) => ({
      ...curr,
      statuses: curr.statuses.filter((s) => s !== parsed.value),
    }));
  }
}, []);

const handleClearFilters = useCallback(() => {
  setActiveFilters({ workspaceIds: [], statuses: [] });
}, []);

// pass appliedFilters / handleFilterDismiss / handleClearFilters to <SessionsList />
```

```yaml
# apps/mobile/.maestro/applied-filter-tags.yaml
appId: sh.superset.mobile
---
- runFlow: subflows/login.yaml
- tapOn:
    text: "Chat"
- tapOn:
    id: "filter-button"
- tapOn:
    id: "filter-sheet-workspace-row-{w-id-a}"
- tapOn:
    id: "filter-sheet-workspace-row-{w-id-b}"
- tapOn:
    id: "filter-sheet-status-row-streaming"
- tapOn:
    id: "filter-sheet-apply"
- assertVisible:
    id: "applied-filter-tag-workspace-{w-id-a}"
- assertVisible:
    id: "applied-filter-tag-workspace-{w-id-b}"
- assertVisible:
    id: "applied-filter-tag-status-streaming"
- assertVisible:
    id: "applied-filter-clear-all"
- tapOn:
    id: "applied-filter-tag-workspace-{w-id-a}"  # tap the chip (the ✕ within it)
- assertNotVisible:
    id: "applied-filter-tag-workspace-{w-id-a}"
- assertVisible:
    id: "applied-filter-tag-workspace-{w-id-b}"
- tapOn:
    id: "applied-filter-clear-all"
- assertNotVisible:
    id: "applied-filter-tag-workspace-{w-id-b}"
```

**Anti-pattern:** Throwing or logging an error when a workspace id is missing from the index. The spec is explicit: silent drop. Logging on every render of a stale chip floods telemetry.

Another anti-pattern: storing the chip array in state and updating it imperatively when `activeFilters` changes. The chip array is a pure derivation — keep it as a `useMemo` of the source state.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-08 §C (lines 105-118) wireframe
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-08 ACs (lines 351-373) — silent-drop rule on line 371
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` line 13 + 33-36

**Interaction notes:**
- 44pt minimum hit target — AppliedFilterTag's IconButton size="xs" + hitSlop=8 satisfies for the dismiss; chip body is also tappable per the atom's contract.
- Light + dark theme — `bg-secondary` resolves in both themes.
- Project-first scoping — chips reflect the currently-selected project's workspace metadata.
- Cache-first per AGENTS.md TanStack DB rule — the helper consumes `workspaceJoinIndex` which is cache-first; stale-chip handling is the cache-first edge case for applied filters.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-6):
1. **RED**: Write failing test for helper (AC-1/2/3) or screen wiring (AC-4/5/6).
2. **GREEN**: Implement helper or wire SessionsListScreen.
3. **REFACTOR**: Clean up.
4. Move to next AC.

After AC-6: write `.maestro/applied-filter-tags.yaml` and run on both platforms (AC-7).

Patch `AppliedFilterTag` and `SessionsList` for testID forwarding if not present (small additions).

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-NAV-014-V2)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Helper Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts` | Exit 0 |
| Screen Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Maestro iOS | `cd apps/mobile && maestro test .maestro/applied-filter-tags.yaml` | Exit 0 |
| Maestro Android | `cd apps/mobile && maestro test .maestro/applied-filter-tags.yaml --device <android>` | Exit 0 |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile UI helper + screen wiring + Maestro flow. Owned by react-native-ui-implementer.

---

## CODING STANDARDS

- `AGENTS.md` rule 9 (TanStack DB cache-first — stale-chip handling is the cache-first edge case)
- `apps/mobile/AGENTS.md` (screen co-location: utils under `SessionsListScreen/utils/`)
- `plans/chat-mobile-plan/13-testing-strategy.md` (Maestro YAML conventions)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (AppliedFilterTag atom is the base)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (N/A)

---

## DEPENDENCIES

- **Depends on:** MOB-NAV-005-INT (screen mount point), MOB-NAV-013-V2 (filter sheet supplies activeFilters via Apply), MOB-INFRA-007-V2 (workspaceJoinIndex)
- **Blocks:** None within Sprint 02

---

## NOTES

- The stale-chip Maestro test is hard to fully automate solo (requires desktop-side workspace delete). Manual coverage of step 7 in the sprint gate (delete workspace on desktop, observe chip drop on mobile) is the formal verification — `.maestro/applied-filter-tags.yaml` covers the chip dismiss + clear-all flow.
- The chip id format `workspace:{id}` / `status:{value}` is intentional — it MUST be parsable in the dismiss handler. Do not change the format without updating the parser.
- AppliedFilterTag and SessionsList may need small testID-forwarding patches. Keep them minimal — single-prop addition that defaults to undefined.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN activeFilters {workspaceIds:[w1,w2], statuses:[live,pause-pending]} and workspaceJoinIndex contains w1(main/macbook) + w2(feature-x/cloud-1) WHEN helper called THEN returns 4 entries in order: workspace:w1/main · macbook, workspace:w2/feature-x · cloud-1, status:live/Streaming, status:pause-pending/Pause pending",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN activeFilters {workspaceIds:[w1,w-deleted], statuses:[]} and workspaceJoinIndex contains only w1 WHEN helper called THEN returns 1 entry workspace:w1 and no error thrown",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN 3 id inputs WHEN parseAppliedFilterId called THEN returns workspace:w1, status:live, workspace:complex-uuid-with-dashes-1234 parsed correctly",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN screen mounted with activeFilters {workspaceIds:[w1,w2], statuses:[live]} WHEN user taps applied-filter-tag-workspace-w1 ✕ THEN activeFilters becomes {workspaceIds:[w2], statuses:[live]}",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN screen mounted with non-trivial activeFilters WHEN user taps Clear ✕ chip THEN activeFilters becomes {workspaceIds:[], statuses:[]} and chips row disappears",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN screen renders chips for w1+w2; next render removes w2 from workspaceJoinIndex WHEN next render completes THEN row shows only w1 chip, no error, no placeholder",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN Maestro installed and test account with multiple workspaces WHEN .maestro/applied-filter-tags.yaml runs THEN exits 0 on iOS and Android covering chip dismiss + Clear all",
      "verify": "cd apps/mobile && maestro test .maestro/applied-filter-tags.yaml"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "appliedFiltersFromState produces 4 chips in correct order for 2 workspaces + 2 statuses",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "appliedFiltersFromState chip ids follow format 'workspace:{id}' and 'status:{id}'",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Workspace chip label is '{branch} · {hostName}' from workspaceJoinIndex",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Status chip labels are 'Streaming', 'Pause pending', 'Idle' for the three status values",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Stale workspace tag is silently dropped from returned array",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Stale workspace tag drop does NOT throw",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "parseAppliedFilterId('workspace:w1') returns {kind:'workspace', value:'w1'}",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "parseAppliedFilterId('status:live') returns {kind:'status', value:'live'}",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "parseAppliedFilterId handles dashed UUID workspace ids correctly",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/utils/appliedFiltersFromState/appliedFiltersFromState.test.ts"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Tapping workspace chip ✕ removes only that workspace from activeFilters.workspaceIds",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "Tapping status chip ✕ removes only that status from activeFilters.statuses",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "Tapping Clear ✕ resets activeFilters to empty",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-13",
      "type": "test_criterion",
      "description": "Stale workspace chip removed from rendered row after workspaceJoinIndex update",
      "maps_to_ac": "AC-6",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-14",
      "type": "test_criterion",
      "description": "Maestro applied-filter-tags.yaml exits 0 on iOS Simulator",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && maestro test .maestro/applied-filter-tags.yaml"
    },
    {
      "id": "TC-15",
      "type": "test_criterion",
      "description": "Maestro applied-filter-tags.yaml exits 0 on Android Emulator",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && maestro test .maestro/applied-filter-tags.yaml --device <android>"
    }
  ]
}
-->
