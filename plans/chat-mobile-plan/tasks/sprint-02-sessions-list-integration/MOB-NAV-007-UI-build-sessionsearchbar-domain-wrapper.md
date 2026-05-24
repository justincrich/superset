# MOB-NAV-007-UI: Build SessionSearchBar domain wrapper

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 30 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** S

---

## BACKGROUND

The Sprint 01 `ProjectChipHeader` molecule (`apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx:112-132`) currently inlines the search row as a `View` + `Input` + leading `Search` icon + trailing `X` clear button. The integration assembly task `MOB-NAV-005-INT` needs a **named domain wrapper** the screen can mount directly so it can attach a debounced `useState` with a stable identity, swap placeholder copy by project name, and present a uniform component to Maestro flows (per UC-NAV-07 spec line 340).

The current state is "search row inlined inside ProjectChipHeader"; the desired state is a standalone `SessionSearchBar` component encapsulating the search Input + leading/trailing icons + project-scoped placeholder, which `ProjectChipHeader` and `MOB-NAV-005-INT`'s screen can both render. This task ALSO updates `ProjectChipHeader` to use the new `SessionSearchBar` rather than inlining the same JSX twice.

---

## CRITICAL CONSTRAINTS

- MUST place the new component at `apps/mobile/components/SessionSearchBar/SessionSearchBar.tsx` with co-located `index.ts` + `.stories.tsx` + `.test.tsx` (per AGENTS.md folder-per-component rule).
- MUST compose vendor `Input` from `@/components/ui/input` and `Icon` from `@/components/ui/icon` and lucide `Search` + `X` icons — never re-implement a TextInput primitive.
- MUST accept `value: string` (controlled), `onChangeText: (next: string) => void`, `onClear: () => void`, optional `placeholder: string`, and forward `testID="session-search-bar"` and `accessibilityLabel="Search sessions"` by default.
- MUST render the trailing `X` clear button (using `IconButton` from `@/components/IconButton`) ONLY when `value.length > 0`.
- MUST update `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx` row-2 search block to compose `<SessionSearchBar />` instead of inlining the Input + icons (single source of truth, per DRY rule of 2).
- NEVER add debounce logic inside this component — caller owns debouncing per UC-NAV-07 spec ("System debounces the filter computation by ~100ms"); the wrapper is purely controlled.
- NEVER add `expo-router` or data-layer imports — keep Storybook-safe.
- STRICTLY adhere to the 44pt minimum hit target for the trailing clear button (use `IconButton size="xs"` with `hitSlop` per the atom's `iconButtonGeometry` cva).

---

## SPECIFICATION

**Objective:** Create a stable `SessionSearchBar` domain wrapper that encapsulates the project-scoped search Input + leading `Search` icon + conditional trailing clear `X`, and refactor `ProjectChipHeader` to compose it (Rule of 2 — currently inlined in only one place, but two consumers will exist after MOB-NAV-005-INT lands).

**Success state:** `apps/mobile/components/SessionSearchBar/SessionSearchBar.tsx` exists and exports `SessionSearchBar`; a Storybook story renders empty + populated + cleared states across both themes; `ProjectChipHeader.tsx`'s row-2 search block composes `<SessionSearchBar />`; the integration assembly task (`MOB-NAV-005-INT`) can wire `useState<string>("")` directly to the bar.

---

## ACCEPTANCE CRITERIA

### AC-1: Component renders Input with project-scoped placeholder

**GIVEN** `SessionSearchBar` is mounted with `value=""`, `projectName="superset"`, and `onChangeText={mockHandler}`
**WHEN** the component renders
**THEN** the rendered `Input` shows placeholder `"Search superset sessions"` (when `placeholder` prop is unset), the leading `Search` lucide icon is visible, and the trailing clear button is NOT rendered (because `value.length === 0`).

**Verify:** `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx`

### AC-2: Trailing clear button appears when value is non-empty

**GIVEN** `SessionSearchBar` is mounted with `value="bug"`, `onChangeText={mockHandler}`, `onClear={mockClear}`
**WHEN** the component renders
**THEN** the trailing clear button (lucide `X` IconButton) IS visible AND tapping it invokes `mockClear` exactly once.

**Verify:** `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx`

### AC-3: Typing invokes onChangeText with new value

**GIVEN** `SessionSearchBar` is mounted with `value=""`, `onChangeText={mockHandler}`
**WHEN** the user types `"auth"` into the input (via `fireEvent.changeText`)
**THEN** `mockHandler` is called with `"auth"` exactly once.

**Verify:** `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx`

### AC-4: ProjectChipHeader composes SessionSearchBar instead of inlining

**GIVEN** the existing `ProjectChipHeader` molecule has been refactored
**WHEN** `bun test apps/mobile/components/ProjectChipHeader/ProjectChipHeader.test.tsx` (or visual Storybook navigation) is run
**THEN** the row-2 search block renders via the new `<SessionSearchBar />` import, the existing Storybook stories continue to pass without changes to story args, and there is exactly ONE source of truth for the search-bar JSX in the codebase.

**Verify:** `bun test apps/mobile/components/ProjectChipHeader/` AND manual Storybook navigation to confirm visual parity.

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | SessionSearchBar renders `Search ${projectName} sessions` placeholder when `placeholder` prop is unset | AC-1 | happy_path | `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx` |
| TC-2 | SessionSearchBar does NOT render the clear button when `value=""` | AC-1 | edge | `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx` |
| TC-3 | SessionSearchBar renders the clear button when `value.length > 0` | AC-2 | happy_path | `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx` |
| TC-4 | SessionSearchBar invokes `onClear` exactly once when clear button is tapped | AC-2 | happy_path | `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx` |
| TC-5 | SessionSearchBar invokes `onChangeText("auth")` when user types "auth" | AC-3 | happy_path | `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx` |
| TC-6 | ProjectChipHeader.tsx imports SessionSearchBar and renders zero local copies of `<Input value={searchValue} ...>` after refactor | AC-4 | edge | `bun test apps/mobile/components/ProjectChipHeader/ProjectChipHeader.test.tsx` |
| TC-7 | SessionSearchBar accepts a `placeholder` prop override and uses it instead of the project-scoped default | AC-1 | edge | `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx` | 112-132 | Existing inline search-row block to extract into the new wrapper |
| `apps/mobile/components/IconButton/IconButton.tsx` | 91-142 | IconButton API for the trailing clear `X` (size="xs" pattern) |
| `apps/mobile/components/AppliedFilterTag/AppliedFilterTag.tsx` | 75-86 | Existing pattern for using IconButton variant=ghost size=xs as a dismiss affordance |
| `plans/chat-mobile-plan/09-uc-nav.md` | 336-348 | UC-NAV-07 spec — project-scoped placeholder, ✕ clear, ~100ms client-side debounce (NOT in this component) |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 11 | SessionSearchBar declared as a domain wrapper |
| `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.stories.tsx` | 1-40 | Pattern for the new SessionSearchBar.stories.tsx |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/components/SessionSearchBar/SessionSearchBar.tsx` (NEW)
- `apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx` (NEW)
- `apps/mobile/components/SessionSearchBar/SessionSearchBar.stories.tsx` (NEW)
- `apps/mobile/components/SessionSearchBar/index.ts` (NEW)
- `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx` (MODIFY — replace row-2 search block with `<SessionSearchBar />`)

**WRITE-PROHIBITED:**
- `apps/mobile/components/ui/**` — vendor RNR primitives; never edit `input.tsx` directly
- `apps/mobile/components/IconButton/**` — atom is fixed; this task composes it
- `apps/mobile/global.css` — established ember tokens, do not modify
- `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx` — keep the organism unchanged; SessionsListScreen wires the bar separately in MOB-NAV-005-INT
- `packages/db/drizzle/**` — Drizzle-managed migrations, never hand-edit

---

## CODE PATTERN

**Reference:** Controlled-input domain wrapper — composes Input + leading icon + conditional trailing IconButton, exposing only the props the domain needs (no debounce, no state).

**Source:** `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx:112-132` — the JSX block being extracted; preserve the visual layout (rounded-md secondary bg, h-touch-min, gap spacing).

**Example:**
```tsx
// apps/mobile/components/SessionSearchBar/SessionSearchBar.tsx
import { Search, X } from "lucide-react-native";
import { View } from "react-native";
import { IconButton } from "@/components/IconButton";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type SessionSearchBarProps = {
  value: string;
  onChangeText: (next: string) => void;
  onClear: () => void;
  /** Default: `Search ${projectName} sessions` when `projectName` is set; falls back to `Search sessions`. */
  placeholder?: string;
  /** When provided, drives the default placeholder. */
  projectName?: string;
  testID?: string;
  accessibilityLabel?: string;
  className?: string;
};

