# MOB-INFRA-006-V2: Build SelectedProjectProvider + useSelectedProject + migration

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 150 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** L

---

## BACKGROUND

The v2.0.0 project-first NAV model requires the mobile app to maintain `selectedProjectId` locally — the top-level filter axis for the sessions list. Per `plans/chat-mobile-plan/11-technical-requirements/06-open-sub-decisions.md` sub-decision #6, this state must be persisted in `expo-secure-store` keyed by `(userId, organizationId)` and seeded by a default-selection algorithm: project with most-recent `lastActiveAt` across its sessions, falling back to alphabetical-first when no sessions exist.

There is no SelectedProjectProvider today (the legacy v1.x SelectedHostProvider has been deleted per the v2.0.0 rewrite). Without this provider, MOB-INFRA-007-V2 (`useSessionsForProject`) has no way to know which project to scope to, MOB-NAV-008-V2 (ProjectPickerSheet) has no way to write the user's pick back, and MOB-NAV-005-INT (SessionsListScreen) cannot mount without an empty-list flash.

This task also includes the **one-time idempotent migration** that drops any legacy `selectedHostId` from `expo-secure-store` and seeds `selectedProjectId` from the default-selection logic — this migration MUST run BEFORE downstream hooks consume `selectedProjectId` to avoid empty-list flashes on the first launch post-upgrade.

---

## CRITICAL CONSTRAINTS

- MUST place the provider at `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.tsx` with co-located `index.ts` per AGENTS.md / `11-technical-requirements/05-ui-infrastructure.md` line 20.
- MUST place the hook at `apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/useSelectedProject.ts` per the same spec.
- MUST persist `selectedProjectId` in `expo-secure-store` (NOT `AsyncStorage`) using key format: `mob.chat.selectedProjectId:${userId}:${organizationId}`. Use `SecureStore.setItemAsync` / `getItemAsync` / `deleteItemAsync` per the existing pattern in `apps/mobile/lib/auth/client.ts`.
- MUST run a one-shot IDEMPOTENT migration on mount: (a) delete any legacy `mob.chat.selectedHostId:${userId}:${organizationId}` key, (b) write a migration marker `mob.chat.migration-v2:${userId}:${organizationId} = "done"`, (c) skip the migration if the marker is already `"done"`.
- MUST seed default `selectedProjectId` ONLY when the persisted key is missing AND the `v2_projects` collection has rows: pick the project whose joined sessions have the most-recent `lastActiveAt`; fall back to alphabetical-first by `name` when no sessions exist; remain `null` when zero projects exist.
- MUST gracefully recover when the persisted `selectedProjectId` no longer references an accessible project (deleted, permission revoked, org switched): re-run the default-selection logic and surface a brief toast via the existing toast infra.
- MUST expose `useSelectedProject()` returning `{ selectedProjectId: string | null, setSelectedProjectId: (id: string) => void }` — synchronous reads, async writes to secure-store (writes do NOT block UI updates).
- MUST mount the provider INSIDE `CollectionsProvider` so it can read from `v2_projects` and `chat_sessions` for default-selection (mounted in `apps/mobile/app/(authenticated)/(chat)/_layout.tsx` once that layout exists per MOB-NAV-001).
- MUST run the migration synchronously-with-respect-to-downstream-mounts — `useSessionsForProject` MUST NOT receive a stale `selectedProjectId` before the migration completes. Gate downstream consumers via an `isReady: boolean` field on the context.
- NEVER store `selectedProjectId` in `AsyncStorage` — security-sensitive scoping anchors live in `expo-secure-store`.
- NEVER write to secure-store on every render — only when `setSelectedProjectId` is called or during the seed/migration paths.
- NEVER skip the migration after the marker is set — re-running drops legacy keys idempotently; the marker prevents re-seeding.
- STRICTLY adhere to the cache-first AGENTS.md rule when reading from `v2_projects` / `chat_sessions` for default-selection: render the provider with `selectedProjectId: null` while `isReady: false`; only seed once `isReady: true`.

---

## SPECIFICATION

