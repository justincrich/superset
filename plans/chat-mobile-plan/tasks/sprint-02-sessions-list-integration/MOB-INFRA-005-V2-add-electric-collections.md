# MOB-INFRA-005-V2: Add chat_sessions, v2_workspaces, v2_projects Electric collections

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 120 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

The mobile app currently syncs only 6 collections from Electric (`tasks`, `task_statuses`, `projects`, `members`, `users`, `invitations`, plus the global `organizations` — see `apps/mobile/lib/collections/collections.ts:21-46`). The Sessions List Integration requires THREE additional Electric collections per the v2.0.0 project-first model:

- `chat_sessions` (org-scoped) — drives UC-NAV-01 / UC-NAV-07 / UC-NAV-08 / UC-SESS-01 / UC-PLATF-05
- `v2_workspaces` (org-scoped) — drives UC-NAV-04 workspace picker + UC-NAV-08 workspace filter rows + UC-NAV-05 `workspace.projectId` resolution
- `v2_projects` (org-scoped) — drives UC-NAV-01 project chip + UC-NAV-08 project picker

Per `plans/chat-mobile-plan/11-technical-requirements/02-api-design.md:42-50`, all three endpoints are ALREADY exposed by `apps/electric-proxy/src/where.ts`; this task just wires the mobile-side collections following the existing `tasks` / `projects` pattern. No backend changes are required.

Current state: 6 collections in `OrgCollections`. Desired state: 9 collections (`chatSessions`, `v2Workspaces`, `v2Projects` added) — cached per organization, available via `useCollections()` to downstream `useSessionsForProject`, `useAccessibleProjects`, etc.

---

## CRITICAL CONSTRAINTS

- MUST modify `apps/mobile/lib/collections/collections.ts` ONLY — keep the same `createCollection` + `electricCollectionOptions` pattern used by existing collections (lines 53-90 for `tasks`).
- MUST add the three new collections inside `createOrgCollections(organizationId)` so they participate in the per-org cache (`collectionsCache.set(...)`).
- MUST import the corresponding row types from `@superset/db/schema` — `SelectChatSession`, `SelectV2Workspace`, `SelectV2Project` (verify these exports exist before importing).
- MUST use the existing `electricUrl` const and shared `headers = { Cookie: () => authClient.getCookie() || "" }` per the existing pattern.
- MUST pass `params: { table: "chat_sessions", organizationId }`, `params: { table: "v2_workspaces", organizationId }`, `params: { table: "v2_projects", organizationId }` matching the Electric proxy's expected param names.
- MUST extend the `OrgCollections` interface to declare the three new collections so `getCollections(orgId)` callers get type-safe access.
- MUST NOT add `onUpdate` / `onDelete` handlers on the new collections — Sprint 02 is READ-ONLY for sessions/workspaces/projects (writes happen in Sprint 03+ via cloud tRPC). These shapes are cloud-side controlled.
- NEVER add new columns or new tables — these are existing Postgres tables exposed via Electric shapes; mobile is consuming them, not defining them.
- NEVER bypass the `columnMapper` (snake-camel) — the row type contracts come from `@superset/db/schema` which uses camelCase.
- STRICTLY adhere to the per-org cache pattern — `collectionsCache.set(organizationId, ...)` MUST include the new fields in the returned object so the same instance is reused across re-renders.

---

## SPECIFICATION

**Objective:** Extend `apps/mobile/lib/collections/collections.ts` to register `chatSessions`, `v2Workspaces`, and `v2Projects` ElectricSQL collections inside the per-organization cache, returning a `Collection<SelectChatSession>`, `Collection<SelectV2Workspace>`, and `Collection<SelectV2Project>` from `getCollections(orgId)` typed via `OrgCollections`.

**Success state:** `getCollections(orgId).chatSessions`, `.v2Workspaces`, and `.v2Projects` return `Collection` instances; downstream hooks can call `useLiveQuery(... q.from({ chatSessions }) ...)` and receive rows synced from `apps/electric-proxy`. `bun run typecheck` exits 0.

---

## ACCEPTANCE CRITERIA

### AC-1: OrgCollections interface declares the three new collections

**GIVEN** the `OrgCollections` interface in `apps/mobile/lib/collections/collections.ts`
**WHEN** the file is type-checked
**THEN** the interface contains three additional members typed as `Collection<SelectChatSession>`, `Collection<SelectV2Workspace>`, `Collection<SelectV2Project>` (with appropriate camelCase keys: `chatSessions`, `v2Workspaces`, `v2Projects`).

**Verify:** `bun run typecheck`

