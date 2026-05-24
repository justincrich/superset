# MOB-NAV-001: Create Chat tab route layout under app/(authenticated)/(chat)/_layout.tsx

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 90 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

The mobile app's tab structure today (per `apps/mobile/app/(authenticated)/_layout.tsx`) ships three tabs: `(home)`, `(tasks)`, `(more)`. Sprint 02 introduces the Chat surface as a new `(chat)` tab group with the sessions list as its landing screen. The `(home)` tab is being phased out per the Sprint 02 PRD's 3-tab footer rationale (Tasks · Chat · More).

This task creates the `(chat)` route group: the `_layout.tsx` config, the index route re-export, and the providers that the sessions-list surface depends on (SelectedProjectProvider from MOB-INFRA-006-V2 mounts inside this layout).

Current state: no `(chat)` route group exists; the only authenticated tabs are `(home)`, `(tasks)`, `(more)`. Desired state: `apps/mobile/app/(authenticated)/(chat)/_layout.tsx` defines a Stack layout, `apps/mobile/app/(authenticated)/(chat)/index.tsx` re-exports `SessionsListScreen` from `screens/`, and `SelectedProjectProvider` wraps the stack. MOB-NAV-011 will subsequently update the parent `(authenticated)/_layout.tsx` to include the `(chat)` tab in the 3-tab footer.

---

## CRITICAL CONSTRAINTS

- MUST place the route layout at `apps/mobile/app/(authenticated)/(chat)/_layout.tsx` per `11-technical-requirements/05-ui-infrastructure.md:153-159`.
- MUST place the index route at `apps/mobile/app/(authenticated)/(chat)/index.tsx` and re-export from `screens/(authenticated)/(chat)/SessionsListScreen` (per the mobile AGENTS.md "Route with UI" pattern).
- MUST create a screen stub at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` returning a minimal placeholder body (`<View><Text>SessionsListScreen (mounted)</Text></View>`) — MOB-NAV-005-INT will replace the body with the full assembly. The placeholder MUST mount the providers so they're testable now.
- MUST mount `SelectedProjectProvider` (from MOB-INFRA-006-V2) inside the `(chat)/_layout.tsx` so all descendant screens have access via `useSelectedProject()`.
- MUST use `Stack` from `expo-router` (per the existing `(tasks)/_layout.tsx` pattern at `apps/mobile/app/(authenticated)/(tasks)/_layout.tsx:1-10`).
- MUST configure `Stack.Screen name="index" options={{ title: "Chat" }}` so the native header (if shown) and back-button label match.
- MUST gate the screen body on `useSelectedProject()`'s `isReady` for the placeholder — render a `null` (or `LoadingSkeleton` if available) while not ready. MOB-NAV-005-INT replaces this with the full UI.
- NEVER move the `(home)` or `(tasks)` route groups — they stay where they are. This task only adds `(chat)`.
- NEVER mount `CollectionsProvider` here — the parent `(authenticated)/_layout.tsx` already mounts it (line 10 of that file).
- NEVER inline UI logic in the `app/` directory — per the mobile `AGENTS.md` rule, `app/` owns routing only, `screens/` owns UI.
- STRICTLY adhere to the Stack + tab pattern — `(chat)` is a route GROUP (parentheses in folder name), making it shareable as a tab segment for MOB-NAV-011.

---

## SPECIFICATION

**Objective:** Add the `(chat)` route group to the mobile app: a Stack layout that mounts `SelectedProjectProvider`, an index route that re-exports a minimal `SessionsListScreen` placeholder, and screen-level type-safety so MOB-NAV-005-INT can replace the placeholder body without churn.

**Success state:** Navigating to `/(authenticated)/(chat)` route in the running mobile app renders a screen carrying the `SessionsListScreen` placeholder under a Stack layout, with `SelectedProjectProvider` mounted; `bun run typecheck` exits 0; the `(chat)` group is reachable from the existing tab bar after MOB-NAV-011 wires it.

---

## ACCEPTANCE CRITERIA

### AC-1: Route group _layout.tsx mounts Stack with SelectedProjectProvider

**GIVEN** the file `apps/mobile/app/(authenticated)/(chat)/_layout.tsx` exists
**WHEN** the layout is rendered (via expo-router navigation to the `(chat)` segment)
**THEN** it renders a `<Stack>` from `expo-router` wrapped by `<SelectedProjectProvider>` and uses `screenOptions={{ headerShown: false }}` (matching the parent `(authenticated)/_layout.tsx` convention).

**Verify:** `bun test apps/mobile/app/(authenticated)/(chat)/_layout.test.tsx`

### AC-2: Index route re-exports SessionsListScreen

**GIVEN** the file `apps/mobile/app/(authenticated)/(chat)/index.tsx` exists
**WHEN** the file is imported by expo-router
**THEN** its default export is the `SessionsListScreen` component from `@/screens/(authenticated)/(chat)/SessionsListScreen` (verified via re-export — no inline JSX in the app/ file).

**Verify:** `bun test apps/mobile/app/(authenticated)/(chat)/index.test.tsx` AND `grep -c "import\|export" apps/mobile/app/(authenticated)/(chat)/index.tsx` ≤ 3 (one import, one default export, optional blank line).

### AC-3: SessionsListScreen placeholder mounts and consumes useSelectedProject

**GIVEN** the placeholder `SessionsListScreen` is mounted within `(chat)/_layout.tsx` (which mounts the provider)
**WHEN** the screen renders
**THEN** it calls `useSelectedProject()` without throwing, displays a minimal placeholder body (`<View><Text>SessionsListScreen (mounted)</Text></View>`), and exposes `testID="sessions-list-screen"` on the root view for Maestro probing.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx`