**Objective:** Provide a React Context (`SelectedProjectProvider`) + hook (`useSelectedProject`) that exposes the current `selectedProjectId` for the sessions-list surface, persists it across launches via `expo-secure-store`, defaults it to a sensible project on first launch, runs a one-time legacy migration, and gracefully recovers when the persisted id becomes invalid.

**Success state:** `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.tsx` and `apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/useSelectedProject.ts` exist; the provider mounts, runs the migration, seeds default selection, and exposes `{ selectedProjectId, setSelectedProjectId, isReady }` via context. `useSessionsForProject` (MOB-INFRA-007-V2) can call `useSelectedProject()` and receive a stable id within ~200ms of mount.

---

## ACCEPTANCE CRITERIA

### AC-1: Provider seeds default selectedProjectId on first launch

**GIVEN** `expo-secure-store` has no `mob.chat.selectedProjectId:${userId}:${orgId}` key and `v2_projects` has rows
**WHEN** the `SelectedProjectProvider` mounts inside `CollectionsProvider`
**THEN** `selectedProjectId` resolves to the project with most-recent `lastActiveAt` across its sessions (or alphabetical-first by `name` if no sessions exist) within 500ms of mount AND `isReady` flips to `true`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx`

### AC-2: setSelectedProjectId writes to secure-store and updates context

**GIVEN** the provider is mounted with `selectedProjectId="project-a"`
**WHEN** a consumer calls `setSelectedProjectId("project-b")`
**THEN** the context value updates to `"project-b"` synchronously AND `expo-secure-store` contains the value `"project-b"` under the org-scoped key within 200ms (asserted via `SecureStore.getItemAsync`).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx`

### AC-3: One-shot migration drops legacy selectedHostId and is idempotent

**GIVEN** `expo-secure-store` contains `mob.chat.selectedHostId:${userId}:${orgId} = "host-x"` and no migration marker
**WHEN** the provider mounts
**THEN** the legacy key is deleted, the migration marker `mob.chat.migration-v2:${userId}:${orgId} = "done"` is set, AND on a subsequent remount the migration runs zero secure-store ops (verified via mock spy).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx`

### AC-4: Stale selectedProjectId falls back to default + toast

**GIVEN** `selectedProjectId="deleted-project"` is persisted but `v2_projects` contains no row with that id
**WHEN** the provider mounts and the collection becomes ready
**THEN** the provider re-runs default-selection logic to assign a valid id, persists the new id, AND emits a brief toast ("Switched to {project name}") via the existing toast infra.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx`

### AC-5: isReady gates downstream consumers