### AC-2: createOrgCollections wires the three new shapes

**GIVEN** the implementation of `createOrgCollections(organizationId)` in `apps/mobile/lib/collections/collections.ts`
**WHEN** the function is called with a valid `organizationId`
**THEN** the returned object includes `chatSessions`, `v2Workspaces`, `v2Projects` Collections each configured with `params: { table: <table-name>, organizationId }`, the shared `headers`, the shared `columnMapper`, and `getKey: (item) => item.id`.

**Verify:** `bun test apps/mobile/lib/collections/collections.test.ts`

### AC-3: getCollections returns cached instance across calls

**GIVEN** `getCollections(orgId)` is called twice in the same session with the same `orgId`
**WHEN** both calls complete
**THEN** the returned `chatSessions` (and `v2Workspaces`, `v2Projects`) Collection instances are reference-equal (`===`) so React's reference identity is stable across re-renders.

**Verify:** `bun test apps/mobile/lib/collections/collections.test.ts`

### AC-4: Live query against chatSessions returns rows from a seeded Electric shape

**GIVEN** the mobile dev build is running against a Neon dev branch with at least one row in `chat_sessions` for the active organization
**WHEN** a test component calls `const { data } = useLiveQuery((q) => q.from({ chatSessions: collections.chatSessions }))`
**THEN** `data` is a non-empty array containing rows with shape `{ id, title, lastActiveAt, v2WorkspaceId, organizationId, ... }` (camelCase) matching the seeded data.

**Verify:** Manual smoke: `cd apps/mobile && bun dev` → sign in → render a temporary test screen that mounts the live query → confirm rows appear within 3s.

### AC-5: Electric collections do NOT register write handlers

**GIVEN** the new collections are configured in `createOrgCollections`
**WHEN** the file is inspected for `onUpdate:` / `onDelete:` callbacks
**THEN** the chatSessions / v2Workspaces / v2Projects entries have NO `onUpdate` or `onDelete` handlers (Sprint 02 is read-only; writes are deferred to Sprint 03+).

**Verify:** `grep -A 10 "chat_sessions\|v2_workspaces\|v2_projects" apps/mobile/lib/collections/collections.ts | grep -c "onUpdate\|onDelete"` returns 0.

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | OrgCollections interface contains a `chatSessions: Collection<SelectChatSession>` member | AC-1 | edge | `bun run typecheck` |
| TC-2 | OrgCollections interface contains a `v2Workspaces: Collection<SelectV2Workspace>` member | AC-1 | edge | `bun run typecheck` |
| TC-3 | OrgCollections interface contains a `v2Projects: Collection<SelectV2Project>` member | AC-1 | edge | `bun run typecheck` |
| TC-4 | createOrgCollections returns chatSessions with `params.table === 'chat_sessions'` | AC-2 | happy_path | `bun test apps/mobile/lib/collections/collections.test.ts` |
| TC-5 | createOrgCollections returns v2Workspaces with `params.table === 'v2_workspaces'` | AC-2 | happy_path | `bun test apps/mobile/lib/collections/collections.test.ts` |
| TC-6 | createOrgCollections returns v2Projects with `params.table === 'v2_projects'` | AC-2 | happy_path | `bun test apps/mobile/lib/collections/collections.test.ts` |
| TC-7 | getCollections(orgId) returns reference-equal chatSessions across two calls with same orgId | AC-3 | edge | `bun test apps/mobile/lib/collections/collections.test.ts` |
| TC-8 | Manual smoke: useLiveQuery over chatSessions returns rows for a seeded org within 3 seconds | AC-4 | happy_path | Manual: `cd apps/mobile && bun dev` |
| TC-9 | The three new collection definitions contain zero `onUpdate` or `onDelete` handlers | AC-5 | error | `grep -A 10 'chat_sessions' apps/mobile/lib/collections/collections.ts \| grep -c 'onUpdate\|onDelete'` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/lib/collections/collections.ts` | 1-162 | Existing pattern — `tasks` and `projects` collections to mirror for the new shapes |
| `packages/db/src/schema/schema.ts` | (search for chatSessions, v2Workspaces, v2Projects) | Confirm `SelectChatSession`, `SelectV2Workspace`, `SelectV2Project` types exist and review column shapes |
| `apps/electric-proxy/src/where.ts` | 49-137 | Server-side proxy where.ts confirming `v2_workspaces`, `chat_sessions`, `v2_projects` shapes are exposed |
| `plans/chat-mobile-plan/11-technical-requirements/02-api-design.md` | 41-60 | Spec — three new collections + client-side scoping conventions |
| `plans/chat-mobile-plan/11-technical-requirements/06-open-sub-decisions.md` | 10-18 | Sub-decision #6 — project-first model rationale |
| `apps/mobile/screens/(authenticated)/providers/CollectionsProvider/CollectionsProvider.tsx` | 1-40 | Provider that exposes `getCollections(orgId)` via `useCollections()` — new collections flow through automatically |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/lib/collections/collections.ts` (MODIFY — add 3 collections + extend `OrgCollections` interface)
- `apps/mobile/lib/collections/collections.test.ts` (NEW — co-located tests)