/**
 * Sessions-list search input — domain wrapper composing vendor Input +
 * leading Search icon + conditional trailing clear X (IconButton).
 *
 * Controlled — caller owns `value`/`onChangeText`/`onClear`. Caller is
 * also responsible for debouncing the value into the downstream selector
 * per UC-NAV-07 (~100ms).
 */
export function SessionSearchBar({
  value,
  onChangeText,
  onClear,
  placeholder,
  projectName,
  testID = "session-search-bar",
  accessibilityLabel = "Search sessions",
  className,
}: SessionSearchBarProps) {
  const resolvedPlaceholder =
    placeholder ??
    (projectName ? `Search ${projectName} sessions` : "Search sessions");
  const showClear = value.length > 0;

  return (
    <View
      className={cn(
        "flex-1 flex-row items-center bg-secondary rounded-md px-2 min-h-touch-min",
        className,
      )}
    >
      <Icon as={Search} className="text-muted-foreground size-4 mr-1.5" />
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={resolvedPlaceholder}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        className="flex-1 border-0 bg-transparent px-0"
      />
      {showClear ? (
        <IconButton
          icon={X}
          accessibilityLabel="Clear search"
          variant="ghost"
          size="xs"
          onPress={onClear}
          testID="session-search-bar-clear"
        />
      ) : null}
    </View>
  );
}
```

**Anti-pattern:** Holding the search query in local component state (`useState`) inside `SessionSearchBar`. That would force the screen to use uncontrolled access patterns or duplicate state, and breaks the debounce contract (caller debounces, not the bar). The wrapper MUST be controlled.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` §A wireframe (search input layout in row 2 of the header)
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-07 (project-scoped placeholder, `✕` clear affordance, client-side filter; ~100ms debounce is caller's concern)
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (SessionSearchBar declared as a domain component)

**Interaction notes:**
- 44pt minimum hit target — `min-h-touch-min` Tailwind class drives container height; trailing clear IconButton uses size="xs" but `IconButton` adds `hitSlop={8}` for xs/sm variants to satisfy WCAG AA.
- Light + dark theme via `@variant` directive — `bg-secondary` and `text-muted-foreground` resolve from `apps/mobile/global.css` in both themes.
- Caller debounces (~100ms per UC-NAV-07) — wrapper is purely controlled; do NOT add internal debounce.
- The clear button conditionally renders — when absent, the search input takes the full row width.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-4):
1. **RED**: Write failing test in `SessionSearchBar.test.tsx`.
2. **GREEN**: Write minimum code in `SessionSearchBar.tsx`.
3. **REFACTOR**: Improve while keeping tests green.
4. Move to next AC.

