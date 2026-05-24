# MOB-NAV-008-V2: Wire ProjectPickerSheet to useAccessibleProjects + SelectedProjectProvider

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 120 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

The Sprint 01 `ProjectPickerSheet` organism (`apps/mobile/screens/sessions-list/components/ProjectPickerSheet/ProjectPickerSheet.tsx:26-73`) accepts props `projects: Project[]`, `selectedProjectId: string`, `onProjectSelect`, `onClose`. It currently renders mock data via Storybook views.

MOB-NAV-005-INT already MOUNTS the sheet and passes initial wiring (basic open/close, basic project list). This task REFINES that wiring:

1. Pull `projects` from `useAccessibleProjects()` (MOB-INFRA-011) — already wired in MOB-NAV-005-INT, but this task fortifies the cache-first contract and adds the projectPicker behavior tests.
2. Pull `selectedProjectId` from `useSelectedProject()` (MOB-INFRA-006-V2) so the check mark renders on the right row.
3. Call `setSelectedProjectId(p.id)` on row tap and dismiss the sheet.
4. Render the sheet ONLY when `projects.length >= 2` (per UC-NAV-08 spec). The MOB-NAV-005-INT screen already guards this, but this task adds an internal defensive guard inside the wrapper.
5. Per UC-NAV-08 §B wireframe, project rows show `{workspaceCount} workspace{s} · {sessionCount} session{s}` — the ProjectPickerSheet organism already does this from the `Project` view-model.

The right home for the "connected" wiring is a wrapper at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.tsx` that consumes the hooks and renders the underlying organism. MOB-NAV-005-INT will swap its current inline ProjectPickerSheet usage for `<ProjectPickerSheetConnected ref={projectPickerRef} />`.

Current state: ProjectPickerSheet organism mounted inline in MOB-NAV-005-INT with hooks accessed directly in the screen body. Desired state: dedicated `ProjectPickerSheetConnected` wrapper that owns the hooks-to-props translation, cache-first guarantees, and dismiss-on-select behavior; MOB-NAV-005-INT consumes the wrapper.

---

## CRITICAL CONSTRAINTS

- MUST place the connected wrapper at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.tsx` with co-located `index.ts` + `.test.tsx`.
- MUST forward a `BottomSheetRef` via `forwardRef` so MOB-NAV-005-INT can call `ref.current?.present()` / `ref.current?.dismiss()`.
- MUST consume `useAccessibleProjects()` and `useSelectedProject()` internally — caller does NOT pass `projects` or `selectedProjectId` props.
- MUST be cache-first: render the sheet (when mounted) with `projects` derived from persisted rows even when `isReady === false` — counts may be temporarily stale but the sheet is interactive.
- MUST short-circuit to render `null` when `accessibleProjects.length < 2` (UC-NAV-08 spec — sheet ONLY exists with ≥2 projects). This is defense-in-depth; MOB-NAV-005-INT already guards via the conditional render.
- MUST handle the `selectedProjectId === null` case: pass empty string to ProjectPickerSheet's `selectedProjectId` prop so no row shows the check mark, but the sheet still renders.
- MUST call `setSelectedProjectId(p.id)` AND dismiss the sheet on row tap. Dismiss happens via the forwarded ref captured by the parent OR via an internal close callback (see code pattern below).
- MUST tag interactive elements with stable testIDs: `testID="project-picker-row-{projectId}"` per `11-technical-requirements/05-ui-infrastructure.md:30-32`. The ProjectPickerSheet organism may need a small testID-prop forward through ProjectPickerRow — verify and patch if missing.
- MUST set `accessibilityState={{ selected: true }}` on the currently-selected row (the existing `ProjectPickerRow` may already do this via the `selected` prop; verify).
- NEVER persist any state inside this wrapper — pure pass-through hook → organism.
- NEVER block rendering on `isReady === false` — cache-first.
- NEVER bypass the SelectedProjectProvider's validation when setting an id — pass `p.id` directly; the provider validates against accessible projects (per MOB-INFRA-006-V2 AC-6).
- STRICTLY adhere to 44pt minimum hit target — ProjectPickerRow row height already satisfies this.

---

## SPECIFICATION

**Objective:** Provide `<ProjectPickerSheetConnected ref={...} />` — a connected wrapper that pulls accessible projects + selected project from their respective hooks, renders the underlying `ProjectPickerSheet` organism, dismisses on selection, and short-circuits to `null` when fewer than 2 projects exist.