**WRITE-PROHIBITED:**
- `packages/db/src/schema/**` — schema is the source of truth; mobile consumes types, never defines them
- `packages/db/drizzle/**` — Drizzle-managed migrations, never hand-edit
- `apps/electric-proxy/**` — server-side shape config; this task is mobile-only
- `apps/mobile/components/**` — no UI work in this task
- `apps/mobile/global.css` — no token changes

---

## CODE PATTERN

**Reference:** Existing `tasks` and `projects` collection registration in `createOrgCollections` — mirror exactly except OMIT `onUpdate` / `onDelete`.

**Source:** `apps/mobile/lib/collections/collections.ts:92-103` — `projects` registration (read-only, no write handlers).

**Example:**
```ts
// Inside createOrgCollections(organizationId):
const chatSessions = createCollection(
  electricCollectionOptions<SelectChatSession>({
    id: `chat_sessions-${organizationId}`,
    shapeOptions: {
      url: electricUrl,
      params: { table: "chat_sessions", organizationId },
      headers,
      columnMapper,
    },
    getKey: (item) => item.id,
  }),
);

const v2Workspaces = createCollection(
  electricCollectionOptions<SelectV2Workspace>({
    id: `v2_workspaces-${organizationId}`,
    shapeOptions: {
      url: electricUrl,
      params: { table: "v2_workspaces", organizationId },
      headers,
      columnMapper,
    },
    getKey: (item) => item.id,
  }),
);

const v2Projects = createCollection(
  electricCollectionOptions<SelectV2Project>({
    id: `v2_projects-${organizationId}`,
    shapeOptions: {
      url: electricUrl,
      params: { table: "v2_projects", organizationId },
      headers,
      columnMapper,
    },
    getKey: (item) => item.id,
  }),
);

return {
  tasks,
  taskStatuses,
  projects,
  members,
  users,
  invitations,
  chatSessions,
  v2Workspaces,
  v2Projects,
};
```

**Anti-pattern:** Adding `onUpdate` / `onDelete` callbacks calling tRPC mutations "just in case" — Sprint 02 doesn't expose any write paths for these collections. Adding them prematurely couples Sprint 02 to Sprint 03's mutation surface (chat.createSession, chat.updateTitle, etc.) and risks runtime errors if the mutations are called before they're wired.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/11-technical-requirements/02-api-design.md` §3 (ElectricSQL Shapes table)
- `plans/chat-mobile-plan/11-technical-requirements/06-open-sub-decisions.md` (project-first sub-decision #6)

**Interaction notes:**
- 44pt hit target — not applicable (no UI in this task).
- Light + dark theme — not applicable (no UI).
- Project-first scoping — does NOT live in this task. Collections are org-scoped at the Electric level; project-scoped queries are derived client-side via `useSessionsForProject` (MOB-INFRA-007-V2).
- Cache-first per AGENTS.md TanStack DB rule — does NOT live in this task. Collections expose `isReady` to downstream hooks; the rule applies at the consumer layer.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-5):
1. **RED**: Write failing test in `collections.test.ts` asserting the AC's THEN clause.
2. **GREEN**: Modify `collections.ts` to satisfy.
3. **REFACTOR**: Improve while keeping tests green.
4. Move to next AC.

AC-4 is a manual smoke test against a real Neon dev branch — perform it AFTER AC-1 through AC-3 land. AC-5 is a defensive `grep` check; codify it as a test that reads the file source.