After AC-3 passes, refactor `ProjectChipHeader.tsx` row-2 to compose `<SessionSearchBar />`, then verify existing `ProjectChipHeader` Storybook stories still render without args changes (AC-4).

Commit after every AC passes. Use commit message `feat(mobile/components): AC-N {short name} (MOB-NAV-007-UI)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| All Tests Pass | `bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx` | Exit 0 |
| ProjectChipHeader Tests Pass | `bun test apps/mobile/components/ProjectChipHeader/` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Storybook renders | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook` then navigate to `Components/SessionSearchBar` and `Molecules/Sessions/ProjectChipHeader` stories — toggle light/dark theme | Manual: search bar renders empty + populated + cleared states; ProjectChipHeader visually unchanged |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Pure React Native UI component-composition task — no data layer, no routing. Mobile component wrappers + Storybook stories + NativeWind theming fall within the react-native-ui-implementer's domain.

---

## CODING STANDARDS

- `AGENTS.md` (project structure: one folder per component, co-locate tests/stories; DRY Rule of 2)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (vendor `Input` from `components/ui/input.tsx` is the base; do not modify it)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (preserve ember theme tokens — do not touch `global.css`)

---

## DEPENDENCIES

- **Depends on:** None (Sprint 01 shipped Input atom, IconButton atom, ProjectChipHeader molecule)
- **Blocks:** MOB-NAV-005-INT (SessionsListScreen will mount `<SessionSearchBar />` and wire it to in-memory `searchQuery` state with ~100ms debounce)

---

## NOTES

- Wave 0 of Sprint 02 (alongside MOB-NAV-004-V2-UI and MOB-NAV-017-UI) — build first so the integration assembly task has every required component.
- Debouncing is the SCREEN's responsibility (per UC-NAV-07 spec line 348). Do not add `setTimeout` / `useDebounce` inside this component.
- The placeholder copy spec is "Search {projectName} sessions" per the wireframe; if `projectName` is unset, fall back to the generic "Search sessions" string so storybook fixtures without an org context still render.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN SessionSearchBar is mounted with value='', projectName='superset', onChangeText=mockHandler WHEN the component renders THEN the Input shows placeholder 'Search superset sessions', leading Search icon is visible, and trailing clear button is NOT rendered",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN SessionSearchBar is mounted with value='bug', onChangeText=mockHandler, onClear=mockClear WHEN the component renders THEN the trailing clear button IS visible AND tapping it invokes mockClear exactly once",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN SessionSearchBar is mounted with value='', onChangeText=mockHandler WHEN the user types 'auth' THEN mockHandler is called with 'auth' exactly once",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN the existing ProjectChipHeader has been refactored WHEN tests run THEN row-2 search renders via SessionSearchBar import, existing Storybook stories pass unchanged, and there is exactly ONE source of truth for the search-bar JSX",
      "verify": "bun test apps/mobile/components/ProjectChipHeader/"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "SessionSearchBar renders 'Search ${projectName} sessions' placeholder when placeholder prop is unset",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "SessionSearchBar does NOT render the clear button when value=''",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "SessionSearchBar renders the clear button when value.length > 0",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "SessionSearchBar invokes onClear exactly once when clear button is tapped",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "SessionSearchBar invokes onChangeText('auth') when user types 'auth'",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "ProjectChipHeader.tsx imports SessionSearchBar and renders zero local copies of <Input value={searchValue} ...> after refactor",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/components/ProjectChipHeader/ProjectChipHeader.test.tsx"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "SessionSearchBar accepts a placeholder prop override and uses it instead of the project-scoped default",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/SessionSearchBar/SessionSearchBar.test.tsx"
    }
  ]
}
-->
