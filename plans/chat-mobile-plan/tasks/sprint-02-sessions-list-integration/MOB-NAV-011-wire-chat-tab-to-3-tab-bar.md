# MOB-NAV-011: Wire SessionsListScreen footer to 3-tab bar (Tasks, Chat, More)

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 60 min
**Type:** FEATURE
**Status:** Backlog
**Priority:** P0
**Effort:** S

---

## BACKGROUND

The mobile app's current authenticated tab bar (`apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx:9-13`) declares three TABS: `(home)`, `(tasks)`, and a synthesized `__menu__` (More). The `(home)` tab is a stub per the Sprint 02 PRD's "Bottom tab footer rationale" (UC-NAV-01 spec lines 253-255) — it points to placeholder workspace detail screens with no functionality.

Sprint 02's gate (step 1) explicitly requires the bottom navigation to show three tabs: **Tasks · Chat · More**. This task swaps the `(home)` tab for the new `(chat)` tab created in MOB-NAV-001, updating both `apps/mobile/app/(authenticated)/_layout.tsx` (TabList registration) AND `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` (the visible TabBarView config) to reflect the new ordering.

The `(home)` route folder itself is NOT deleted in Sprint 02 (the legacy workspace detail screens are still reachable via direct URLs) — only the tab-trigger reference is removed so the user no longer sees a Home tab in the footer.

Current state: 3 tabs `(home) / (tasks) / __menu__`. Desired state: 3 tabs `(chat) / (tasks) / __menu__` (More) with Chat as the leftmost real tab. Order per UC-NAV-01 wireframe `09-uc-nav.md:68`: "Tasks · Chat · More" — visually left-to-right `Tasks Chat More` per the canonical wireframe (note: the wireframe shows Tasks first, Chat second).

---

## CRITICAL CONSTRAINTS

- MUST modify `apps/mobile/app/(authenticated)/_layout.tsx` to add `<TabTrigger name="(chat)" href="/(chat)" />` and REMOVE the `<TabTrigger name="(home)" href="/(home)" />` from the TabList block (the TabList itself stays `display: "none"` because the custom TabBarView renders the visible UI).
- MUST modify `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` `TABS` array (line 9-13): replace `{ name: "(home)", icon: "house.fill", label: "Home" }` with `{ name: "(chat)", icon: "message.fill", label: "Chat" }`. Keep `(tasks)` first per the UC-NAV-01 wireframe layout (`Tasks Chat More`).
- MUST update `NAVIGABLE_TAB_NAMES` (line 15) to include `"(chat)"` instead of `"(home)"`.
- MUST update `activeTab` default from `"(home)"` to `"(tasks)"` (line 32) so the bar boots to the leftmost-real tab when no tab has focus yet — `useTabTrigger({ name: "(home)" })` becomes `useTabTrigger({ name: "(tasks)" })`.
- MUST NOT delete `apps/mobile/app/(authenticated)/(home)/**` — the legacy routes remain reachable via URL; only the tab-trigger is removed.
- MUST verify the iOS native SwiftUI TabBarView accepts `"message.fill"` SF Symbol (or fall back to a known-good symbol). If `"message.fill"` is unavailable, use `"bubble.fill"` or `"text.bubble.fill"`.
- MUST verify the Android equivalent renders correctly (the `TabBarView` component handles platform-specific icon mapping internally).
- MUST update the corresponding test (if any) at `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx` to assert the new TABS array.
- NEVER delete the `(home)` route folder in this task — it's out of scope. A future sprint will formally retire it.
- NEVER add a 4th tab — strict 3-tab footer per UC-NAV-01.
- STRICTLY adhere to the 44pt minimum hit target — the existing TabBarView (SwiftUI on iOS) honors this; do not modify the bar's geometry.

---

## SPECIFICATION

**Objective:** Replace the `(home)` tab in the authenticated tab bar with the new `(chat)` tab so the footer shows `Tasks · Chat · More`, matching the UC-NAV-01 wireframe.

**Success state:** Signing in on the mobile app shows a 3-tab bottom bar with tabs labeled `Tasks`, `Chat`, `More` (in that visual order), tapping `Chat` switches to the `(chat)` tab and renders the placeholder/full SessionsListScreen, and tapping `Tasks` returns to the existing tasks tab without error.

---

## ACCEPTANCE CRITERIA

### AC-1: TabList registration replaces (home) with (chat)

**GIVEN** the file `apps/mobile/app/(authenticated)/_layout.tsx`
**WHEN** the file is read
**THEN** it contains `<TabTrigger name="(chat)" href="/(chat)" />` AND `<TabTrigger name="(tasks)" href="/(tasks)" />` AND `<TabTrigger name="(more)" href="/(more)" />` AND it does NOT contain `<TabTrigger name="(home)" href="/(home)" />`.

