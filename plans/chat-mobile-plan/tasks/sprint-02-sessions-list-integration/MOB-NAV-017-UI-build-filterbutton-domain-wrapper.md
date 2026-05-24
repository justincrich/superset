# MOB-NAV-017-UI: Build FilterButton domain wrapper

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 30 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** S

---

## BACKGROUND

The Sprint 01 `ProjectChipHeader` molecule (`apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx:133-154`) currently inlines the ⚙ filter button as a `View` wrapping `IconButton` (icon=Settings) with a Badge overlay when `filterCount > 0`. The integration assembly task `MOB-NAV-005-INT` needs a **named domain wrapper** so:
1. The screen can pass `count` directly without thinking about IconButton variant/size/icon plumbing.
2. The Maestro flows can target `testID="filter-button"` and `testID="filter-badge"` (UC-NAV-08 spec line 373).
3. The dynamic `accessibilityLabel` (`Filter sessions — N active` when count ≥ 1) lives in one place.

Current state: filter ⚙ button inlined inside ProjectChipHeader; desired state: standalone `FilterButton` component that renders the ⚙ IconButton + conditional `·N` Badge with `count` hidden when 0, ProjectChipHeader composes it. The badge styling, position, and visibility rules are encapsulated in this wrapper so `MOB-NAV-017-V2` (the wiring task) only has to pass `count={activeFilters.workspaceIds.length + activeFilters.statuses.length}`.

---

## CRITICAL CONSTRAINTS

- MUST place the new component at `apps/mobile/components/FilterButton/FilterButton.tsx` with co-located `index.ts` + `.stories.tsx` + `.test.tsx` (per AGENTS.md folder-per-component rule).
- MUST compose `IconButton` from `@/components/IconButton` with `icon={Settings}` from `lucide-react-native` — never re-implement the IconButton geometry.
- MUST compose `Badge` from `@/components/ui/badge` for the count overlay — never hand-roll a badge.
- MUST accept `count: number`, `onPress: () => void`, optional `disabled: boolean`, and forward `testID="filter-button"` and `testID="filter-badge"` (badge gets its own testID for Maestro probing).
- MUST hide the badge entirely when `count <= 0` (do NOT render `·0`).
- MUST render the badge label as `·N` (literal dot + N — matches wireframe `⚙·2` per UC-NAV-08 spec line 113).
- MUST set dynamic `accessibilityLabel`: `"Filter sessions"` when count is 0, `"Filter sessions — N active"` when count ≥ 1.
- MUST update `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx` row-2 filter block to compose `<FilterButton />` instead of inlining the IconButton + Badge (Rule of 2 — second consumer will be `MOB-NAV-005-INT` if it mounts the bar standalone).
- NEVER hold `count` in local state — purely controlled.
- NEVER add `expo-router` or data-layer imports — Storybook-safe.
- STRICTLY adhere to the 44pt minimum hit target — use IconButton `size="md"` which renders at `h-touch-min w-touch-min` per `apps/mobile/components/IconButton/IconButton.tsx:21-35`.

---

## SPECIFICATION

**Objective:** Create a stable `FilterButton` domain wrapper that encapsulates the ⚙ IconButton + conditional `·N` Badge, with badge hidden when count is 0 and dynamic accessibility labels reflecting count.

**Success state:** `apps/mobile/components/FilterButton/FilterButton.tsx` exists and exports `FilterButton`; a Storybook story renders `count={0}`, `count={1}`, `count={2}`, and `count={9}` states across both themes; `ProjectChipHeader.tsx` row-2 composes `<FilterButton count={filterCount} onPress={onFilterPress} />`.

---

## ACCEPTANCE CRITERIA

### AC-1: Component renders icon-only button when count is 0

**GIVEN** `FilterButton` is mounted with `count={0}` and `onPress={mockHandler}`
**WHEN** the component renders
**THEN** the rendered `IconButton` shows the lucide `Settings` icon, NO Badge is rendered, `accessibilityLabel="Filter sessions"`, and `testID="filter-button"` is present on the button.

**Verify:** `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx`

### AC-2: Badge appears with `·N` label when count >= 1

**GIVEN** `FilterButton` is mounted with `count={3}` and `onPress={mockHandler}`
**WHEN** the component renders
**THEN** a Badge is rendered absolutely positioned over the top-right of the button with text `·3`, `testID="filter-badge"`, AND `accessibilityLabel` of the IconButton is `"Filter sessions — 3 active"`.

**Verify:** `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx`

### AC-3: onPress prop is forwarded to IconButton

**GIVEN** `FilterButton` is mounted with `onPress={mockHandler}` and `count={1}`
**WHEN** the user taps the button (via `fireEvent.press`)
**THEN** `mockHandler` is invoked exactly once with no arguments.

**Verify:** `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx`

### AC-4: ProjectChipHeader composes FilterButton instead of inlining

**GIVEN** the existing `ProjectChipHeader` molecule has been refactored
**WHEN** `bun test apps/mobile/components/ProjectChipHeader/` is run AND Storybook is launched
**THEN** the row-2 filter block renders via `<FilterButton count={filterCount} onPress={onFilterPress} />`, existing Storybook stories continue to pass without args changes, and there is ZERO inline `IconButton icon={Settings}` JSX remaining in `ProjectChipHeader.tsx`.

