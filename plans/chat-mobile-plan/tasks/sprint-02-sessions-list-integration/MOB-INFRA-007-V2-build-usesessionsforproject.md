# MOB-INFRA-007-V2: Build useSessionsForProject derived selector (cache-first)

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 120 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

UC-NAV-01 + UC-NAV-07 + UC-NAV-08 require a single derived selector that joins `chat_sessions` × `v2_workspaces`, filters by `selectedProjectId`, sorts by `lastActiveAt` descending, and applies optional `searchQuery` (case-insensitive title substring) + `activeFilters` (workspace OR-set + status OR-set, cross-axis AND). The result must be a stable, memoized array of `ChatSession` rows ready to feed `<SessionsList sessions={...} />`.

Per `apps/mobile/AGENTS.md` rule 9 (TanStack DB cache-first), the hook MUST render persisted rows from `data` even while `isReady` is false — only use `isReady` to gate empty-state branching. This is the foundational contract for MOB-NAV-005-INT (SessionsListScreen).

Current state: zero hook exists. Desired state: `useSessionsForProject({ searchQuery, activeFilters })` returns `{ sessions: ChatSession[], isReady: boolean, workspaceJoinIndex: Map<string, V2Workspace> }` — the join index is also returned because MOB-NAV-013-V2 (filter sheet wiring) needs the workspace list for the multi-select rows.

---

## CRITICAL CONSTRAINTS

- MUST place the hook at `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.ts` with co-located `index.ts` + `.test.ts` per AGENTS.md.
- MUST use `useLiveQuery` from `@tanstack/react-db` to subscribe to `chatSessions` and `v2Workspaces` collections.
- MUST read `selectedProjectId` from `useSelectedProject()` (MOB-INFRA-006-V2). If `selectedProjectId === null` → return `{ sessions: [], isReady: <readiness of both collections>, workspaceJoinIndex: new Map() }`.
- MUST filter sessions to those whose `v2WorkspaceId` resolves to a workspace with `projectId === selectedProjectId` (client-side join).
- MUST sort by `lastActiveAt DESC` — null/undefined treated as MIN.
- MUST apply `searchQuery` as a case-insensitive substring match against `session.title` (when query is non-empty).
- MUST apply `activeFilters.workspaceIds` as OR-set match against `session.v2WorkspaceId` (when non-empty).
- MUST apply `activeFilters.statuses` as OR-set match against a derived session status (mapping `chat_sessions` row → `SessionStatus` from `@/components/SessionRow`).
- MUST cross-compose: search AND workspaceIds AND statuses.
- MUST be cache-first: `sessions` returns persisted rows even when `isReady` is false; consumers use `isReady` only to decide between empty-list-loading vs empty-no-data UI.
- MUST memoize derived results — re-renders with same `selectedProjectId` + `searchQuery` + `activeFilters` + same underlying collection snapshot MUST return reference-equal `sessions` array.
- MUST handle Electric tombstone safely — when a workspace referenced by a session no longer exists in `v2Workspaces`, drop that session from the list silently (no error).
- NEVER make backend calls — entirely client-side over already-synced collections (per `02-api-design.md:53-56`).
- NEVER apply debouncing inside this hook — caller debounces `searchQuery` (per UC-NAV-07 spec line 348).
- NEVER mutate the input arrays — always return new arrays from filters/sorts.
- STRICTLY adhere to the cache-first rule: do NOT short-circuit returning `{ sessions: [] }` while `isReady === false` — the rule explicitly says render persisted rows first.

---

## SPECIFICATION

**Objective:** Provide `useSessionsForProject(args: { searchQuery?: string; activeFilters?: SessionsFilters })` that returns a project-scoped, search-filtered, multi-axis-filtered, recency-sorted `ChatSession[]` along with `isReady` and a `workspaceJoinIndex` Map for downstream UIs.

**Success state:** `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.ts` exists; mounted in a test fixture, it returns the correct project-scoped list with all four filter axes correctly composed; reference identity is stable across re-renders with identical inputs.

---

## ACCEPTANCE CRITERIA

### AC-1: Hook returns project-scoped, recency-sorted sessions for selected project

**GIVEN** `selectedProjectId="proj-a"`, `chatSessions` has 5 rows split across workspaces in proj-a and proj-b, and `searchQuery=""`, `activeFilters={ workspaceIds: [], statuses: [] }`
**WHEN** the hook is called
**THEN** the returned `sessions` array contains ONLY the 3 sessions whose workspace's `projectId === "proj-a"`, sorted by `lastActiveAt` DESC.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts`

### AC-2: Hook applies case-insensitive substring search on title