**Verify:** `grep -c 'name="(chat)"' apps/mobile/app/(authenticated)/_layout.tsx` returns 1 AND `grep -c 'name="(home)"' apps/mobile/app/(authenticated)/_layout.tsx` returns 0.

### AC-2: AuthenticatedTabBar TABS array reflects new layout

**GIVEN** the file `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx`
**WHEN** the file is read
**THEN** the `TABS` constant array contains exactly: `{ name: "(tasks)", ..., label: "Tasks" }`, `{ name: "(chat)", ..., label: "Chat" }`, `{ name: "__menu__", ..., label: "More" }` AND `NAVIGABLE_TAB_NAMES` equals `["(tasks)", "(chat)"]` (order matches TABS minus the menu trigger).

**Verify:** `bun test apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx`

### AC-3: useTabTrigger default switches from (home) to (tasks)

**GIVEN** the file `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx`
**WHEN** the file is read
**THEN** the `useTabTrigger({ name: "(tasks)" })` call replaces the previous `useTabTrigger({ name: "(home)" })` AND the `activeTab` fallback default is `"(tasks)"`.

**Verify:** `grep -c 'useTabTrigger({ name: "(tasks)" })' apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` returns 1 AND `grep -c 'useTabTrigger({ name: "(home)" })' .../AuthenticatedTabBar.tsx` returns 0.

### AC-4: Tapping Chat tab navigates to (chat) and back to (tasks)

**GIVEN** the dev build is running and the user is signed in
**WHEN** the user taps the `Chat` tab in the bottom bar
**THEN** the screen transitions to the SessionsListScreen placeholder (from MOB-NAV-001), the bottom bar shows `Chat` as the active tab, AND tapping `Tasks` returns to the tasks list with no errors.

**Verify:** Manual: `cd apps/mobile && bun dev` → sign in → tap Chat → tap Tasks → confirm round-trip.

### AC-5: Maestro smoke flow asserts Chat tab visibility

**GIVEN** Maestro is installed (MOB-INFRA-003) and `subflows/login.yaml` exists
**WHEN** a new flow at `.maestro/sessions-tab-visible.yaml` runs (`runFlow: subflows/login.yaml` then `assertVisible: text: "Chat"`)
**THEN** the flow exits 0 on both iOS Simulator and Android Emulator.

**Verify:** `cd apps/mobile && maestro test .maestro/sessions-tab-visible.yaml`

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | _layout.tsx contains TabTrigger for (chat) | AC-1 | edge | `grep -c 'name="(chat)"' apps/mobile/app/(authenticated)/_layout.tsx` |
| TC-2 | _layout.tsx does NOT contain TabTrigger for (home) | AC-1 | edge | `grep -c 'name="(home)"' apps/mobile/app/(authenticated)/_layout.tsx` |
| TC-3 | TABS array contains entries for (tasks), (chat), and __menu__ in that order | AC-2 | happy_path | `bun test apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx` |
| TC-4 | NAVIGABLE_TAB_NAMES === ["(tasks)", "(chat)"] | AC-2 | edge | `bun test apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx` |
| TC-5 | useTabTrigger is called with name "(tasks)" | AC-3 | edge | `grep -c 'useTabTrigger({ name: "(tasks)" })' apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` |
| TC-6 | useTabTrigger is NOT called with name "(home)" | AC-3 | edge | `grep -c 'useTabTrigger({ name: "(home)" })' apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` |
| TC-7 | Manual: tapping Chat tab transitions to placeholder and tapping Tasks returns without errors | AC-4 | happy_path | Manual: `cd apps/mobile && bun dev` |
| TC-8 | Maestro flow sessions-tab-visible.yaml exits 0 on iOS Simulator | AC-5 | happy_path | `cd apps/mobile && maestro test .maestro/sessions-tab-visible.yaml` |
| TC-9 | Maestro flow sessions-tab-visible.yaml exits 0 on Android Emulator | AC-5 | edge | `cd apps/mobile && maestro test .maestro/sessions-tab-visible.yaml --device <android>` |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `apps/mobile/app/(authenticated)/_layout.tsx` | 1-22 | TabList registration to modify |
| `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` | 1-101 | TABS array, NAVIGABLE_TAB_NAMES, useTabTrigger usage |
| `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.stories.tsx` | (read) | Storybook pattern — update fixtures if they reference Home |
| `plans/chat-mobile-plan/09-uc-nav.md` | 67-70, 253-255 | UC-NAV-01 wireframe footer + Bottom tab footer rationale |
| `apps/mobile/.maestro/subflows/login.yaml` | (from MOB-INFRA-003) | Login sub-flow to compose with the new smoke flow |
| `packages/tab-bar/src/TabBarView.swift` (or .tsx for native module) | (browse) | If `message.fill` SF Symbol isn't available, swap for `bubble.fill` |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/app/(authenticated)/_layout.tsx` (MODIFY — swap home for chat in TabList)
- `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` (MODIFY — swap TABS entries + NAVIGABLE_TAB_NAMES + useTabTrigger)
- `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx` (MODIFY or NEW — co-located test)
- `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.stories.tsx` (MODIFY — if it references Home tab fixtures)
- `apps/mobile/.maestro/sessions-tab-visible.yaml` (NEW — smoke flow asserting Chat tab visibility)