### AC-4: Dev build navigates to /(authenticated)/(chat) without error

**GIVEN** the dev build is running and the user is signed in
**WHEN** the developer manually navigates to `/(authenticated)/(chat)` (via expo-router `router.push("/(authenticated)/(chat)")` from the existing `(home)` tab in a temp debug button)
**THEN** the screen renders the placeholder, the bottom tab bar remains visible, and no console errors are thrown.

**Verify:** Manual: `cd apps/mobile && bun dev` → add a temp button to `/(home)/index.tsx` that calls `router.push("/(authenticated)/(chat)")` → tap and confirm.

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | _layout.tsx imports Stack from 'expo-router' and SelectedProjectProvider from screens/.../providers | AC-1 | edge | `bun test apps/mobile/app/(authenticated)/(chat)/_layout.test.tsx` |
| TC-2 | _layout.tsx renders <SelectedProjectProvider><Stack /></SelectedProjectProvider> | AC-1 | happy_path | `bun test apps/mobile/app/(authenticated)/(chat)/_layout.test.tsx` |
| TC-3 | index.tsx default export equals SessionsListScreen from screens/ | AC-2 | happy_path | `bun test apps/mobile/app/(authenticated)/(chat)/index.test.tsx` |
| TC-4 | index.tsx contains no inline JSX (only import + export) | AC-2 | edge | `grep -c '<' apps/mobile/app/(authenticated)/(chat)/index.tsx` returns 0 or 1 (only the import arrow if applicable) |
| TC-5 | SessionsListScreen placeholder calls useSelectedProject() and renders without error | AC-3 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-6 | SessionsListScreen renders root View with testID='sessions-list-screen' | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` |
| TC-7 | Manual: navigating to /(authenticated)/(chat) in dev build renders the placeholder without console errors | AC-4 | happy_path | Manual: `cd apps/mobile && bun dev` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/app/(authenticated)/_layout.tsx` | 1-22 | Parent layout — mounts `CollectionsProvider` (do not re-mount); shows tabs hidden; `(chat)` tab will be added by MOB-NAV-011 |
| `apps/mobile/app/(authenticated)/(tasks)/_layout.tsx` | 1-10 | Existing tab layout pattern to mirror |
| `apps/mobile/app/(authenticated)/(tasks)/index.tsx` | (read) | Pattern for "thin route re-exports from screens/" |
| `apps/mobile/AGENTS.md` | 1-80 | Mobile-app rule: `app/` owns routing, `screens/` owns UI |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 9, 153-175 | SessionsListScreen + route group layout spec |
| `plans/chat-mobile-plan/09-uc-nav.md` | 259-279 | UC-NAV-01 ACs including testID="new-chat-fab" (informational for MOB-NAV-005-INT) |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/app/(authenticated)/(chat)/_layout.tsx` (NEW)
- `apps/mobile/app/(authenticated)/(chat)/_layout.test.tsx` (NEW)
- `apps/mobile/app/(authenticated)/(chat)/index.tsx` (NEW)
- `apps/mobile/app/(authenticated)/(chat)/index.test.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` (NEW — placeholder body)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/index.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/index.ts` (NEW — barrel)