**GIVEN** `selectedProjectId="proj-a"`, sessions include titles `"Fix auth bug"`, `"Refactor billing"`, `"AUTH refactor"`, `searchQuery="auth"`
**WHEN** the hook is called
**THEN** the returned `sessions` includes `"Fix auth bug"` and `"AUTH refactor"` (case-insensitive match) but NOT `"Refactor billing"`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts`

### AC-3: Hook applies workspace + status filters as cross-axis AND, within-axis OR

**GIVEN** `selectedProjectId="proj-a"`, sessions span workspaces w1/w2/w3 with statuses live/idle/warning, `activeFilters={ workspaceIds: ["w1", "w2"], statuses: ["live"] }`
**WHEN** the hook is called
**THEN** the returned `sessions` contains ONLY sessions whose workspace is `w1` OR `w2` AND whose derived status is `"live"` (the cross-axis AND of two within-axis ORs).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts`

### AC-4: Hook silently drops sessions whose workspace is tombstoned

**GIVEN** `selectedProjectId="proj-a"`, `chatSessions` has a session referencing workspace `w-deleted` that no longer exists in `v2Workspaces`
**WHEN** the hook is called
**THEN** the returned `sessions` does NOT include the orphaned session AND no error is thrown.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts`

### AC-5: Hook is cache-first — returns persisted rows while isReady is false

**GIVEN** the `chatSessions` collection has persisted rows but its `isReady` is still `false` (e.g., on cold launch before sync completes)
**WHEN** the hook is called
**THEN** the returned `sessions` is the FULL project-scoped + filtered list of persisted rows (NOT `[]`), AND `isReady: false` is also returned so consumers can show a syncing indicator if they choose.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts`

### AC-6: Hook returns reference-equal sessions across re-renders with identical inputs