**Verify:** `bun test apps/mobile/components/ProjectChipHeader/` AND manual Storybook navigation.

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | FilterButton renders Settings icon when mounted with count=0 | AC-1 | happy_path | `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx` |
| TC-2 | FilterButton does NOT render a Badge when count=0 | AC-1 | edge | `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx` |
| TC-3 | FilterButton renders Badge with text "·N" when count=N for N>=1 | AC-2 | happy_path | `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx` |
| TC-4 | FilterButton accessibilityLabel is "Filter sessions" when count=0 | AC-1 | edge | `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx` |
| TC-5 | FilterButton accessibilityLabel is "Filter sessions — N active" when count=N for N>=1 | AC-2 | edge | `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx` |
| TC-6 | FilterButton invokes onPress exactly once when tapped | AC-3 | happy_path | `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx` |
| TC-7 | ProjectChipHeader.tsx contains zero inline `IconButton.*icon={Settings}` references after refactor | AC-4 | edge | `bun test apps/mobile/components/ProjectChipHeader/ProjectChipHeader.test.tsx` |
| TC-8 | FilterButton badge has testID="filter-badge" when count>=1 | AC-2 | edge | `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx` | 133-154 | Existing inline filter-button block (IconButton + Badge) to extract |
| `apps/mobile/components/IconButton/IconButton.tsx` | 91-142 | IconButton API (variant=ghost, size=md → 44pt) |
| `apps/mobile/components/ui/badge.tsx` | all | Vendor Badge primitive — use `variant="default"` for the count overlay |
| `plans/chat-mobile-plan/09-uc-nav.md` | 111-118 | UC-NAV-08 wireframe `⚙·2` badge visual + spec on count formula |
| `plans/chat-mobile-plan/09-uc-nav.md` | 358, 367 | UC-NAV-08 ACs requiring `·N` badge appears when `count >= 1`, hidden when 0 |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 12, 33-34 | FilterButton declared as domain wrapper + testID registry |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/components/FilterButton/FilterButton.tsx` (NEW)
- `apps/mobile/components/FilterButton/FilterButton.test.tsx` (NEW)
- `apps/mobile/components/FilterButton/FilterButton.stories.tsx` (NEW)
- `apps/mobile/components/FilterButton/index.ts` (NEW)
- `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx` (MODIFY — replace row-2 filter block with `<FilterButton />`)

**WRITE-PROHIBITED:**
- `apps/mobile/components/ui/**` — vendor RNR primitives; never edit `badge.tsx` directly
- `apps/mobile/components/IconButton/**` — atom is fixed; this task composes it
- `apps/mobile/global.css` — established ember tokens, do not modify
- `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx` — keep the organism unchanged
- `packages/db/drizzle/**` — Drizzle-managed migrations, never hand-edit

---

## CODE PATTERN

**Reference:** Controlled domain wrapper — composes IconButton + conditionally-rendered Badge with absolute positioning.

**Source:** `apps/mobile/components/ProjectChipHeader/ProjectChipHeader.tsx:133-154` — the JSX block being extracted (preserve the `absolute -top-0.5 -right-0.5` Badge positioning and `h-4 px-1 min-w-4` sizing).

**Example:**
```tsx
// apps/mobile/components/FilterButton/FilterButton.tsx
import { Settings } from "lucide-react-native";
import { View } from "react-native";
import { IconButton } from "@/components/IconButton";
import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";

export type FilterButtonProps = {
  count: number;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  className?: string;
};

/**
 * Sessions-list ⚙ filter button — domain wrapper composing IconButton
 * (Settings icon) + conditional `·N` Badge overlay (hidden when count is 0).
 *
 * Per UC-NAV-08: badge count = activeFilters.workspaceIds.length +
 * activeFilters.statuses.length. Wiring of the count value is owned by
 * MOB-NAV-017-V2; this wrapper just renders the visual.
 */
export function FilterButton({
  count,
  onPress,
  disabled,
  testID = "filter-button",
  className,
}: FilterButtonProps) {
  const showBadge = count > 0;
  const accessibilityLabel = showBadge
    ? `Filter sessions — ${count} active`
    : "Filter sessions";

  return (
    <View className={cn("relative", className)}>
      <IconButton
        icon={Settings}
        accessibilityLabel={accessibilityLabel}
        variant="ghost"
        size="md"
        onPress={onPress}
        disabled={disabled}
        testID={testID}
      />
      {showBadge ? (
        <View
          pointerEvents="none"
          className="absolute -top-0.5 -right-0.5"
          testID="filter-badge"
        >
          <Badge variant="default" className="h-4 px-1 min-w-4">
            <Text className="text-[10px] font-mono leading-3">·{count}</Text>
          </Badge>
        </View>
      ) : null}
    </View>
  );
}
```

**Anti-pattern:** Rendering the badge unconditionally with text `·{count}` and `count === 0` showing as `·0`. The UC-NAV-08 AC explicitly requires the badge to be HIDDEN when count is 0 (never showing `·0`). The conditional render must be at the JSX level, not via CSS opacity.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` §A + §C wireframe — `⚙` idle state vs `⚙·2` badge state
- `plans/chat-mobile-plan/09-uc-nav.md` UC-NAV-08 spec line 367 — badge hidden when count is 0
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (testID registry: `filter-button`, `filter-badge`)

