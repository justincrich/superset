# MOB-INFRA-011: Build useAccessibleProjects hook

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 60 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** S

---

## BACKGROUND

UC-NAV-08 (project picker bottom sheet — `09-uc-nav.md` lines 84-103) and UC-NAV-01 (header project chip variant rule per AC line 266) both require a query for "projects accessible to the active user in the active organization". The simplest implementation is a thin live-query hook over the `v2_projects` Electric collection scoped to `activeOrganizationId`, returning a stable `Project[]` array along with `isReady`.

Per `11-technical-requirements/05-ui-infrastructure.md` line 22, the hook lives at `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/`. Per the AGENTS.md cache-first rule, the hook must surface persisted rows even while `isReady` is false.

This hook is small — its job is to wrap `useLiveQuery` over `v2Projects` and shape the rows into the `Project` view-model (`{ id, name, workspaceCount, sessionCount }` per `apps/mobile/screens/sessions-list/types.ts:46-51`). Workspace/session counts are derived client-side via cache-first `useLiveQuery` over `v2Workspaces` and `chatSessions` joined to the project.

Current state: no hook exists; ProjectPickerSheet's mock-data fixture is the only source. Desired state: `useAccessibleProjects()` returns the real `Project[]` array sorted alphabetically by name with counts derived client-side.

---

## CRITICAL CONSTRAINTS

- MUST place the hook at `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.ts` with co-located `index.ts` + `.test.ts`.
- MUST use `useLiveQuery` from `@tanstack/react-db` over `v2Projects`, `v2Workspaces`, AND `chatSessions` (all three needed for the counts).
- MUST return `{ projects: Project[], isReady: boolean }` where `Project = { id, name, workspaceCount, sessionCount }` from `@/screens/sessions-list/types`.
- MUST sort `projects` alphabetically by `name` (case-insensitive).
- MUST scope to the user's `activeOrganizationId` — but note the Electric collection IS already org-scoped by the proxy. No additional client-side filter required beyond accepting whatever rows the collection produces.
- MUST compute `workspaceCount = number of v2Workspaces rows where workspace.projectId === project.id`.
- MUST compute `sessionCount = number of chatSessions rows where the session's workspace belongs to the project` (join through `v2Workspaces`).
- MUST be cache-first: return `projects` array from persisted data even when `isReady` is false.
- MUST memoize the derived array so reference identity is stable across re-renders with identical inputs.
- NEVER make backend tRPC calls — pure client-side over already-synced collections.
- NEVER conflate `isReady` of the three live queries — return `isReady = projectsReady && workspacesReady && sessionsReady`. Persisted-row rendering is independent.
- STRICTLY adhere to the cache-first rule — do NOT short-circuit to `[]` when `!isReady`.

---

## SPECIFICATION

**Objective:** Provide `useAccessibleProjects()` returning the active-org's projects with client-side derived workspace + session counts, sorted alphabetically, cache-first.

**Success state:** `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.ts` exists; mounted in a test fixture with seeded projects/workspaces/sessions, it returns the correct counts and a stable reference; `bun run typecheck` exits 0; consumers (MOB-NAV-008-V2 and MOB-NAV-010-V2) can call it.

---

## ACCEPTANCE CRITERIA

### AC-1: Hook returns Project[] sorted alphabetically by name

**GIVEN** `v2Projects` contains rows `[{ id: "p1", name: "Zebra" }, { id: "p2", name: "apple" }, { id: "p3", name: "Beta" }]`
**WHEN** the hook is called
**THEN** the returned `projects` array order is `["apple", "Beta", "Zebra"]` (case-insensitive alphabetical sort).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts`

### AC-2: workspaceCount is the number of v2Workspaces for the project

**GIVEN** `v2Projects=[{id:"p1"}]` and `v2Workspaces=[{projectId:"p1"},{projectId:"p1"},{projectId:"p2"}]`
**WHEN** the hook is called
**THEN** the returned `projects[0].workspaceCount === 2` (only the two workspaces with `projectId="p1"` are counted).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts`

### AC-3: sessionCount is the number of chatSessions joined through workspaces

**GIVEN** project `p1` has 2 workspaces `w1` and `w2`; chatSessions has 5 rows: 2 in `w1`, 1 in `w2`, 2 in `w-other` (different project)
**WHEN** the hook is called
**THEN** the returned `projects[0].sessionCount === 3` (sessions in w1 + w2).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts`

### AC-4: Hook is cache-first — returns persisted projects while isReady is false

**GIVEN** `v2Projects` has persisted rows but `isReady` is `false`
**WHEN** the hook is called
**THEN** the returned `projects` is the full (sorted, count-derived) array of persisted rows AND `isReady: false` is also returned.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts`