**WRITE-PROHIBITED:**
- `apps/mobile/app/(authenticated)/(home)/**` — leave the route folder intact (out of scope to delete)
- `apps/mobile/app/(authenticated)/(chat)/**` — owned by MOB-NAV-001
- `apps/mobile/app/(authenticated)/(tasks)/**` — leave untouched
- `apps/mobile/app/(authenticated)/(more)/**` — leave untouched
- `packages/tab-bar/**` — vendor / first-party tab-bar package; only consume, don't modify
- `apps/mobile/global.css` — established ember tokens

---

## CODE PATTERN

**Reference:** TABS array refactor in `AuthenticatedTabBar.tsx` + corresponding `useTabTrigger` default update.

**Source:** `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx:9-32` — existing TABS / NAVIGABLE_TAB_NAMES / useTabTrigger configuration.

**Example (post-refactor):**
```ts
// apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx
const TABS: TabItem[] = [
  { name: "(tasks)", icon: "checkmark.square.fill", label: "Tasks" },
  { name: "(chat)", icon: "message.fill", label: "Chat" },
  { name: "__menu__", icon: "ellipsis", label: "More", isMenuTrigger: true },
];

const NAVIGABLE_TAB_NAMES = ["(tasks)", "(chat)"];

// inside AuthenticatedTabBar():
const { switchTab, getTrigger } = useTabTrigger({ name: "(tasks)" });
// ...
const activeTab =
  NAVIGABLE_TAB_NAMES.find((name) => getTrigger(name)?.isFocused) ?? "(tasks)";
```

```tsx
// apps/mobile/app/(authenticated)/_layout.tsx
<TabList style={{ display: "none" }}>
  <TabTrigger name="(tasks)" href="/(tasks)" />
  <TabTrigger name="(chat)" href="/(chat)" />
  <TabTrigger name="(more)" href="/(more)" />
</TabList>
```

```yaml
# apps/mobile/.maestro/sessions-tab-visible.yaml
appId: sh.superset.mobile
---
- runFlow: subflows/login.yaml
- assertVisible:
    text: "Chat"
- tapOn:
    text: "Chat"
- assertVisible:
    id: "sessions-list-screen"
```

**Anti-pattern:** Renaming the `(home)` route folder to `(chat)`. The `(home)` route group hosts legacy workspace detail screens that some other parts of the app may still link to. Adding `(chat)` as a NEW group preserves those URLs while introducing the new surface.