**GIVEN** the provider is mounting and the migration / secure-store reads are in flight
**WHEN** a consumer calls `useSelectedProject()`
**THEN** the returned object includes `isReady: false` initially, then transitions to `isReady: true` exactly once after migration completes AND default-selection (or persisted-id verification) finishes. `selectedProjectId` is `null` while `isReady` is false to prevent flash.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx`

### AC-6: Provider returns null when zero accessible projects exist

**GIVEN** `v2_projects` is `[]` (no projects in active org) and `isReady=true`
**WHEN** the provider mounts
**THEN** `selectedProjectId` remains `null` AND `setSelectedProjectId(...)` calls are no-ops (no secure-store write triggered for invalid ids), AND no error is thrown.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx`

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | Provider mount writes seeded selectedProjectId to secure-store when key is missing | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-2 | Provider seeds selectedProjectId to project with most-recent session lastActiveAt | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-3 | Provider seeds selectedProjectId to alphabetical-first project when no sessions exist | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-4 | setSelectedProjectId('project-b') updates context value synchronously | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-5 | setSelectedProjectId('project-b') persists 'project-b' to secure-store within 200ms | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-6 | Migration deletes legacy selectedHostId key when present | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-7 | Migration sets migration-v2 marker after first run | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-8 | Migration is no-op on second mount when marker already set | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-9 | Stale persisted selectedProjectId triggers re-seed + toast | AC-4 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-10 | useSelectedProject returns isReady=false during initial async ops | AC-5 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-11 | useSelectedProject returns isReady=true exactly once after migration + seed complete | AC-5 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |
| TC-12 | Provider returns selectedProjectId=null and accepts no-op setSelectedProjectId when zero projects exist | AC-6 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 20-22 | Spec — SelectedProjectProvider + useSelectedProject location + behavior |
| `plans/chat-mobile-plan/11-technical-requirements/06-open-sub-decisions.md` | 10-18 | Project-first sub-decision rationale + first-launch default + migration spec |
| `plans/chat-mobile-plan/09-uc-nav.md` | 271-274 | UC-NAV-01 ACs — restore selected project, default-selection, fallback handling, migration spec |
| `apps/mobile/lib/auth/client.ts` | (read all) | Existing expo-secure-store usage pattern (`SecureStore.setItemAsync` / `getItemAsync`) |
| `apps/mobile/lib/collections/collections.ts` | 1-162 | Collections API — `v2Projects` and `chatSessions` registered by MOB-INFRA-005-V2 |
| `apps/mobile/screens/(authenticated)/providers/CollectionsProvider/CollectionsProvider.tsx` | 1-40 | Parent provider pattern — `useCollections()` for reading from collections inside the provider |
| `apps/mobile/hooks/useDevicePresence/useDevicePresence.ts` | all | Another expo-secure-store usage pattern in the mobile codebase |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/index.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/useSelectedProject.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/useSelectedProject.test.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/index.ts` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/ui/**` — vendor RNR primitives, no UI in this task anyway
- `apps/mobile/lib/collections/collections.ts` — owned by MOB-INFRA-005-V2; do not modify here
- `apps/mobile/app/(authenticated)/(chat)/_layout.tsx` — owned by MOB-NAV-001; mounting the provider is its job
- `apps/mobile/lib/auth/client.ts` — auth client is stable; do not modify
- `apps/mobile/global.css` — established ember tokens
- `packages/db/drizzle/**` — Drizzle-managed migrations

---

## CODE PATTERN

**Reference:** React Context + hook pattern with `useEffect` for async init and secure-store persistence.

**Source:** `apps/mobile/screens/(authenticated)/providers/CollectionsProvider/CollectionsProvider.tsx:1-40` — parent provider that exposes `useCollections()`. Mirror the createContext / useContext / null-guard pattern.