### AC-5: Hook returns reference-equal projects across re-renders with identical inputs

**GIVEN** the hook is called twice in succession with identical underlying collection snapshots
**WHEN** both invocations complete
**THEN** the returned `projects` array is reference-equal between calls.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts`

### AC-6: Hook returns empty array gracefully when no projects exist

**GIVEN** `v2Projects` is `[]` and `isReady: true`
**WHEN** the hook is called
**THEN** the returned `{ projects: [], isReady: true }` is returned, no error thrown.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts`

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | Hook sorts projects alphabetically (case-insensitive) by name | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` |
| TC-2 | Hook computes workspaceCount as count of v2Workspaces where projectId matches | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` |
| TC-3 | Hook computes sessionCount as count of chatSessions joined through workspaces | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` |
| TC-4 | Hook returns persisted projects when projectsReady=false | AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` |
| TC-5 | Hook returns reference-equal projects array across identical re-renders | AC-5 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` |
| TC-6 | Hook returns {projects:[],isReady:true} when v2Projects is empty | AC-6 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` |
| TC-7 | Hook returns workspaceCount=0 when project has no workspaces | AC-2 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` |
| TC-8 | Hook returns sessionCount=0 when project has workspaces but no sessions | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/screens/sessions-list/types.ts` | 46-51 | `Project` type contract — `{ id, name, workspaceCount, sessionCount }` |
| `plans/chat-mobile-plan/09-uc-nav.md` | 84-103 | UC-NAV-08 §B — project picker rows with workspace + session counts |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 22 | Hook location + cache-first spec |
| `plans/chat-mobile-plan/11-technical-requirements/02-api-design.md` | 56 | Counts derived via `useLiveQuery` over v2_projects + v2_workspaces + chat_sessions; cache-first |
| `apps/mobile/AGENTS.md` | rule 9 | Cache-first invariant |
| `apps/mobile/lib/collections/collections.ts` | (refer) | `v2Projects`, `v2Workspaces`, `chatSessions` collection IDs available via `useCollections()` |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/index.ts` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/ui/**` — N/A
- `apps/mobile/lib/collections/collections.ts` — owned by MOB-INFRA-005-V2
- `apps/mobile/screens/sessions-list/types.ts` — type contract is stable
- `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/**` — owned by MOB-INFRA-006-V2
- `apps/mobile/global.css` — established ember tokens

---

## CODE PATTERN

**Reference:** Memoized derived selector over three TanStack DB live queries with client-side join.

**Source:** `apps/mobile/screens/(authenticated)/providers/CollectionsProvider/CollectionsProvider.tsx:1-40` (consumer-side `useCollections()` pattern). MOB-INFRA-007-V2's `useSessionsForProject` is a structural sibling — mirror its shape.

**Example:**
```ts
// apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.ts
import { useLiveQuery } from "@tanstack/react-db";
import { useMemo } from "react";
import type { Project } from "@/screens/sessions-list/types";
import { useCollections } from "@/screens/(authenticated)/providers/CollectionsProvider";

export type UseAccessibleProjectsResult = {
  projects: Project[];
  isReady: boolean;
};

export function useAccessibleProjects(): UseAccessibleProjectsResult {
  const collections = useCollections();
  const { data: projects, isReady: projectsReady } = useLiveQuery((q) =>
    q.from({ projects: collections.v2Projects }),
  );
  const { data: workspaces, isReady: workspacesReady } = useLiveQuery((q) =>
    q.from({ workspaces: collections.v2Workspaces }),
  );
  const { data: sessions, isReady: sessionsReady } = useLiveQuery((q) =>
    q.from({ sessions: collections.chatSessions }),
  );

  const isReady = projectsReady && workspacesReady && sessionsReady;

  return useMemo(() => {
    // Build workspace→project index
    const wsToProject = new Map<string, string>();
    for (const ws of workspaces) {
      wsToProject.set(ws.id, ws.projectId);
    }

    // Count workspaces per project
    const wsCountByProject = new Map<string, number>();
    for (const ws of workspaces) {
      wsCountByProject.set(ws.projectId, (wsCountByProject.get(ws.projectId) ?? 0) + 1);
    }

    // Count sessions per project (join via workspace)
    const sessionCountByProject = new Map<string, number>();
    for (const s of sessions) {
      if (!s.v2WorkspaceId) continue;
      const projectId = wsToProject.get(s.v2WorkspaceId);
      if (!projectId) continue;
      sessionCountByProject.set(projectId, (sessionCountByProject.get(projectId) ?? 0) + 1);
    }

    const shaped: Project[] = projects
      .map((p) => ({
        id: p.id,
        name: p.name,
        workspaceCount: wsCountByProject.get(p.id) ?? 0,
        sessionCount: sessionCountByProject.get(p.id) ?? 0,
      }))
      .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase()));

    return { projects: shaped, isReady };
  }, [projects, workspaces, sessions, isReady]);
}
```