**WRITE-PROHIBITED:**
- `apps/mobile/app/(authenticated)/_layout.tsx` — owned by MOB-NAV-011 (which will add `(chat)` to the tab list); do NOT modify here
- `apps/mobile/app/(authenticated)/(home)/**` — leave untouched
- `apps/mobile/app/(authenticated)/(tasks)/**` — leave untouched
- `apps/mobile/app/(authenticated)/(more)/**` — leave untouched
- `apps/mobile/components/**` — no component changes in this task
- `apps/mobile/global.css` — established ember tokens
- `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/**` — owned by MOB-INFRA-006-V2

---

## CODE PATTERN

**Reference:** Expo-router tab group layout with provider wrapping the Stack.

**Source:** `apps/mobile/app/(authenticated)/(tasks)/_layout.tsx:1-10` — existing tab layout pattern. `apps/mobile/app/(authenticated)/_layout.tsx:1-22` — provider-wrapping pattern.

**Example:**
```tsx
// apps/mobile/app/(authenticated)/(chat)/_layout.tsx
import { Stack } from "expo-router";
import { SelectedProjectProvider } from "@/screens/(authenticated)/(chat)/providers/SelectedProjectProvider";

export default function ChatLayout() {
  return (
    <SelectedProjectProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ title: "Chat" }} />
      </Stack>
    </SelectedProjectProvider>
  );
}
```

```tsx
// apps/mobile/app/(authenticated)/(chat)/index.tsx
import { SessionsListScreen } from "@/screens/(authenticated)/(chat)/SessionsListScreen";

export default SessionsListScreen;
```

```tsx
// apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx (PLACEHOLDER — replaced by MOB-NAV-005-INT)
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useSelectedProject } from "@/screens/(authenticated)/(chat)/hooks/useSelectedProject";

export function SessionsListScreen() {
  const { isReady } = useSelectedProject();
  return (
    <View testID="sessions-list-screen" className="flex-1 bg-background items-center justify-center">
      <Text>SessionsListScreen (mounted, isReady={String(isReady)})</Text>
    </View>
  );
}
```

**Anti-pattern:** Mounting `CollectionsProvider` inside `(chat)/_layout.tsx` — it's already mounted by the parent `(authenticated)/_layout.tsx`. Re-mounting would create a duplicate collections cache and break `useLiveQuery` consistency across tabs.

Another anti-pattern: inlining JSX in `app/(authenticated)/(chat)/index.tsx`. Per the mobile AGENTS.md rule, route files in `app/` are thin re-exports — UI lives in `screens/`.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` §Screen structure (lines 148-175)
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-01 (Chat tab is the landing surface)
- `apps/mobile/AGENTS.md` (Mobile-app route ↔ screen separation rule)

**Interaction notes:**
- 44pt hit target — N/A for layout itself; placeholder body has no interactive elements.
- Light + dark theme — `bg-background` resolves from `apps/mobile/global.css` for both themes.
- Project-first scoping — `SelectedProjectProvider` mounted here is the FOUNDATION for project-first scoping downstream. All `(chat)` screens consume `useSelectedProject()` to determine the active project.
- Cache-first per AGENTS.md TanStack DB rule — the placeholder gates body on `isReady` for educational clarity, but MOB-NAV-005-INT MUST render persisted rows even when `isReady` is false (cache-first rule applies at the consumer level, not the route-shell level).

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-3):
1. **RED**: Write failing test asserting the layout/index/screen structure.
2. **GREEN**: Create the minimum file(s) to satisfy.
3. **REFACTOR**: Improve while keeping tests green.
4. Move to next AC.

AC-4 is a manual smoke test — perform AFTER AC-1 through AC-3 land, using a TEMPORARY debug button in `(home)/index.tsx` that calls `router.push("/(authenticated)/(chat)")`. REMOVE the temp button before commit (or commit it to a separate revert-on-merge commit). MOB-NAV-011 will permanently wire the navigation via the tab bar.

Commit after every AC passes. Use commit message `feat(mobile/app): AC-N {short name} (MOB-NAV-001)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Layout Tests Pass | `bun test apps/mobile/app/(authenticated)/(chat)/_layout.test.tsx` | Exit 0 |
| Index Tests Pass | `bun test apps/mobile/app/(authenticated)/(chat)/index.test.tsx` | Exit 0 |
| Screen Tests Pass | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Manual nav smoke | `cd apps/mobile && bun dev` then push to `/(authenticated)/(chat)` from a temp button | Placeholder renders, no errors |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Expo-router route configuration + screen-folder scaffolding is owned by the React Native UI implementer per the mobile AGENTS.md (app/ + screens/ separation).