Another anti-pattern: Using `name: "Home"` with a "Chat" label — Maestro and SwiftUI both rely on the `name` field as a stable identifier; the route segment is what `switchTab(...)` toggles.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/09-uc-nav.md` §A wireframe footer (`Tasks · Chat · More`)
- `plans/chat-mobile-plan/09-uc-nav.md` "Bottom tab footer rationale" (lines 253-255)
- `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` (existing pattern)

**Interaction notes:**
- 44pt hit target — TabBarView native SwiftUI tab bar already meets this. No change to bar geometry.
- Light + dark theme — TabBarView handles theme via its own SwiftUI lifecycle.
- Project-first scoping — the Chat tab routes to the `(chat)` group which mounts `SelectedProjectProvider` (per MOB-NAV-001), so project-first scoping is preserved.
- Cache-first per AGENTS.md TanStack DB rule — applies to the descendant SessionsListScreen, not the tab bar.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-3):
1. **RED**: Write/update test asserting the new structure.
2. **GREEN**: Modify source.
3. **REFACTOR**: Improve.
4. Move to next AC.

After AC-3: manually test (AC-4) by running the dev build and exercising the tab switch. AFTER manual test passes, write `.maestro/sessions-tab-visible.yaml` and run it on iOS + Android (AC-5).

Commit after every AC passes. Use commit message `feat(mobile/app): AC-N {short name} (MOB-NAV-011)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| TabBar Tests Pass | `bun test apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx` | Exit 0 |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Storybook (TabBar) renders | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun storybook` → AuthenticatedTabBar story | Manual: shows Tasks, Chat, More tabs |
| Manual nav smoke | `cd apps/mobile && bun dev` → sign in → tap Chat → tap Tasks | No errors; round-trip works |
| Maestro iOS | `cd apps/mobile && maestro test .maestro/sessions-tab-visible.yaml` | Exit 0 |
| Maestro Android | `cd apps/mobile && maestro test .maestro/sessions-tab-visible.yaml --device <android>` | Exit 0 |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Mobile-app tab bar configuration + Maestro flow authoring. Owned by react-native-ui-implementer per the mobile AGENTS.md and `13-testing-strategy.md`.

---

## CODING STANDARDS

- `AGENTS.md` (project structure rules)
- `apps/mobile/AGENTS.md` (route ↔ screen separation)
- `plans/chat-mobile-plan/13-testing-strategy.md` (Maestro YAML conventions)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (TabBarView is the base; don't modify the native module)

---

## DEPENDENCIES

- **Depends on:** MOB-NAV-001 (the `(chat)` route group must exist for the TabTrigger to point at it)
- **Blocks:** MOB-NAV-005-INT (the assembly task assumes navigation via the tab bar — but MOB-NAV-005-INT can still be tested via direct URL push if this lands later in the sprint)

---

## NOTES

- The `(home)` folder lives on at `apps/mobile/app/(authenticated)/(home)/` and contains workspaces stub screens. A future sprint can formally retire or repurpose it — out of scope for Sprint 02.
- Some Storybook stories or test fixtures may reference the Home tab label. Sweep for `"Home"` literal usages in the tab-bar tests/stories and update to `"Chat"` as needed (Boy Scout rule — don't ship lingering references to a removed tab).
- The visual order in the bar is `Tasks · Chat · More` per the wireframe (`09-uc-nav.md:68-70`). Verify the SwiftUI TabBarView renders them in TABS-array order so this ordering survives.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN _layout.tsx WHEN read THEN contains TabTriggers for (chat), (tasks), (more) and does NOT contain (home)",
      "verify": "grep -c 'name=\"(chat)\"' apps/mobile/app/(authenticated)/_layout.tsx"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN AuthenticatedTabBar.tsx WHEN read THEN TABS array contains (tasks),(chat),__menu__ entries in that order and NAVIGABLE_TAB_NAMES === ['(tasks)','(chat)']",
      "verify": "bun test apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN AuthenticatedTabBar.tsx WHEN read THEN useTabTrigger({name:'(tasks)'}) replaces useTabTrigger({name:'(home)'}) and activeTab fallback default is '(tasks)'",
      "verify": "grep -c 'useTabTrigger({ name: \"(tasks)\" })' apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN dev build with user signed in WHEN tapping Chat tab THEN transitions to SessionsListScreen placeholder, bar shows Chat active, tapping Tasks returns without error",
      "verify": "Manual: cd apps/mobile && bun dev"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN Maestro installed and login sub-flow exists WHEN sessions-tab-visible.yaml runs THEN exits 0 on iOS and Android",
      "verify": "cd apps/mobile && maestro test .maestro/sessions-tab-visible.yaml"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "_layout.tsx contains TabTrigger for (chat)",
      "maps_to_ac": "AC-1",
      "verify": "grep -c 'name=\"(chat)\"' apps/mobile/app/(authenticated)/_layout.tsx"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "_layout.tsx does NOT contain TabTrigger for (home)",
      "maps_to_ac": "AC-1",
      "verify": "grep -c 'name=\"(home)\"' apps/mobile/app/(authenticated)/_layout.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "TABS array contains entries for (tasks), (chat), and __menu__ in that order",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "NAVIGABLE_TAB_NAMES === ['(tasks)', '(chat)']",
      "maps_to_ac": "AC-2",
      "verify": "bun test apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.test.tsx"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "useTabTrigger is called with name '(tasks)'",
      "maps_to_ac": "AC-3",
      "verify": "grep -c 'useTabTrigger({ name: \"(tasks)\" })' apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "useTabTrigger is NOT called with name '(home)'",
      "maps_to_ac": "AC-3",
      "verify": "grep -c 'useTabTrigger({ name: \"(home)\" })' apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Manual: tapping Chat tab transitions to placeholder and tapping Tasks returns without errors",
      "maps_to_ac": "AC-4",
      "verify": "Manual: cd apps/mobile && bun dev"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Maestro flow sessions-tab-visible.yaml exits 0 on iOS Simulator",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && maestro test .maestro/sessions-tab-visible.yaml"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Maestro flow sessions-tab-visible.yaml exits 0 on Android Emulator",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && maestro test .maestro/sessions-tab-visible.yaml --device <android>"
    }
  ]
}
-->
