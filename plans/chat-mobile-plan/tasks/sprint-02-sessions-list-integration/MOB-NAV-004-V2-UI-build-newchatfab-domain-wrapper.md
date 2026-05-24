# MOB-NAV-004-V2-UI: Build NewChatFab domain wrapper

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 30 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** S

---

## BACKGROUND

Sprint 01 shipped the generic `FabBase` atom (3 variants × 2 sizes, supports `liveRing`, `loading`, `label`, etc.) and the `SessionsList` organism currently inlines `<FabBase icon={Plus} ... />` directly. The sessions-list integration assembly task (`MOB-NAV-005-INT`) needs a **named domain wrapper** with stable `testID="new-chat-fab"` (UC-NAV-01 spec line 278 + UC-NAV-04) so Maestro flows can locate the new-chat affordance reliably without coupling to the atom's API. The current state is "inline atom usage"; the desired state is "stable `NewChatFab` component encapsulating the project's 56pt accent FAB + lucide `+` icon + `new-chat-fab` testID".

This task creates the wrapper only — it does NOT wire onPress to the workspace picker (that's `MOB-NAV-009-INT` in Sprint 04). The wrapper accepts an `onPress` prop and is mounted by `MOB-NAV-005-INT` with a `() => {}` placeholder for Sprint 02.

---

## CRITICAL CONSTRAINTS

- MUST place the new component at `apps/mobile/components/NewChatFab/NewChatFab.tsx` with co-located `index.ts` + `.stories.tsx` (per AGENTS.md folder-per-component rule).
- MUST compose `FabBase` from `@/components/FabBase` — never re-implement the underlying primitive.
- MUST default to `variant="accent"`, `size="md"` (56pt per `apps/mobile/components/FabBase/FabBase.tsx:42-43` md=h-14 = 56pt), `icon={Plus}` from `lucide-react-native`.
- MUST forward `testID="new-chat-fab"` by default (overridable via prop) — referenced by Maestro flows per UC-NAV-01 spec.
- MUST set `accessibilityLabel="New chat"` by default (overridable) — WCAG screen-reader requirement.
- NEVER add `expo-router` imports, `useTheme`, or any data-layer dependency — keep this component pure props-driven so Storybook can render it standalone.
- NEVER reach into `FabBase`'s internal styling or re-export its `liveRing`/`loading`/`label` props at the wrapper layer — keep the wrapper minimal (icon + variant + size are fixed; only `onPress`, `disabled`, `testID`, `accessibilityLabel` are exposed).
- STRICTLY adhere to the 56pt FAB size (`size="md"`) — exceeds the 44pt WCAG AA touch-target requirement.

---

## SPECIFICATION

**Objective:** Create a stable `NewChatFab` domain wrapper that composes `FabBase` with the project-specific `+` icon, 56pt accent variant, `new-chat-fab` testID, and "New chat" accessibility label.

**Success state:** `apps/mobile/components/NewChatFab/NewChatFab.tsx` exists and exports a `NewChatFab` function component; a Storybook story (`NewChatFab.stories.tsx`) renders the FAB in both light and dark themes; the barrel `index.ts` re-exports the component and its props type; the integration assembly task (`MOB-NAV-005-INT`) can import via `import { NewChatFab } from "@/components/NewChatFab"`.

---

## ACCEPTANCE CRITERIA

### AC-1: Component renders FabBase with project defaults

**GIVEN** the `NewChatFab` component is mounted with no props beyond required `onPress`
**WHEN** the component renders to a React Native tree
**THEN** the rendered `FabBase` carries `variant="accent"`, `size="md"`, `icon={Plus}` from `lucide-react-native`, `accessibilityLabel="New chat"`, and `testID="new-chat-fab"`.

**Verify:** `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx`

### AC-2: onPress prop is forwarded to FabBase

**GIVEN** the `NewChatFab` component is mounted with `onPress={mockHandler}`
**WHEN** the user taps the FAB (or `fireEvent.press` is invoked in test)
**THEN** `mockHandler` is invoked exactly once with no arguments.

**Verify:** `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx`

### AC-3: disabled prop suppresses onPress

**GIVEN** the `NewChatFab` component is mounted with `disabled={true}` and `onPress={mockHandler}`
**WHEN** the user attempts to tap the FAB
**THEN** `mockHandler` is NOT invoked and the FAB renders at reduced opacity per `FabBase`'s built-in `disabled` styling.

**Verify:** `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx`

### AC-4: Storybook story renders in both themes

**GIVEN** Storybook is launched with `EXPO_PUBLIC_STORYBOOK=true`
**WHEN** the reviewer navigates to `Components/NewChatFab` story
**THEN** the FAB renders with the lucide `+` icon at 56pt size on both light and dark themes without errors.

**Verify:** Manual: `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook` then navigate to `Components/NewChatFab` story and toggle theme.

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | NewChatFab renders FabBase with `testID="new-chat-fab"` when mounted with default props | AC-1 | happy_path | `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx` |
| TC-2 | NewChatFab forwards `onPress` to underlying Pressable when tapped | AC-2 | happy_path | `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx` |
| TC-3 | NewChatFab does NOT invoke `onPress` when `disabled={true}` and tapped | AC-3 | edge | `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx` |
| TC-4 | NewChatFab renders Plus icon from `lucide-react-native` (not a different icon) when mounted | AC-1 | edge | `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx` |
| TC-5 | NewChatFab renders accessibilityLabel="New chat" when no override is provided | AC-1 | edge | `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx` |
| TC-6 | NewChatFab story renders without throwing in Storybook when EXPO_PUBLIC_STORYBOOK=true | AC-4 | happy_path | Manual: storybook navigation |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/components/FabBase/FabBase.tsx` | 1-213 | The atom being composed — note `variant`, `size`, `icon`, `accessibilityLabel` props; default `accent` + `md` |
| `apps/mobile/components/FabBase/FabBase.stories.tsx` | 1-40 | Storybook pattern to mirror for `NewChatFab.stories.tsx` |
| `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx` | 144-161 | Current inline `<FabBase icon={Plus} ... />` usage that will be replaced by `<NewChatFab ... />` in MOB-NAV-005-INT |
| `plans/chat-mobile-plan/09-uc-nav.md` | 269, 278 | UC-NAV-01 ACs requiring `testID="new-chat-fab"` and floating "+" anchored bottom-right |
| `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` | 15, 42 | NewChatFab co-location convention + testID registry |
| `apps/mobile/AGENTS.md` | 1-80 | Mobile co-location rule: `components/<Name>/<Name>.tsx` + `index.ts` |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/components/NewChatFab/NewChatFab.tsx` (NEW)
- `apps/mobile/components/NewChatFab/NewChatFab.test.tsx` (NEW)
- `apps/mobile/components/NewChatFab/NewChatFab.stories.tsx` (NEW)
- `apps/mobile/components/NewChatFab/index.ts` (NEW)

**WRITE-PROHIBITED:**
- `apps/mobile/components/ui/**` — vendor RNR primitives, customize via tokens not local edits (per memory: vendor libraries as base, style overrides only)
- `apps/mobile/components/FabBase/**` — atom is fixed; this task only wraps it
- `apps/mobile/global.css` — established ember tokens, do not modify
- `apps/mobile/screens/sessions-list/components/SessionsList/SessionsList.tsx` — the SessionsList currently inlines FabBase; replacing the inline usage is `MOB-NAV-005-INT`'s job, not this task
- `packages/db/drizzle/**` — Drizzle-managed migrations, never hand-edit

---

## CODE PATTERN

**Reference:** Minimal domain wrapper around an atom — composes the atom and locks down domain-specific defaults (icon, variant, size, accessibilityLabel, testID).

**Source:** `apps/mobile/components/FabBase/FabBase.tsx:94-213` — atom signature and default behaviors to mirror in the wrapper.

**Example:**
```tsx
// apps/mobile/components/NewChatFab/NewChatFab.tsx
import { Plus } from "lucide-react-native";
import type { PressableProps } from "react-native";
import { FabBase } from "@/components/FabBase";

export type NewChatFabProps = Pick<PressableProps, "onPress" | "disabled"> & {
  /** Default: `new-chat-fab` — overridable for nested-route variants. */
  testID?: string;
  /** Default: `New chat` — overridable for localization. */
  accessibilityLabel?: string;
};

/**
 * Sessions-list `+` FAB — domain wrapper around FabBase locking in the
 * 56pt accent variant + lucide Plus icon + UC-NAV-01 testID.
 *
 * Caller is responsible for placement (typically absolute positioning above
 * the bottom tab bar safe-area inset).
 */
export function NewChatFab({
  onPress,
  disabled,
  testID = "new-chat-fab",
  accessibilityLabel = "New chat",
}: NewChatFabProps) {
  return (
    <FabBase
      icon={Plus}
      variant="accent"
      size="md"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      onPress={onPress}
      disabled={disabled}
    />
  );
}
```

**Anti-pattern:** Re-implementing the Pressable + shadow + icon stack instead of composing `FabBase`. This duplicates the elevation/disabled-opacity styling already in the atom and breaks if the design token shifts. The wrapper exists ONLY to lock down domain defaults — its body should fit on one screen.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` §A (canonical sessions-list wireframe — FAB anchored bottom-right above the tab bar)
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` §UI Infrastructure (NewChatFab listed as a domain wrapper under `SessionsListScreen/components/`)
- `apps/mobile/components/FabBase/FabBase.stories.tsx` (existing Storybook pattern to mirror)

**Interaction notes:**
- 56pt FAB diameter (size="md" → h-14 → 56pt) exceeds the 44pt WCAG AA + iOS HIG minimum hit target.
- Light + dark theme via `@variant` directive — FabBase's `bg-primary` token resolves correctly in both themes from `apps/mobile/global.css`.
- Caller positions the FAB absolutely (typically `position: absolute; right: 16; bottom: insets.bottom + 16`) — wrapper does NOT impose layout.
- No data-layer dependency: the wrapper is pure props-driven (Storybook-safe).

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-4):
1. **RED**: Write failing test that proves AC-N's THEN clause in `NewChatFab.test.tsx`.
2. **GREEN**: Write minimum code in `NewChatFab.tsx` to make the test pass.
3. **REFACTOR**: Improve while keeping tests green.
4. Move to next AC.