**Success state:** `ProjectPickerSheetConnected` mounted with a ref from MOB-NAV-005-INT presents the sheet when `ref.current?.present()` is called, lists all accessible projects with check mark on selected, tapping a project updates `selectedProjectId` and dismisses the sheet, sheet is `null` for single-project orgs.

---

## ACCEPTANCE CRITERIA

### AC-1: Connected wrapper renders ProjectPickerSheet with hook-derived data

**GIVEN** `useAccessibleProjects()` returns 3 projects and `useSelectedProject()` returns `selectedProjectId="p2"`
**WHEN** `<ProjectPickerSheetConnected ref={ref} />` is mounted and `ref.current?.present()` is invoked
**THEN** the sheet renders showing all 3 projects, the row matching `id="p2"` shows the selected indicator (check mark), and each row carries `testID="project-picker-row-{projectId}"`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx`

### AC-2: Tapping a project row updates selectedProjectId AND dismisses the sheet

**GIVEN** the sheet is presented with 3 projects and current selection `p2`
**WHEN** the user taps the row for `p3`
**THEN** `setSelectedProjectId("p3")` is invoked exactly once via `useSelectedProject()`, the sheet's `onDismiss` (or `ref.dismiss()`) fires, and the sheet's visible state becomes dismissed.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx`

### AC-3: Connected wrapper returns null when fewer than 2 projects

**GIVEN** `useAccessibleProjects()` returns 1 project
**WHEN** `<ProjectPickerSheetConnected ref={ref} />` is mounted
**THEN** the wrapper renders `null` (no sheet exists in the tree) AND `ref.current?.present()` is safe to call (no-op).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx`

### AC-4: Cache-first: sheet renders with persisted projects while isReady=false

**GIVEN** `useAccessibleProjects()` returns `{ projects: [3 persisted rows], isReady: false }`
**WHEN** `ref.current?.present()` is invoked
**THEN** the sheet renders with the 3 projects (counts shown via persisted data, possibly stale) — does NOT block render on `isReady`.

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx`

### AC-5: Project rows show workspace + session counts from useLiveQuery (cache-first)

**GIVEN** project `p1` has `workspaceCount=4, sessionCount=12` per `useAccessibleProjects()`
**WHEN** the sheet is rendered
**THEN** the row for `p1` shows subtitle text `"4 workspaces · 12 sessions"` (sourced from the `Project.workspaceCount` and `Project.sessionCount` fields, already wired in the underlying ProjectPickerSheet organism).

**Verify:** `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx`

### AC-6: Maestro asserts project picker open + selection round-trip

**GIVEN** a test account with ≥2 projects and Maestro installed
**WHEN** `.maestro/project-picker.yaml` runs: login, tap Chat, tap chip, assert visible sheet, tap a different project, assert sheet dismissed AND sessions list re-scoped (visible session set changes)
**THEN** the flow exits 0 on both iOS Simulator and Android Emulator.