---

## CODING STANDARDS

- `AGENTS.md` (project structure: one folder per component/screen)
- `apps/mobile/AGENTS.md` (route ↔ screen separation — app/ routing only, screens/ UI)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (expo-router is the base; configure, don't reimplement Stack)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (preserve `global.css`)

---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-006-V2 (SelectedProjectProvider must exist before this layout can mount it). If MOB-INFRA-006-V2 has not landed, the layout file can temporarily import a stub provider and depend on the migration landing in the same PR stack.
- **Blocks:** MOB-NAV-005-INT (SessionsListScreen body replacement), MOB-NAV-011 (tab bar wiring), MOB-NAV-008-V2, MOB-NAV-010-V2 (all NAV screens consume this layout)

---

## NOTES

- The `(chat)` group is a route SEGMENT (parens denote a group, not a URL path segment). The URL surface is just `/(authenticated)` — descendants are reached via `router.push("/(authenticated)/(chat)")` or via the tab trigger MOB-NAV-011 will add.
- MOB-NAV-005-INT replaces the placeholder body — DO NOT pre-implement any sessions-list UI here. Keep this task focused on the route shell.
- If MOB-INFRA-006-V2 has not yet landed when this task runs, write the layout to import `SelectedProjectProvider` from the expected path and commit; the import will be valid once MOB-INFRA-006-V2 lands (or use a stub provider that satisfies the same interface).

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN _layout.tsx exists WHEN rendered THEN it renders <Stack> wrapped by <SelectedProjectProvider> with screenOptions headerShown=false",
      "verify": "bun test apps/mobile/app/(authenticated)/(chat)/_layout.test.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN index.tsx exists WHEN imported by expo-router THEN default export is SessionsListScreen from screens/ with no inline JSX",
      "verify": "bun test apps/mobile/app/(authenticated)/(chat)/index.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN SessionsListScreen placeholder mounted within (chat)/_layout WHEN screen renders THEN it calls useSelectedProject() without throwing, displays placeholder body, exposes testID='sessions-list-screen'",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN dev build running and user signed in WHEN manually navigating to /(authenticated)/(chat) via router.push THEN screen renders placeholder, tab bar visible, no console errors",
      "verify": "Manual: cd apps/mobile && bun dev"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "_layout.tsx imports Stack from 'expo-router' and SelectedProjectProvider from screens/",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/app/(authenticated)/(chat)/_layout.test.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "_layout.tsx renders <SelectedProjectProvider><Stack/></SelectedProjectProvider>",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/app/(authenticated)/(chat)/_layout.test.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "index.tsx default export equals SessionsListScreen from screens/",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/app/(authenticated)/(chat)/index.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "index.tsx contains no inline JSX (only import + default export)",
      "maps_to_ac": "AC-2",
      "verify": "grep -c '<' apps/mobile/app/(authenticated)/(chat)/index.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "SessionsListScreen placeholder calls useSelectedProject() and renders without error",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "SessionsListScreen renders root View with testID='sessions-list-screen'",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.test.tsx"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Manual: navigating to /(authenticated)/(chat) in dev build renders placeholder without console errors",
      "maps_to_ac": "AC-4",
      "verify": "Manual: cd apps/mobile && bun dev"
    }
  ]
}
-->