After AC-4: Create the Storybook story (`NewChatFab.stories.tsx`) mirroring `apps/mobile/components/FabBase/FabBase.stories.tsx` shape, then manually verify in `bun storybook`.

Commit after every AC passes. Use commit message `feat(mobile/components): AC-N {short name} (MOB-NAV-004-V2-UI)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| All Tests Pass | `bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Storybook renders | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook` then navigate to `Components/NewChatFab` story and toggle light/dark theme | Manual: FAB renders 56pt accent with Plus icon in both themes |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Pure React Native UI atom-composition task — no data layer, no routing. Falls squarely within the react-native-ui-implementer's domain (mobile components, Storybook stories, NativeWind).

---

## CODING STANDARDS

- `AGENTS.md` (project structure: one folder per component, co-locate tests/stories under `apps/mobile/components/<Name>/`)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (vendor libraries as base; style via tokens only — FabBase atom is the base here)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (preserve ember theme tokens — do not touch `global.css`)

---

## DEPENDENCIES

- **Depends on:** None (Sprint 01 shipped `FabBase` atom; no other Sprint 02 tasks block this)
- **Blocks:** MOB-NAV-005-INT (SessionsListScreen assembly will swap inline `<FabBase>` for `<NewChatFab>`)

---

## NOTES

- Wave 0 of Sprint 02 (alongside MOB-NAV-007-UI and MOB-NAV-017-UI) — build first so the integration assembly task has every required component.
- Wiring `onPress` to the workspace picker (UC-NAV-04) is explicitly deferred to Sprint 04 (`MOB-NAV-009-INT`). For Sprint 02, MOB-NAV-005-INT will mount this with `onPress={() => {}}`.
- The 56pt size (`size="md"` = `h-14` = 56px) is intentional and matches UC-NAV §A wireframe.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN NewChatFab is mounted with no props beyond required onPress WHEN the component renders THEN the rendered FabBase carries variant=accent, size=md, icon=Plus, accessibilityLabel='New chat', and testID='new-chat-fab'",
      "verify": "bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN NewChatFab is mounted with onPress=mockHandler WHEN the user taps the FAB THEN mockHandler is invoked exactly once with no arguments",
      "verify": "bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN NewChatFab is mounted with disabled=true and onPress=mockHandler WHEN the user attempts to tap the FAB THEN mockHandler is NOT invoked and the FAB renders at reduced opacity",
      "verify": "bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN Storybook is launched with EXPO_PUBLIC_STORYBOOK=true WHEN the reviewer navigates to Components/NewChatFab story THEN the FAB renders with lucide + icon at 56pt size on both light and dark themes without errors",
      "verify": "Manual: cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "NewChatFab renders FabBase with testID='new-chat-fab' when mounted with default props",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "NewChatFab forwards onPress to underlying Pressable when tapped",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "NewChatFab does NOT invoke onPress when disabled=true and tapped",
      "maps_to_ac": "AC-3",
      "verify": "bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "NewChatFab renders Plus icon from lucide-react-native when mounted",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "NewChatFab renders accessibilityLabel='New chat' when no override is provided",
      "maps_to_ac": "AC-1",
      "verify": "bun test apps/mobile/components/NewChatFab/NewChatFab.test.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "NewChatFab story renders without throwing in Storybook when EXPO_PUBLIC_STORYBOOK=true",
      "maps_to_ac": "AC-4",
      "verify": "Manual: cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook"
    }
  ]
}
-->