**Verify:** `cd apps/mobile && maestro test .maestro/project-picker.yaml` (both platforms)

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | Connected wrapper renders ProjectPickerSheet with projects from useAccessibleProjects | AC-1 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-2 | Selected project row carries `selected={true}` based on useSelectedProject().selectedProjectId | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-3 | Each row carries testID='project-picker-row-{projectId}' | AC-1 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-4 | Tapping a row invokes setSelectedProjectId(p.id) exactly once | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-5 | Tapping a row dismisses the sheet (sheet's onDismiss fires or visible state changes) | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-6 | Wrapper returns null when accessibleProjects.length < 2 | AC-3 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-7 | Wrapper does NOT throw when ref.present() is called while rendering null | AC-3 | error | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-8 | Sheet renders persisted projects when useAccessibleProjects isReady=false | AC-4 | edge | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-9 | Row subtitle shows '4 workspaces · 12 sessions' for project with those counts | AC-5 | happy_path | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` |
| TC-10 | Maestro project-picker.yaml exits 0 on iOS Simulator | AC-6 | happy_path | `cd apps/mobile && maestro test .maestro/project-picker.yaml` |
| TC-11 | Maestro project-picker.yaml exits 0 on Android Emulator | AC-6 | edge | `cd apps/mobile && maestro test .maestro/project-picker.yaml --device <android>` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/screens/sessions-list/components/ProjectPickerSheet/ProjectPickerSheet.tsx` | 1-73 | Underlying organism — props contract |
| `apps/mobile/components/ProjectPickerRow/ProjectPickerRow.tsx` | (read all) | Row component — verify testID forward + `selected` prop |
| `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/` | (from MOB-INFRA-011) | Hook contract |
| `apps/mobile/screens/(authenticated)/(chat)/hooks/useSelectedProject/` | (from MOB-INFRA-006-V2) | Hook contract |
| `plans/chat-mobile-plan/09-uc-nav.md` | 84-103 | UC-NAV-08 §B wireframe |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 17, 30-32 | ProjectPickerSheet co-location + testID registry |
| `apps/mobile/components/BottomSheet/BottomSheet.tsx` | 1-106 | BottomSheetRef API; forwardRef pattern |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/index.ts` (NEW)
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` (MODIFY ONLY — swap inline ProjectPickerSheet usage for `<ProjectPickerSheetConnected>`)
- `apps/mobile/screens/sessions-list/components/ProjectPickerSheet/ProjectPickerSheet.tsx` (MODIFY ONLY IF — testID forwarding for project rows is missing; add a `testIDPrefix` or per-row testID prop)
- `apps/mobile/components/ProjectPickerRow/ProjectPickerRow.tsx` (MODIFY ONLY IF — testID forward is missing; add `testID` prop and forward to root Pressable)
- `apps/mobile/.maestro/project-picker.yaml` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/BottomSheet/**` — atom is fixed
- `apps/mobile/screens/(authenticated)/(chat)/providers/SelectedProjectProvider/**` — owned by MOB-INFRA-006-V2
- `apps/mobile/screens/(authenticated)/(chat)/hooks/useAccessibleProjects/**` — owned by MOB-INFRA-011
- `apps/mobile/lib/collections/collections.ts` — owned by MOB-INFRA-005-V2
- `apps/mobile/global.css` — established ember tokens

---

## CODE PATTERN

**Reference:** ForwardRef wrapper composing hooks with an existing imperative-API sheet organism.

**Source:** `apps/mobile/screens/sessions-list/components/ProjectPickerSheet/ProjectPickerSheet.tsx:26-73` (forwardRef + BottomSheetRef pattern).

**Example:**
```tsx
// apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.tsx
import { forwardRef } from "react";
import type { BottomSheetRef } from "@/components/BottomSheet";
import { ProjectPickerSheet } from "@/screens/sessions-list/components/ProjectPickerSheet";
import { useAccessibleProjects } from "@/screens/(authenticated)/(chat)/hooks/useAccessibleProjects";
import { useSelectedProject } from "@/screens/(authenticated)/(chat)/hooks/useSelectedProject";

export const ProjectPickerSheetConnected = forwardRef<BottomSheetRef>(
  function ProjectPickerSheetConnected(_props, ref) {
    const { projects } = useAccessibleProjects();
    const { selectedProjectId, setSelectedProjectId } = useSelectedProject();

    if (projects.length < 2) return null;

    return (
      <ProjectPickerSheet
        ref={ref}
        projects={projects}
        selectedProjectId={selectedProjectId ?? ""}
        onProjectSelect={(p) => {
          setSelectedProjectId(p.id);
          if (ref && typeof ref !== "function" && ref.current) {
            ref.current.dismiss();
          }
        }}
        onClose={() => {
          if (ref && typeof ref !== "function" && ref.current) {
            ref.current.dismiss();
          }
        }}
      />
    );
  },
);
```

```yaml
# apps/mobile/.maestro/project-picker.yaml
appId: sh.superset.mobile
---
- runFlow: subflows/login.yaml
- tapOn:
    text: "Chat"
- assertVisible:
    id: "sessions-list-screen"
- tapOn:
    id: "project-picker-chip"  # ProjectChipHeader chip — verify testID exists; add if not
- assertVisible:
    text: "Switch project"
- tapOn:
    id: "project-picker-row-{some-other-project-id}"
- assertNotVisible:
    text: "Switch project"
```

**Anti-pattern:** Passing the `BottomSheetRef` down to `setSelectedProjectId` via closure capture and calling `ref.current?.dismiss()` from inside the provider. The provider doesn't know about UI dismissal — the dismiss is a pure UI concern owned by this wrapper.

Another anti-pattern: re-rendering the sheet every time `selectedProjectId` changes by tracking the change in local state. The hook handles state; the sheet just consumes the current value.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-08 §B wireframe (lines 84-103)
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` line 17 + 30-32

**Interaction notes:**
- 44pt minimum hit target — ProjectPickerRow already satisfies this.
- Light + dark theme — sheet styling already correct via BottomSheet wrapper.
- Project-first scoping — the project picker IS the project-switch surface.
- Cache-first per AGENTS.md TanStack DB rule — sheet renders persisted rows even when isReady=false.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-5):
1. **RED**: Write failing test using `renderHook` + mocked hooks.
2. **GREEN**: Modify wrapper.
3. **REFACTOR**: Clean up.
4. Move to next AC.

After AC-5: write `.maestro/project-picker.yaml` and run on both platforms (AC-6).

Verify and patch ProjectPickerRow / ProjectPickerSheet testID forwarding if needed (small additions, safe to land within this task).

Commit after every AC passes. Use commit message `feat(mobile/screens): AC-N {short name} (MOB-NAV-008-V2)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Connected Tests | `bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Maestro iOS | `cd apps/mobile && maestro test .maestro/project-picker.yaml` | Exit 0 |
| Maestro Android | `cd apps/mobile && maestro test .maestro/project-picker.yaml --device <android>` | Exit 0 |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile UI connected wrapper + Maestro flow. Owned by react-native-ui-implementer.

---

## CODING STANDARDS

- `AGENTS.md` rule 9 (TanStack DB cache-first)
- `apps/mobile/AGENTS.md` (screen co-location)
- `plans/chat-mobile-plan/13-testing-strategy.md` (Maestro)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (ProjectPickerSheet organism is the base)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (N/A)

---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-006-V2 (useSelectedProject), MOB-INFRA-011 (useAccessibleProjects), MOB-NAV-005-INT (screen mount point for the wrapper)
- **Blocks:** None within Sprint 02

---

## NOTES

- This task is a small slice carved out of MOB-NAV-005-INT to keep the assembly task focused on screen composition. MOB-NAV-005-INT's initial wiring uses ProjectPickerSheet directly; after this task lands, MOB-NAV-005-INT swaps to `<ProjectPickerSheetConnected ref={projectPickerRef} />`.
- The `project-picker-chip` testID may need to be added to `ProjectChipHeader` (it's part of the `Pressable` on the chip). Verify and patch if needed; small addition with no behavior change.
- The `project-picker-row-{id}` testID may need to be forwarded through `ProjectPickerRow` from `ProjectPickerSheet`'s `.map(p => ...)`. Verify with the existing ProjectPickerRow component.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN useAccessibleProjects returns 3 projects and useSelectedProject returns selectedProjectId='p2' WHEN ProjectPickerSheetConnected mounted and ref.current.present() invoked THEN sheet renders 3 projects, row id='p2' shows selected, each row carries testID='project-picker-row-{id}'",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN sheet presented with current selection p2 WHEN user taps row p3 THEN setSelectedProjectId('p3') invoked once AND sheet's onDismiss fires and visible state becomes dismissed",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN useAccessibleProjects returns 1 project WHEN connected wrapper mounted THEN renders null AND ref.current.present() is safe to call (no-op)",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN useAccessibleProjects returns {projects:3 rows, isReady:false} WHEN ref.current.present() invoked THEN sheet renders with 3 projects (does not block on isReady)",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN project p1 has workspaceCount=4 sessionCount=12 WHEN sheet renders THEN row for p1 shows subtitle '4 workspaces · 12 sessions'",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN test account with ≥2 projects and Maestro installed WHEN .maestro/project-picker.yaml runs THEN exits 0 on iOS and Android",
      "verify": "cd apps/mobile && maestro test .maestro/project-picker.yaml"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "Connected wrapper renders ProjectPickerSheet with projects from useAccessibleProjects",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Selected project row carries selected=true based on useSelectedProject().selectedProjectId",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Each row carries testID='project-picker-row-{projectId}'",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Tapping a row invokes setSelectedProjectId(p.id) exactly once",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Tapping a row dismisses the sheet",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Wrapper returns null when accessibleProjects.length < 2",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Wrapper does NOT throw when ref.present() called while rendering null",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Sheet renders persisted projects when useAccessibleProjects isReady=false",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Row subtitle shows '4 workspaces · 12 sessions' for project with those counts",
      "maps_to_ac": "AC-5",
      "verify": "bun test apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/ProjectPickerSheetConnected/ProjectPickerSheetConnected.test.tsx"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Maestro project-picker.yaml exits 0 on iOS Simulator",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && maestro test .maestro/project-picker.yaml"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "Maestro project-picker.yaml exits 0 on Android Emulator",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && maestro test .maestro/project-picker.yaml --device <android>"
    }
  ]
}
-->