Commit after every AC passes. Use commit message `feat(mobile/lib): AC-N {short name} (MOB-INFRA-005-V2)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| All Tests Pass | `bun test apps/mobile/lib/collections/collections.test.ts` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| No write handlers on new collections | `grep -A 12 "chat_sessions\|v2_workspaces\|v2_projects" apps/mobile/lib/collections/collections.ts \| grep -c "onUpdate\|onDelete"` | 0 |
| Manual smoke against real Electric | `cd apps/mobile && bun dev` then render a temporary `<DebugChatSessionsLiveQuery />` in a test screen | Live rows render within 3s |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** The mobile-app Electric collections layer is owned by the React Native UI implementer per `13-testing-strategy.md` and the mobile app's `AGENTS.md`. node-implementer would not edit `apps/mobile/lib/`. The schema types being imported are read-only from `@superset/db/schema`.

---

## CODING STANDARDS

- `AGENTS.md` (TanStack DB / Electric rule — live queries are cache-first; this task does not violate it because it only registers collections; consumer hooks enforce the rule)
- `apps/mobile/AGENTS.md` (lib structure: `apps/mobile/lib/collections/collections.ts` is the canonical location)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (TanStack DB + Electric SDK are the base; we configure them, never re-implement)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (preserve ember theme tokens — not applicable but reinforces hands-off on `global.css`)

---

## DEPENDENCIES

- **Depends on:** None (Sprint 01 shipped the existing pattern in `collections.ts`)
- **Blocks:** MOB-INFRA-006-V2, MOB-INFRA-007-V2, MOB-INFRA-011, MOB-NAV-005-INT, MOB-NAV-008-V2, MOB-NAV-010-V2, MOB-NAV-013-V2, MOB-NAV-014-V2, MOB-PLATF-009 — every downstream task in this sprint depends on these collections being available.

---

## NOTES

- The Electric proxy at `apps/electric-proxy/src/where.ts` already handles authorization scoping per `organizationId` for these three shapes — no auth glue required on mobile side beyond the existing `Cookie` header.
- If `SelectV2Project` is not exported from `@superset/db/schema`, check `packages/db/src/schema/index.ts` for the barrel export; add the export there if missing (single-line change). DO NOT modify the underlying schema definition.
- The new collections inherit the global cache invalidation pattern — when the user signs out, `collectionsCache.clear()` is called elsewhere (or the app re-mounts the provider); no special handling needed in this task.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN OrgCollections interface in collections.ts WHEN file is type-checked THEN it contains three additional members typed as Collection<SelectChatSession>, Collection<SelectV2Workspace>, Collection<SelectV2Project>",
      "verify": "bun run typecheck"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN createOrgCollections(organizationId) WHEN called with valid orgId THEN returned object includes chatSessions, v2Workspaces, v2Projects configured with correct table params, headers, columnMapper, and getKey",
      "verify": "bun test apps/mobile/lib/collections/collections.test.ts"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN getCollections(orgId) is called twice with same orgId WHEN both complete THEN returned chatSessions/v2Workspaces/v2Projects instances are reference-equal",
      "verify": "bun test apps/mobile/lib/collections/collections.test.ts"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN mobile dev build runs against Neon dev branch with seeded chat_sessions WHEN test component mounts useLiveQuery over chatSessions THEN data is non-empty array with camelCase rows",
      "verify": "Manual smoke: cd apps/mobile && bun dev"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN new collections are configured WHEN file inspected for write handlers THEN chatSessions/v2Workspaces/v2Projects entries have NO onUpdate or onDelete handlers",
      "verify": "grep -A 12 chat_sessions apps/mobile/lib/collections/collections.ts | grep -c onUpdate"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "OrgCollections interface contains chatSessions: Collection<SelectChatSession> member",
      "maps_to_ac": "AC-1",
      "verify": "bun run typecheck"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "OrgCollections interface contains v2Workspaces: Collection<SelectV2Workspace> member",
      "maps_to_ac": "AC-1",
      "verify": "bun run typecheck"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "OrgCollections interface contains v2Projects: Collection<SelectV2Project> member",
      "maps_to_ac": "AC-1",
      "verify": "bun run typecheck"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "createOrgCollections returns chatSessions with params.table === 'chat_sessions'",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/lib/collections/collections.test.ts"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "createOrgCollections returns v2Workspaces with params.table === 'v2_workspaces'",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/lib/collections/collections.test.ts"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "createOrgCollections returns v2Projects with params.table === 'v2_projects'",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/lib/collections/collections.test.ts"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "getCollections(orgId) returns reference-equal chatSessions across two calls with same orgId",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/lib/collections/collections.test.ts"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Manual smoke: useLiveQuery over chatSessions returns rows for a seeded org within 3 seconds",
      "maps_to_ac": "AC-4",
      "verify": "Manual: cd apps/mobile && bun dev"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "The three new collection definitions contain zero onUpdate or onDelete handlers",
      "maps_to_ac": "AC-5",
      "verify": "grep -A 12 chat_sessions apps/mobile/lib/collections/collections.ts | grep -c onUpdate"
    }
  ]
}
-->
