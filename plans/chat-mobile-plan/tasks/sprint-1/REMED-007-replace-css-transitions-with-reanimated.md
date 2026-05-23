---
task_id: REMED-007
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: react-native-ui-implementer
estimate_minutes: 60
task_type: BUG_FIX
status: Backlog
priority: P1
effort: S
prd_refs: [TS-5, TS-6, ROADMAP cross-cutting note]
upstream_review: red-hat 2026-05-23 DG-7, R-4
---

# REMED-007 — Replace CSS `transition-transform` with Reanimated rotation (CollapsedBlock + PickerTrigger)

## Background

**Problem:** Two first-party components use CSS `transition-transform` +
`rotate-180` classes that are silently ignored in React Native. The
chevron rotation that's supposed to animate on toggle SNAPS instantly.

- `apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx:97`
  ```tsx
  className={cn("transition-transform", open ? "rotate-180" : "")}
  ```
- `apps/mobile/components/PickerTrigger/PickerTrigger.tsx:127-128`
  ```tsx
  className={cn("transition-transform", isOpen ? "rotate-180" : "rotate-0")}
  ```

The ROADMAP.md cross-cutting Tailwind→RN translation rule says
explicitly: `transition-* → Reanimated`. Both components violate it.

**Why it matters:** CollapsedBlock is one of the most-visible chat-tree
components (plan / reasoning / subagent blocks). PickerTrigger is on
every composer settings pill. Snap-rotation looks broken vs the desktop
equivalent and against the polished motion of other Reanimated components
in this codebase (PendingActionPill, ScrollBackButton).

**Current:** CSS transitions silently dropped; chevron snaps.

**Desired:** Reanimated `useDerivedValue` + `useAnimatedStyle` driving a
200ms ease-out rotation, matching the existing motion idiom in
`PendingActionPill.tsx` and `ScrollBackButton.tsx`.

## CRITICAL CONSTRAINTS

- **MUST** use `react-native-reanimated` (already a project dep — used in PendingActionPill, ScrollBackButton).
- **MUST** preserve the chevron Lucide icon component currently used (no swap to SVG-string).
- **MUST** keep the rotation animation at 200ms ease-out (matches existing precedent).
- **NEVER** add CSS `transition-*` or `animate-*` classes in RN code — the ROADMAP rule is unambiguous.
- **MUST** preserve accessibility — chevron's `accessibilityRole`/`accessibilityLabel` (if present) unchanged.

## SPECIFICATION

**Objective:** Replace CSS-transition-driven chevron rotation with Reanimated
in CollapsedBlock and PickerTrigger so the chevron rotates smoothly on
open/close toggle.

**Success state:** In Storybook (`Views/Chat/02-ChatView · Plan + Reasoning`
and `Views/Chat/02-ChatView · Thinking-level popover`), tapping the
collapsed block header or picker trigger causes the chevron to rotate
smoothly over 200ms, not snap instantly.

## ACCEPTANCE CRITERIA

### AC-1: CollapsedBlock uses Reanimated for chevron rotation
**Given** `apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx`,
**When** I grep for `transition-transform` and `react-native-reanimated`,
**Then** `transition-transform` is absent AND a Reanimated import + `useAnimatedStyle` driving rotation is present.

**Verify:** `grep "transition-transform" apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx` → empty; `grep "react-native-reanimated" apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx` → 1+ match

### AC-2: PickerTrigger uses Reanimated for chevron rotation
**Given** `apps/mobile/components/PickerTrigger/PickerTrigger.tsx`,
**When** I grep,
**Then** `transition-transform` is absent AND a Reanimated rotation is present.

**Verify:** `grep "transition-transform" apps/mobile/components/PickerTrigger/PickerTrigger.tsx` → empty; `grep "react-native-reanimated" apps/mobile/components/PickerTrigger/PickerTrigger.tsx` → 1+ match

### AC-3: rotation timing matches existing motion precedent
**Given** the Reanimated rotation,
**When** I inspect the duration,
**Then** it equals 200ms (matching `PendingActionPill.tsx` and `ScrollBackButton.tsx`).

**Verify:** `grep -E "withTiming.*200|duration: 200" apps/mobile/components/{CollapsedBlock,PickerTrigger}/*.tsx` → 2+ matches

### AC-4: chevron rotates 180° when open, 0° when closed
**Given** the animated style,
**When** I inspect the derivedValue logic,
**Then** rotation interpolates from `0deg` (closed) to `180deg` (open).

**Verify:** `grep -A 3 "rotate\|transform" apps/mobile/components/{CollapsedBlock,PickerTrigger}/*.tsx | grep -E "180|0deg"` → matches in both files