**Anti-pattern:** Returning `{ projects: [] }` when `!isReady`. This breaks cache-first rendering and causes the project picker to flash empty on warm launch. ALWAYS compute over persisted rows regardless of `isReady`.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-08 §B (project picker — workspace + session counts shown per row)
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` line 22
- `apps/mobile/AGENTS.md` rule 9 (cache-first)

**Interaction notes:**
- 44pt hit target — N/A.
- Light + dark theme — N/A.
- Project-first scoping — the hook IS the project query. Consumers like ProjectPickerSheet present this directly to the user.
- Cache-first per AGENTS.md TanStack DB rule — STRICTLY enforced: render persisted rows even when `isReady` is false.
- Alphabetical sort matches the UC-NAV-08 §B wireframe ordering ("This organization" header above the alphabetical project list).

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-6):
1. **RED**: Write failing test in `useAccessibleProjects.test.ts` using `renderHook` + mocked `useCollections` + mocked `useLiveQuery`.
2. **GREEN**: Write minimum code.
3. **REFACTOR**: Optimize memoization.
4. Move to next AC.

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-INFRA-011)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| All Tests Pass | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Manual smoke against real Electric | `cd apps/mobile && bun dev` then render a temp `<DebugAccessibleProjects />` consumer; verify projects load with correct counts within 3s | Manual ✓ |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile-app hook over TanStack DB live queries. Owned by react-native-ui-implementer per the screen co-location rule and AGENTS.md.

---

## CODING STANDARDS

- `AGENTS.md` rule 9 (TanStack DB cache-first)
- `apps/mobile/AGENTS.md` (hook co-location)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (TanStack DB is the base)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (N/A; preserve tokens)

---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-005-V2 (v2Projects + v2Workspaces + chatSessions collections)
- **Blocks:** MOB-NAV-008-V2 (ProjectPickerSheet wiring), MOB-NAV-010-V2 (empty-no-projects branch decision)

---

## NOTES

- The hook is intentionally lightweight — it does NOT consider `selectedProjectId` (that's `useSelectedProject`'s concern). It just enumerates everything the user can access.
- For organizations with hundreds of projects, the `useMemo` ensures we re-derive only when underlying snapshots change. The O(n+w+s) counting pass is fast at typical sizes.
- The hook does NOT do any access-control checks beyond what Electric proxy already enforces server-side. If the user has access to the row, they see it.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN v2Projects contains 'Zebra','apple','Beta' WHEN hook called THEN returned order is ['apple','Beta','Zebra']",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN v2Projects=[{id:p1}] and v2Workspaces has 2 rows with projectId=p1 plus 1 row with projectId=p2 WHEN hook called THEN projects[0].workspaceCount === 2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN project p1 has 2 workspaces with 2+1 sessions and 2 sessions in other-project workspace WHEN hook called THEN projects[0].sessionCount === 3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN v2Projects has persisted rows but isReady=false WHEN hook called THEN returned projects is full sorted+count-derived array and isReady=false also returned",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN hook called twice with identical snapshots WHEN both complete THEN returned projects arrays are reference-equal",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN v2Projects=[] and isReady=true WHEN hook called THEN returns {projects:[], isReady:true} with no error",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Hook sorts projects alphabetically (case-insensitive) by name",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Hook computes workspaceCount as count of v2Workspaces where projectId matches",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Hook computes sessionCount as count of chatSessions joined through workspaces",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Hook returns persisted projects when projectsReady=false",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Hook returns reference-equal projects array across identical re-renders",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Hook returns {projects:[],isReady:true} when v2Projects is empty",
      "maps_to_ac": "AC-6",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Hook returns workspaceCount=0 when project has no workspaces",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Hook returns sessionCount=0 when project has workspaces but no sessions",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/useAccessibleProjects.test.ts"
    }
  ]
}
-->