**Example (provider sketch):**
```ts
// apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.tsx
import { useLiveQuery } from "@tanstack/react-db";
import * as SecureStore from "expo-secure-store";
import {
  createContext,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useSession } from "@/lib/auth/client";
import { useCollections } from "@/screens/(authenticated)/providers/CollectionsProvider";

type SelectedProjectContextValue = {
  selectedProjectId: string | null;
  setSelectedProjectId: (id: string) => void;
  isReady: boolean;
};

export const SelectedProjectContext = createContext<SelectedProjectContextValue | null>(null);

const PROJECT_KEY = (userId: string, orgId: string) =>
  `mob.chat.selectedProjectId:${userId}:${orgId}`;
const LEGACY_HOST_KEY = (userId: string, orgId: string) =>
  `mob.chat.selectedHostId:${userId}:${orgId}`;
const MIGRATION_MARKER = (userId: string, orgId: string) =>
  `mob.chat.migration-v2:${userId}:${orgId}`;

export function SelectedProjectProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? "";
  const orgId = session?.session?.activeOrganizationId ?? "";

  const collections = useCollections();
  const { data: projects, isReady: projectsReady } = useLiveQuery(
    (q) => q.from({ projects: collections.v2Projects }),
  );
  const { data: sessions } = useLiveQuery(
    (q) => q.from({ sessions: collections.chatSessions }),
  );

  const [selectedProjectId, setSelectedProjectIdState] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // One-shot init: migration + seed
  useEffect(() => {
    if (!userId || !orgId || !projectsReady) return;
    let cancelled = false;

    (async () => {
      const marker = await SecureStore.getItemAsync(MIGRATION_MARKER(userId, orgId));
      if (marker !== "done") {
        await SecureStore.deleteItemAsync(LEGACY_HOST_KEY(userId, orgId));
        await SecureStore.setItemAsync(MIGRATION_MARKER(userId, orgId), "done");
      }

      const persisted = await SecureStore.getItemAsync(PROJECT_KEY(userId, orgId));
      const accessibleIds = new Set(projects.map((p) => p.id));
      let resolved: string | null = null;

      if (persisted && accessibleIds.has(persisted)) {
        resolved = persisted;
      } else if (projects.length > 0) {
        resolved = pickDefault(projects, sessions);
        if (resolved) {
          await SecureStore.setItemAsync(PROJECT_KEY(userId, orgId), resolved);
          if (persisted) {
            // Stale id — emit toast (deferred to toast infra hook)
          }
        }
      }

      if (!cancelled) {
        setSelectedProjectIdState(resolved);
        setIsReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, orgId, projectsReady, projects, sessions]);

  const setSelectedProjectId = useCallback(
    (id: string) => {
      if (!userId || !orgId) return;
      // Validate
      if (!projects.some((p) => p.id === id)) return;
      setSelectedProjectIdState(id);
      void SecureStore.setItemAsync(PROJECT_KEY(userId, orgId), id);
    },
    [userId, orgId, projects],
  );

  const value = useMemo(
    () => ({ selectedProjectId, setSelectedProjectId, isReady }),
    [selectedProjectId, setSelectedProjectId, isReady],
  );

  return (
    <SelectedProjectContext.Provider value={value}>
      {children}
    </SelectedProjectContext.Provider>
  );
}

function pickDefault(
  projects: Array<{ id: string; name: string }>,
  sessions: Array<{ v2WorkspaceId: string | null; lastActiveAt: Date | string | null }> | undefined,
): string | null {
  // Most-recent session activity → project; fall back alphabetical
  // (implementation detail per UC-NAV-01 spec)
  // ...
}
```

**Anti-pattern:** Calling `SecureStore.setItemAsync` from inside `useEffect(() => { ... }, [selectedProjectId])` without a marker — every state change writes to secure-store, including the initial seed which itself causes the effect to re-run. Use a dedicated `setSelectedProjectId` callback for explicit user changes, and keep the seed inside the init effect.