### AC-5: storybook stories render with rotation visible
**Given** the components,
**When** I open `Views/Chat/02-ChatView · Plan + Reasoning` and `Views/Chat/02-ChatView · Thinking-level popover` in Storybook,
**Then** tapping the chevron triggers a visible smooth rotation (not snap).

**Verify:** Manual on-device storybook check (cannot scriptedly verify motion smoothness)

### AC-6: typecheck + lint pass
**Given** the edits,
**When** I run typecheck + lint,
**Then** EXIT 0 on both.

**Verify:** `cd apps/mobile && bun run typecheck` + `cd /Users/justinrich/Projects/superset/.claude/worktrees/chat-mobile-sprint-1 && bun run lint apps/mobile/components/{CollapsedBlock,PickerTrigger}/` → EXIT 0

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | `transition-transform` absent in CollapsedBlock.tsx | AC-1 | grep, expect 0 matches |
| TC-2 | `react-native-reanimated` imported in CollapsedBlock.tsx | AC-1 | grep, expect 1+ |
| TC-3 | `transition-transform` absent in PickerTrigger.tsx | AC-2 | grep, expect 0 matches |
| TC-4 | `react-native-reanimated` imported in PickerTrigger.tsx | AC-2 | grep, expect 1+ |
| TC-5 | Both components use 200ms timing | AC-3 | grep withTiming/200 |
| TC-6 | Both components interpolate rotation 0°→180° | AC-4 | grep transform/rotate |
| TC-7 | Chevron rotates smoothly in Plan + Reasoning storybook | AC-5 | manual sim check |
| TC-8 | Chevron rotates smoothly in Thinking-level popover storybook | AC-5 | manual sim check |
| TC-9 | `bun run typecheck` exits 0 | AC-6 | bash exit code |
| TC-10 | `bun run lint` for both folders exits 0 | AC-6 | bash exit code |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx` | 80-110 | Current chevron block to refactor |
| `apps/mobile/components/PickerTrigger/PickerTrigger.tsx` | 120-140 | Current chevron block to refactor |
| `apps/mobile/components/PendingActionPill/PendingActionPill.tsx` | 90-120 | EXISTING Reanimated motion pattern — copy from here |
| `apps/mobile/components/ScrollBackButton/ScrollBackButton.tsx` | full | EXISTING Reanimated FadeIn/FadeOut pattern |
| `plans/chat-mobile-plan/ROADMAP.md` | cross-cutting notes | `transition-* → Reanimated` rule |

## GUARDRAILS

**WRITE-ALLOWED:**
- `apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx` (MODIFY)
- `apps/mobile/components/PickerTrigger/PickerTrigger.tsx` (MODIFY)

**WRITE-PROHIBITED:**
- Any consumer of these components (CollapsedBlock callers in ChatThread, PickerTrigger callers in ComposerSettingsButton) — no API changes, no prop additions.
- `apps/mobile/components/ui/` vendor primitives.
- Other components' motion implementations.

## CODE PATTERN

### Reference (existing Reanimated motion idiom)
**Source:** `apps/mobile/components/PendingActionPill/PendingActionPill.tsx:86-118`
```tsx
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const rotation = useSharedValue(open ? 180 : 0);

useEffect(() => {
  rotation.value = withTiming(open ? 180 : 0, { duration: 200 });
}, [open, rotation]);

const animatedStyle = useAnimatedStyle(
  () => ({ transform: [{ rotate: `${rotation.value}deg` }] }),
  [rotation]
);
```

### Target (in CollapsedBlock + PickerTrigger)
Replace the `<Icon as={ChevronDown} className={cn("transition-transform", open ? "rotate-180" : "")} />` line with:
```tsx
<Animated.View style={animatedStyle}>
  <Icon as={ChevronDown} />
</Animated.View>
```

### Anti-pattern
- `interpolate(rotation.value, [0, 1], [0, 180])` — overkill; direct `rotate: \`${rotation.value}deg\`` is cleaner.
- Using `withSpring` instead of `withTiming` — spring overshoot looks wrong on a chevron icon.
- Skipping `useSharedValue` and just animating className — RN ignores tailwind transitions.

## DESIGN

**References:**
- Red-hat review DG-7 + R-4
- ROADMAP cross-cutting Tailwind→RN rule
- `PendingActionPill.tsx` (motion precedent)
- `ScrollBackButton.tsx` (FadeIn/FadeOut precedent)