**Interaction notes:**
- 44pt minimum hit target — IconButton size="md" = `h-touch-min w-touch-min` (44pt) per `apps/mobile/components/IconButton/IconButton.tsx:24`.
- Light + dark theme via `@variant` directive — Badge `variant="default"` resolves from `apps/mobile/global.css` tokens in both themes.
- Badge is `pointerEvents="none"` — taps on the badge fall through to the underlying IconButton so users always trigger `onPress`.
- The `·` glyph in `·N` is a literal middle-dot character (U+00B7), matching wireframe `⚙·2`.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-4):
1. **RED**: Write failing test in `FilterButton.test.tsx`.
2. **GREEN**: Write minimum code in `FilterButton.tsx`.
3. **REFACTOR**: Improve while keeping tests green.
4. Move to next AC.

After AC-3 passes, refactor `ProjectChipHeader.tsx` row-2 to compose `<FilterButton />`, then verify existing `ProjectChipHeader` Storybook stories still render unchanged (AC-4).

Commit after every AC passes. Use commit message `feat(mobile/components): AC-N {short name} (MOB-NAV-017-UI)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| All Tests Pass | `bun test apps/mobile/components/FilterButton/FilterButton.test.tsx` | Exit 0 |
| ProjectChipHeader Tests Pass | `bun test apps/mobile/components/ProjectChipHeader/` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Storybook renders | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook` then navigate to `Components/FilterButton` (count={0,1,2,9}) and `Molecules/Sessions/ProjectChipHeader` — toggle light/dark | Manual: badge hidden at 0; `·N` visible for N>=1; visual unchanged in ProjectChipHeader |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Pure React Native UI composition task — domain wrapper around two atoms (IconButton + Badge). No data layer, no routing. Falls within react-native-ui-implementer scope.

---

## CODING STANDARDS

- `AGENTS.md` (project structure: one folder per component; DRY Rule of 2)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (Badge from `components/ui/badge.tsx` is the base; do not modify it)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (preserve ember theme tokens — do not touch `global.css`)

---

## DEPENDENCIES

- **Depends on:** None (Sprint 01 shipped IconButton, Badge, ProjectChipHeader)
- **Blocks:** MOB-NAV-005-INT (SessionsListScreen will mount via ProjectChipHeader's `<FilterButton />` after refactor) and MOB-NAV-017-V2 (which wires the `count` prop from `activeFilters` state)

---

## NOTES

- Wave 0 of Sprint 02 (alongside MOB-NAV-004-V2-UI and MOB-NAV-007-UI) — build first so the integration assembly task has every required component.
- The wrapper does NOT compute the count itself — `MOB-NAV-017-V2` will wire `count={activeFilters.workspaceIds.length + activeFilters.statuses.length}` at the screen layer.
- The `·` middle-dot prefix in `·N` is a literal Unicode character matching the wireframe (not a generic "·"). Use the same character used by `ProjectChipHeader.tsx:148` (`·{filterCount}`).

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN FilterButton is mounted with count=0 and onPress=mockHandler WHEN the component renders THEN the IconButton shows the Settings icon, NO Badge is rendered, accessibilityLabel='Filter sessions', and testID='filter-button' is present",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN FilterButton is mounted with count=3 and onPress=mockHandler WHEN the component renders THEN a Badge is rendered absolutely positioned with text '·3', testID='filter-badge', AND accessibilityLabel is 'Filter sessions — 3 active'",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN FilterButton is mounted with onPress=mockHandler and count=1 WHEN the user taps the button THEN mockHandler is invoked exactly once",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN ProjectChipHeader is refactored WHEN tests run THEN row-2 filter renders via <FilterButton count=... onPress=... />, existing Storybook stories pass unchanged, and ZERO inline IconButton icon={Settings} JSX remains in ProjectChipHeader.tsx",
      "verify": "bun test apps/mobile/components/ProjectChipHeader/"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "FilterButton renders Settings icon when mounted with count=0",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "FilterButton does NOT render a Badge when count=0",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "FilterButton renders Badge with text '·N' when count=N for N>=1",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "FilterButton accessibilityLabel is 'Filter sessions' when count=0",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "FilterButton accessibilityLabel is 'Filter sessions — N active' when count=N for N>=1",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "FilterButton invokes onPress exactly once when tapped",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "ProjectChipHeader.tsx contains zero inline IconButton icon={Settings} references after refactor",
      "maps_to_ac": "AC-4",
      "verify": "bun test apps/mobile/components/ProjectChipHeader/ProjectChipHeader.test.tsx"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "FilterButton badge has testID='filter-badge' when count>=1",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/components/FilterButton/FilterButton.test.tsx"
    }
  ]
}
-->