Another anti-pattern: gating the entire UI tree behind `isReady` (returning `null` until ready). Per the cache-first AGENTS.md rule, the provider context exposes `isReady` and downstream consumers decide what to render — the provider does NOT block its children.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` §SelectedProjectProvider
- `plans/chat-mobile-plan/11-technical-requirements/06-open-sub-decisions.md` sub-decision #6
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-01 ACs (lines 271-275)

**Interaction notes:**
- 44pt hit target — N/A for this task (no direct UI). The toast emitted on stale-id recovery is rendered by the existing toast infra.
- Light + dark theme — N/A (no UI).
- Project-first scoping — this provider IS the source of truth. Every downstream Electric query in NAV filters by the `selectedProjectId` this provider produces.
- Cache-first per AGENTS.md TanStack DB rule — apply when reading `v2Projects` + `chatSessions` for default-selection. Use `isReady` from `useLiveQuery` only to gate the SEED write (not to delay rendering the children).
- The provider must be mounted INSIDE `CollectionsProvider` (so `useCollections()` works) but OUTSIDE the screens that consume it. The natural mount point is `app/(authenticated)/(chat)/_layout.tsx` — MOB-NAV-001's job.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-6):
1. **RED**: Write failing test in `SelectedProjectProvider.test.tsx` using `@testing-library/react-native` + mocked `expo-secure-store` + mocked `useLiveQuery`.
2. **GREEN**: Modify provider to satisfy.
3. **REFACTOR**: Improve while keeping tests green.
4. Move to next AC.

Use `vi.mock("expo-secure-store")` (or bun:test equivalent) to spy on `setItemAsync` / `getItemAsync` / `deleteItemAsync` calls. Use a fake-timers approach for the async init effect.

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-INFRA-006-V2)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| All Tests Pass | `bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx` | Exit 0 |
| Hook Tests Pass | `bun test apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/useSelectedProject.test.ts` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Manual smoke against real Electric | `cd apps/mobile && bun dev` then render a temp `<DebugSelectedProject />` consumer; sign in, switch projects via raw setter, kill app, relaunch; verify persisted id restores | Manual ✓ |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Provider lives in `apps/mobile/screens/`; depends on `expo-secure-store` and React context — pure React Native concerns owned by the react-native-ui-implementer.

---

## CODING STANDARDS

- `AGENTS.md` (TanStack DB cache-first rule — see usage above; co-location pattern for providers/hooks)
- `apps/mobile/AGENTS.md` (screen-co-location rule — providers under `screens/(authenticated)/(chat)/providers/`)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (expo-secure-store and TanStack DB are the base; configure, don't reimplement)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (preserve ember theme tokens — N/A here but reinforces hands-off)

---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-005-V2 (needs `v2Projects` + `chatSessions` collections to compute default-selection)
- **Blocks:** MOB-INFRA-007-V2 (useSessionsForProject reads `selectedProjectId`), MOB-NAV-005-INT, MOB-NAV-008-V2, MOB-NAV-010-V2, MOB-INFRA-011 (consumers all rely on this)

---

## NOTES

- The migration is one-shot and per `(userId, orgId)` — switching organizations re-evaluates per-org state but the migration marker is also per-org, so switching to an org that has never had the migration run will trigger it once for that org.
- The toast on stale-id recovery is best-effort — if the toast infra is not yet wired, log to console via `console.warn(...)` and add a TODO comment. The test does NOT require an actual toast component to be visible; it just asserts a `onStaleRecovery?` callback is invoked (inject via prop or a context).
- `setSelectedProjectId` is fire-and-forget — the in-memory state updates synchronously for snappy UI; the secure-store write is awaited but not blocking. If the write fails, log via `console.error` and leave the in-memory state intact (next mount will re-seed if needed).
- The default-selection algorithm (most-recent activity → project; alphabetical fallback) is a small helper — keep it pure and test it directly with synthetic project/session arrays.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN secure-store has no selectedProjectId key and v2_projects has rows WHEN provider mounts THEN selectedProjectId resolves to most-recent-activity project (or alphabetical-first when no sessions) within 500ms and isReady flips true",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN provider mounted with selectedProjectId='project-a' WHEN consumer calls setSelectedProjectId('project-b') THEN context updates synchronously and secure-store contains 'project-b' within 200ms",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN secure-store contains legacy selectedHostId and no migration marker WHEN provider mounts THEN legacy key deleted, marker set, AND on remount migration runs zero ops",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN persisted selectedProjectId='deleted-project' but no matching row in v2_projects WHEN provider mounts and collection ready THEN provider re-runs default-selection, persists new id, and emits brief toast",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN provider mounting with migration/secure-store reads in flight WHEN consumer calls useSelectedProject() THEN returned object has isReady=false initially then transitions to true exactly once after migration+seed complete; selectedProjectId is null while isReady=false",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN v2_projects=[] and isReady=true WHEN provider mounts THEN selectedProjectId remains null, setSelectedProjectId calls are no-ops, no error thrown",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Provider mount writes seeded selectedProjectId to secure-store when key is missing",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Provider seeds selectedProjectId to project with most-recent session lastActiveAt",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Provider seeds selectedProjectId to alphabetical-first project when no sessions exist",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "setSelectedProjectId('project-b') updates context value synchronously",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "setSelectedProjectId('project-b') persists 'project-b' to secure-store within 200ms",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Migration deletes legacy selectedHostId key when present",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Migration sets migration-v2 marker after first run",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Migration is no-op on second mount when marker already set",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Stale persisted selectedProjectId triggers re-seed + toast",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "useSelectedProject returns isReady=false during initial async ops",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "useSelectedProject returns isReady=true exactly once after migration + seed complete",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "Provider returns selectedProjectId=null and accepts no-op setSelectedProjectId when zero projects exist",
      "maps_to_ac": "AC-6",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/SelectedProjectProvider.test.tsx"
    }
  ]
}
-->