**Pattern source:** `apps/mobile/components/PendingActionPill/PendingActionPill.tsx:86-118`
**Anti-pattern:** Adding a layout animation prop (`layout={Layout.springify()}`) to the parent — runs the whole header through layout transitions, not what we want.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| No CSS transitions | `grep "transition-transform" apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx apps/mobile/components/PickerTrigger/PickerTrigger.tsx` | empty |
| Reanimated imports | `grep "react-native-reanimated" apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx apps/mobile/components/PickerTrigger/PickerTrigger.tsx` | 2 lines |
| 200ms timing | `grep -E "duration: 200\|withTiming.*200" apps/mobile/components/CollapsedBlock/CollapsedBlock.tsx apps/mobile/components/PickerTrigger/PickerTrigger.tsx` | 2+ matches |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |
| Lint | `bun run lint apps/mobile/components/CollapsedBlock/ apps/mobile/components/PickerTrigger/` | EXIT 0 |

## AGENT INSTRUCTIONS

1. READ PendingActionPill.tsx to internalize the existing Reanimated motion idiom.
2. RED — verify current code uses `transition-transform` (grep).
3. GREEN — refactor CollapsedBlock first:
   - Add Reanimated imports (Animated, useSharedValue, useAnimatedStyle, withTiming).
   - Wrap chevron `<Icon>` in `<Animated.View style={animatedStyle}>`.
   - Add `useSharedValue` initialized from `open` prop, drive with `withTiming(200ms)` on toggle via `useEffect`.
4. GREEN — repeat for PickerTrigger using `isOpen` prop.
5. REFACTOR — extract a shared `useRotation(open)` hook to `apps/mobile/lib/hooks/useRotation.ts` if both components end up with identical 8-line blocks. Otherwise inline is fine.
6. Verify all 10 TCs.

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** RN motion idiom + component refactor. The implementer already understands the codebase's Reanimated convention from PendingActionPill / ScrollBackButton.

## DEPENDENCIES

- **depends_on:** none
- **blocks:** none

## NOTES

Total LOC change: ~15-20 lines per component (add imports, sharedValue,
animatedStyle, wrap Icon). 60-min estimate covers reading the precedent
+ refactoring both components + verifying motion smoothness in storybook.

If the Optional `useRotation(open)` shared hook is extracted, it would
live at `apps/mobile/lib/hooks/useRotation.ts` and could be reused by
future toggle-affordances. Out of strict scope but a nice refactor if
time allows.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN CollapsedBlock.tsx WHEN I grep THEN transition-transform absent AND Reanimated present", "verify": "grep transition-transform → empty; grep react-native-reanimated → 1+"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN PickerTrigger.tsx WHEN I grep THEN transition-transform absent AND Reanimated present", "verify": "grep both files"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN Reanimated rotation WHEN I inspect duration THEN it equals 200ms matching existing precedent", "verify": "grep withTiming/200 in both"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN animated style WHEN I inspect derivedValue THEN rotation interpolates 0deg→180deg", "verify": "grep transform/rotate"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN components WHEN I open storybook views THEN tapping chevron triggers visible smooth rotation", "verify": "manual on-device check"},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN edits WHEN typecheck + lint run THEN EXIT 0", "verify": "bun run typecheck && bun run lint"},
    {"id": "TC-1", "type": "test_criterion", "description": "transition-transform absent in CollapsedBlock.tsx", "maps_to_ac": "AC-1", "verify": "grep 0 matches"},
    {"id": "TC-2", "type": "test_criterion", "description": "react-native-reanimated imported in CollapsedBlock.tsx", "maps_to_ac": "AC-1", "verify": "grep 1+"},
    {"id": "TC-3", "type": "test_criterion", "description": "transition-transform absent in PickerTrigger.tsx", "maps_to_ac": "AC-2", "verify": "grep 0"},
    {"id": "TC-4", "type": "test_criterion", "description": "react-native-reanimated imported in PickerTrigger.tsx", "maps_to_ac": "AC-2", "verify": "grep 1+"},
    {"id": "TC-5", "type": "test_criterion", "description": "Both components use 200ms timing", "maps_to_ac": "AC-3", "verify": "grep withTiming/200"},
    {"id": "TC-6", "type": "test_criterion", "description": "Both components interpolate rotation 0°→180°", "maps_to_ac": "AC-4", "verify": "grep transform/rotate"},
    {"id": "TC-7", "type": "test_criterion", "description": "Chevron rotates smoothly in Plan + Reasoning storybook", "maps_to_ac": "AC-5", "verify": "manual sim"},
    {"id": "TC-8", "type": "test_criterion", "description": "Chevron rotates smoothly in Thinking-level popover storybook", "maps_to_ac": "AC-5", "verify": "manual sim"},
    {"id": "TC-9", "type": "test_criterion", "description": "bun run typecheck exits 0", "maps_to_ac": "AC-6", "verify": "bash exit"},
    {"id": "TC-10", "type": "test_criterion", "description": "bun run lint exits 0 for both folders", "maps_to_ac": "AC-6", "verify": "bash exit"}
  ]
}
-->