**GIVEN** the hook is called twice in succession (e.g., parent re-render) with identical `selectedProjectId`, `searchQuery`, `activeFilters`, and identical underlying collection snapshots
**WHEN** both invocations complete
**THEN** the returned `sessions` array is reference-equal (`===`) between calls so downstream `FlatList`/`FlashList` virtualization avoids unnecessary remounts.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts`

### AC-7: Hook returns workspaceJoinIndex Map for downstream UIs

**GIVEN** the hook executes with `selectedProjectId="proj-a"` and `v2Workspaces` contains 4 rows in proj-a
**WHEN** the hook returns
**THEN** `workspaceJoinIndex` is a Map keyed by `workspaceId` containing all 4 workspaces in proj-a (independent of any active filters — represents the universe of workspaces in the project, used by MOB-NAV-013-V2 to populate the filter sheet).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts`

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | Hook returns only sessions whose workspace.projectId === selectedProjectId | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-2 | Hook sorts returned sessions by lastActiveAt DESC | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-3 | Hook returns empty sessions when selectedProjectId is null | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-4 | Hook matches title case-insensitively when searchQuery is non-empty | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-5 | Hook applies workspaceIds OR + statuses OR + cross-axis AND | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-6 | Hook drops sessions whose v2WorkspaceId is not in v2Workspaces collection | AC-4 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-7 | Hook returns persisted rows when chatSessions isReady=false | AC-5 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-8 | Hook returns reference-equal sessions array across identical re-renders | AC-6 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-9 | Hook returns workspaceJoinIndex Map keyed by workspaceId with all project workspaces | AC-7 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |
| TC-10 | Hook handles empty searchQuery + empty activeFilters as no-op (returns full project list) | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `plans/chat-mobile-plan/11-technical-requirements/02-api-design.md` | 52-58 | Client-side scoping spec — flat sort, project filter, search AND filter, status derivation |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 23 | Hook location + cache-first spec |
| `plans/chat-mobile-plan/09-uc-nav.md` | 351-373 | UC-NAV-08 spec — cross-axis composition, status derivation |
| `apps/mobile/screens/sessions-list/types.ts` | 30-75 | `ChatSession`, `SessionsFilters`, `FilterValueWorkspace`, `SessionStatus` type contracts |
| `apps/mobile/components/SessionRow/SessionRow.tsx` | 17-39 | `SessionStatus` union + status → dot variant mapping (mirrors derivation rules) |
| `apps/mobile/AGENTS.md` | 1-100 (TanStack DB rule line 9) | The cache-first invariant this hook MUST honor |
| `apps/mobile/lib/collections/collections.ts` | 1-162 | `useLiveQuery` reads chatSessions + v2Workspaces by id |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/index.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/deriveSessionStatus.ts` (NEW — pure helper for mapping `chat_sessions` row → `SessionStatus`; co-located + co-tested)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/deriveSessionStatus.test.ts` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/ui/**` — vendor primitives, N/A here
- `apps/mobile/lib/collections/collections.ts` — owned by MOB-INFRA-005-V2
- `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/**` — owned by MOB-INFRA-006-V2
- `apps/mobile/components/SessionRow/**` — atom is fixed; hook conforms to its types, never the other way around
- `apps/mobile/screens/sessions-list/types.ts` — type contracts are stable
- `apps/mobile/global.css` — established ember tokens

---

## CODE PATTERN

**Reference:** Memoized derived selector over two TanStack DB live queries with client-side join + multi-axis filter.

**Source:** `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx:78-91` (consumer-side type contract for `ChatSession` array); `apps/mobile/screens/sessions-list/views/SessionsListLoaded/SessionsListLoaded.tsx:14-45` (consumer wiring shape).

**Example (hook sketch):**
```ts
// apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.ts
import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import type { ChatSession, SessionsFilters } from "@/screens/sessions-list/types";
import { useCollections } from "@/screens/(authenticated)/providers/CollectionsProvider";
import { useSelectedProject } from "@/screens/(authenticated)/(chat)/hooks/useSelectedProject";
import { deriveSessionStatus } from "./deriveSessionStatus";

export type UseSessionsForProjectArgs = {
  searchQuery?: string;
  activeFilters?: SessionsFilters;
};

export type UseSessionsForProjectResult = {
  sessions: ChatSession[];
  isReady: boolean;
  workspaceJoinIndex: Map<string, { id: string; branch: string; hostName: string; hostKind: "laptop" | "cloud"; projectId: string }>;
};

export function useSessionsForProject({
  searchQuery = "",
  activeFilters = { workspaceIds: [], statuses: [] },
}: UseSessionsForProjectArgs = {}): UseSessionsForProjectResult {
  const { selectedProjectId } = useSelectedProject();
  const collections = useCollections();
  const { data: rawSessions, isReady: sessionsReady } = useLiveQuery(
    (q) => q.from({ sessions: collections.chatSessions }),
  );
  const { data: workspaces, isReady: workspacesReady } = useLiveQuery(
    (q) => q.from({ workspaces: collections.v2Workspaces }),
  );

  const isReady = sessionsReady && workspacesReady;

  return useMemo(() => {
    if (!selectedProjectId) {
      return { sessions: [], isReady, workspaceJoinIndex: new Map() };
    }

    // Build workspace index for project
    const wsForProject = workspaces.filter((w) => w.projectId === selectedProjectId);
    const wsIndex = new Map(wsForProject.map((w) => [w.id, w] as const));

    const q = searchQuery.trim().toLowerCase();

    const filtered: ChatSession[] = rawSessions
      .filter((s) => s.v2WorkspaceId && wsIndex.has(s.v2WorkspaceId))
      .filter((s) => (q ? s.title.toLowerCase().includes(q) : true))
      .filter((s) => {
        if (activeFilters.workspaceIds.length === 0) return true;
        return s.v2WorkspaceId && activeFilters.workspaceIds.includes(s.v2WorkspaceId);
      })
      .map((s) => {
        const ws = wsIndex.get(s.v2WorkspaceId!)!;
        return toChatSessionViewModel(s, ws);
      })
      .filter((view) => {
        if (activeFilters.statuses.length === 0) return true;
        const derived = deriveSessionStatus(view); // map view → SessionStatus
        return activeFilters.statuses.includes(derived as never);
      })
      .sort((a, b) => /* lastActiveAt DESC */ 0);

    return {
      sessions: filtered,
      isReady,
      workspaceJoinIndex: wsIndex as never,
    };
  }, [selectedProjectId, rawSessions, workspaces, searchQuery, activeFilters, isReady]);
}
```

**Anti-pattern:** Returning early with `{ sessions: [] }` when `!isReady`. This violates the AGENTS.md cache-first rule and causes a list-empty flash on warm-launch when persisted rows are present. The hook MUST return the persisted-row computation regardless of `isReady`.

Another anti-pattern: re-computing the workspace join index on every render. The `useMemo` dependency array must include `workspaces` and `selectedProjectId` so the index is reference-stable across unrelated re-renders.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/11-technical-requirements/02-api-design.md` §Client-side scoping for NAV
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` line 23 (useSessionsForProject — cache-first)
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-07 + UC-NAV-08 (filter composition)
- `apps/mobile/AGENTS.md` rule 9 (TanStack DB cache-first)

**Interaction notes:**
- 44pt hit target — N/A (no UI).
- Light + dark theme — N/A (no UI).
- Project-first scoping — this hook IS the project-scoped query gateway for the NAV surface. All NAV consumers go through this hook.
- Cache-first per AGENTS.md TanStack DB rule — STRICTLY enforced: `sessions` returns persisted rows even when `isReady` is false; downstream consumers branch on `isReady` only for empty-state UI decisions.
- Status derivation — maps `chat_sessions` row fields (e.g., `pendingApprovals`, `streaming`, `dispatchOutcome`) to the `SessionStatus` union (`"live" | "warning" | "danger" | "idle" | "archived"`) — codify in the `deriveSessionStatus` helper for testability. Reference UC-NAV-08's status definitions (`Streaming` / `Pause pending` / `Idle`) and map them to the existing `SessionRow` status variants.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-7):
1. **RED**: Write failing test in `useSessionsForProject.test.ts` using `renderHook` from `@testing-library/react-native` with mocked `useCollections`, `useSelectedProject`, and `useLiveQuery`.
2. **GREEN**: Write minimum code in `useSessionsForProject.ts`.
3. **REFACTOR**: Improve memoization while keeping tests green.
4. Move to next AC.

Build `deriveSessionStatus.ts` as a pure helper first (test-driven), then thread it into the hook. The helper takes a session row + workspace row and returns the `SessionStatus` discriminator the filter relies on.

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-INFRA-007-V2)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| All Tests Pass | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts` | Exit 0 |
| Helper Tests Pass | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/deriveSessionStatus.test.ts` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Manual smoke against real Electric | `cd apps/mobile && bun dev` then render a temp `<DebugSessionsForProject />` consumer; sign in; observe project switch re-scopes the list; observe search filters in place | Manual ✓ |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile-app hook over TanStack DB live queries — pure React Native concern. Owned by the react-native-ui-implementer per AGENTS.md and the screen co-location rule.

---

## CODING STANDARDS

- `AGENTS.md` rule 9 (TanStack DB cache-first — this hook's foundational contract)
- `apps/mobile/AGENTS.md` (hook co-location under `screens/(authenticated)/(chat)/hooks/`)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (TanStack DB is the base; configure live queries, don't reimplement subscription logic)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (N/A; reinforces hands-off `global.css`)

---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-005-V2 (chatSessions + v2Workspaces collections), MOB-INFRA-006-V2 (useSelectedProject)
- **Blocks:** MOB-NAV-005-INT, MOB-NAV-010-V2, MOB-NAV-013-V2 (downstream consumers all rely on this hook)

---

## NOTES

- The status derivation helper (`deriveSessionStatus`) is the only place where `chat_sessions` row fields map to the `SessionStatus` UI union. Keep it pure and test it with synthetic inputs spanning every status branch.
- The `lastActiveAt` field on `chat_sessions` may be a `Date | string` depending on serialization — normalize via `new Date(...).getTime()` in the sort comparator.
- The workspaceJoinIndex is returned even when `searchQuery` / `activeFilters` are active — it represents the UNIVERSE of workspaces in the project (not the filtered set). This matters for MOB-NAV-013-V2 which needs to render ALL workspace rows in the filter sheet (so users can ADD filters, not just remove them).

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN selectedProjectId=proj-a, 5 sessions across proj-a and proj-b workspaces, no search/filters WHEN hook called THEN sessions array contains only the 3 sessions in proj-a sorted by lastActiveAt DESC",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN selectedProjectId=proj-a, titles 'Fix auth bug'/'Refactor billing'/'AUTH refactor', searchQuery='auth' WHEN hook called THEN returned sessions includes 'Fix auth bug' and 'AUTH refactor' but not 'Refactor billing'",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN sessions span w1/w2/w3 with statuses live/idle/warning, activeFilters={workspaceIds:[w1,w2], statuses:[live]} WHEN hook called THEN returned sessions are (w1 OR w2) AND live",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN session references workspace w-deleted not present in v2Workspaces WHEN hook called THEN orphaned session is dropped silently with no error",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN chatSessions has persisted rows but isReady=false WHEN hook called THEN returned sessions is full project-scoped+filtered list (not []), isReady=false also returned",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN hook called twice with identical inputs and underlying snapshots WHEN both complete THEN returned sessions arrays are reference-equal",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN selectedProjectId=proj-a and v2Workspaces has 4 rows in proj-a WHEN hook returns THEN workspaceJoinIndex is Map keyed by workspaceId with all 4 workspaces (independent of filters)",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Hook returns only sessions whose workspace.projectId === selectedProjectId",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Hook sorts returned sessions by lastActiveAt DESC",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Hook returns empty sessions when selectedProjectId is null",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Hook matches title case-insensitively when searchQuery is non-empty",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Hook applies workspaceIds OR + statuses OR + cross-axis AND",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Hook drops sessions whose v2WorkspaceId is not in v2Workspaces collection",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Hook returns persisted rows when chatSessions isReady=false",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Hook returns reference-equal sessions array across identical re-renders",
      "maps_to_ac": "AC-6",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Hook returns workspaceJoinIndex Map keyed by workspaceId with all project workspaces",
      "maps_to_ac": "AC-7",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Hook handles empty searchQuery + empty activeFilters as no-op (returns full project list)",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSessionsForProject/useSessionsForProject.test.ts"
    }
  ]
}
-->
