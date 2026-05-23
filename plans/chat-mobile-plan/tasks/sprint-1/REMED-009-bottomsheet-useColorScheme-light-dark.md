---
task_id: REMED-009
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: react-native-ui-implementer
estimate_minutes: 60
task_type: BUG_FIX
status: Backlog
priority: P0
effort: S
prd_refs: [TS-9]
upstream_review: red-hat 2026-05-23 F-1, F-2, DG-6
---

# REMED-009 — BottomSheet + AskUserSheet `useColorScheme` pattern for light/dark hex values

## Background

**Problem:** Two components hardcode dark-only hex values in places where
`@gorhom/bottom-sheet` vendor primitives don't accept `className`:

1. **`apps/mobile/components/BottomSheet/BottomSheet.tsx:74,90`** — passes
   inline `style={{ backgroundColor: "#1a1716" }}` to `BottomSheetHandle`
   and `backgroundStyle={{ backgroundColor: "#1a1716" }}` to
   `BottomSheetModal`. In light mode, the sheet renders near-black on a
   white surface.

2. **`apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx:124-128`** —
   passes inline `style={{ backgroundColor: "#201e1c", color: "#f3eee9" }}`
   + `placeholderTextColor="#ada6a3"` to `BottomSheetTextInput`. Light mode
   shows a dark rectangle on a white sheet.

Both are TS-9 light-mode blockers per the red-hat review.

**Why it matters:** TS-9 explicitly requires both themes work for every
component. The current state means BottomSheet — the shared organism for
ask-user, session overflow, project-picker, new-chat-picker — is
permanently dark-themed regardless of system theme.

**Current:** Hardcoded dark hex values.

**Desired:** Each hardcoded hex resolves via `useColorScheme()` (RN's
built-in hook) to the correct light or dark token value. Same pattern
already used in `apps/mobile/components/ScrollFade/ScrollFade.tsx:11-30`.

## CRITICAL CONSTRAINTS

- **MUST** use RN's built-in `useColorScheme()` from `react-native` — do NOT import THEME from `lib/theme.ts` (expo-router prep crash).
- **MUST** mirror the exact token HSL→hex values from `apps/mobile/global.css` — do NOT invent intermediate colors.
- **MUST** preserve the existing `BottomSheetTextInput` styling structure (gorhom-vendor mandates inline `style`).
- **NEVER** edit `apps/mobile/components/ui/badge.tsx` or any vendor primitive.
- **MUST** add a code comment near the hex-resolution explaining WHY (gorhom no-className constraint + theme.ts prep-crash constraint), referencing the ScrollFade precedent.

## SPECIFICATION

**Objective:** Make BottomSheet (handle + surface) and AskUserSheet
(BottomSheetTextInput surface, text color, placeholder color) read the
correct hex values from light or dark theme based on system colorScheme.

**Success state:** Reviewer toggles light theme in Storybook → bottom
sheet handle + surface render with light tokens (white/cream surfaces,
dark text). Toggle dark → renders with dark tokens. AskUserSheet text
input behaves the same.

## ACCEPTANCE CRITERIA

### AC-1: BottomSheet uses useColorScheme for handle + backgroundStyle
**Given** `apps/mobile/components/BottomSheet/BottomSheet.tsx`,
**When** I grep for `useColorScheme`,
**Then** the hook is imported and called, AND `backgroundStyle.backgroundColor` + `BottomSheetHandle.style.backgroundColor` resolve via `colorScheme === "dark" ? ... : ...`.

**Verify:** `grep "useColorScheme" apps/mobile/components/BottomSheet/BottomSheet.tsx` → 2+ matches (import + call)

### AC-2: AskUserSheet BottomSheetTextInput uses useColorScheme
**Given** `apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx`,
**When** I grep,
**Then** `useColorScheme` is imported and called, AND the three hardcoded values (`backgroundColor`, `color`, `placeholderTextColor`) are resolved via colorScheme.

**Verify:** `grep "useColorScheme" apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx` → 2+ matches

### AC-3: hex values mirror token-derived light + dark exactly
**Given** the conditional values,
**When** I extract them and convert to RGB,
**Then** they match `global.css` light + dark token-derived hex within ±2 per channel.

**Verify:** Both files conditional values map to:
- handle dark: `#1a1716` → light: `#fafafa` (matches `--color-sidebar` / `--color-card` dark/light)
- background dark: `#1a1716` → light: `#fafafa`
- text-input bg dark: `#201e1c` → light: `#ffffff` (matches `--color-card`)
- text color dark: `#f3eee9` → light: `#252525` (matches `--color-foreground`)
- placeholder dark: `#ada6a3` → light: `#808080` (matches `--color-muted-foreground`)

### AC-4: documentation comment present in both files
**Given** the resolution logic,
**When** I grep for the rationale,
**Then** a comment near the colorScheme switch references (a) gorhom no-className constraint AND (b) the ScrollFade precedent.

**Verify:** `grep -B 5 "useColorScheme\|colorScheme ===" apps/mobile/components/BottomSheet/BottomSheet.tsx apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx` → comment block with both rationale terms

### AC-5: typecheck + lint pass
**Given** the edits,
**When** I run typecheck + lint,
**Then** EXIT 0.

**Verify:** `cd apps/mobile && bun run typecheck` + `bun run lint apps/mobile/components/BottomSheet/ apps/mobile/screens/chat-view/views/AskUserSheet/` → EXIT 0

### AC-6: light-mode sanity check in storybook
**Given** the edits,
**When** I open `Organisms/BottomSheet` and `Views/Chat/02-ChatView · Pause · ask_user sheet` storybook stories,
**Then** in LIGHT theme: sheet handle, surface, and text input render with light-themed tokens (no dark rectangles on white).

**Verify:** Manual on-device storybook check

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | `useColorScheme` imported in BottomSheet.tsx | AC-1 | grep |
| TC-2 | BottomSheet handle backgroundColor resolves via colorScheme | AC-1 | grep ternary expression |
| TC-3 | BottomSheet backgroundStyle.backgroundColor resolves via colorScheme | AC-1 | grep ternary |
| TC-4 | `useColorScheme` imported in AskUserSheet.tsx | AC-2 | grep |
| TC-5 | BottomSheetTextInput backgroundColor resolves via colorScheme | AC-2 | grep ternary |
| TC-6 | BottomSheetTextInput color (text) resolves via colorScheme | AC-2 | grep ternary |
| TC-7 | BottomSheetTextInput placeholderTextColor resolves via colorScheme | AC-2 | grep ternary |
| TC-8 | Light + dark hex pairs match global.css token-derived values within ±2/channel | AC-3 | hex comparison |
| TC-9 | Rationale comment present in BottomSheet.tsx | AC-4 | grep |
| TC-10 | Rationale comment present in AskUserSheet.tsx | AC-4 | grep |
| TC-11 | `bun run typecheck` exits 0 | AC-5 | bash exit code |
| TC-12 | `bun run lint` exits 0 for both folders | AC-5 | bash exit code |
| TC-13 | BottomSheet renders light-themed in light theme storybook | AC-6 | manual on-device |
| TC-14 | AskUserSheet text input renders light-themed in light theme storybook | AC-6 | manual on-device |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `apps/mobile/components/BottomSheet/BottomSheet.tsx` | 60-100 | Current hardcoded hex values to refactor |
| `apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx` | 100-135 | Current hardcoded BottomSheetTextInput styles |
| `apps/mobile/components/ScrollFade/ScrollFade.tsx` | 11-50 | EXISTING useColorScheme pattern — copy the idiom from here |
| `apps/mobile/global.css` | full | Token-derived hex values reference (card, foreground, muted-foreground, sidebar) |
| `apps/mobile/components/ui/AUDIT.md` | full | Vendor-immutability + gorhom constraint context |

## GUARDRAILS

**WRITE-ALLOWED:**
- `apps/mobile/components/BottomSheet/BottomSheet.tsx` (MODIFY)
- `apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx` (MODIFY)

**WRITE-PROHIBITED:**
- `apps/mobile/components/ui/**` (vendor primitives, immutable).
- `apps/mobile/lib/theme.ts` (do NOT import — expo-router prep crash).
- Other BottomSheet consumers (SessionOverflowMenu, etc.) — they read BottomSheet's props, no direct edits needed.
- `apps/mobile/global.css` — token values are NOT to be changed by this task.

## CODE PATTERN

### Reference (existing useColorScheme idiom)
**Source:** `apps/mobile/components/ScrollFade/ScrollFade.tsx:11-30`
```tsx
import { useColorScheme } from "react-native";

// In component:
const colorScheme = useColorScheme();
const colors =
  colorScheme === "dark"
    ? { page: "hsl(13, 16%, 7%)", soft: "hsl(20, 7%, 12%)", overlay: "hsl(20, 7%, 12%)" }
    : { page: "hsl(0, 0%, 100%)", soft: "hsl(0, 0%, 100%)", overlay: "hsl(0, 0%, 100%)" };
```

### Target (BottomSheet)
```tsx
import { useColorScheme } from "react-native";

export const BottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  function BottomSheet({ ... }, ref) {
    const colorScheme = useColorScheme();
    // gorhom's BottomSheetHandle + BottomSheetModal don't accept className.
    // We must compute themed hex values here. Same precedent as ScrollFade.tsx.
    const surfaceHex = colorScheme === "dark" ? "#1a1716" : "#fafafa"; // matches --color-sidebar light/dark
    const handleIndicatorHex =
      colorScheme === "dark" ? "rgba(255,255,255,0.32)" : "rgba(0,0,0,0.32)";

    const renderHandle = useCallback(
      (handleProps) => (
        <BottomSheetHandle
          {...handleProps}
          indicatorStyle={{ backgroundColor: handleIndicatorHex }}
          style={{
            backgroundColor: surfaceHex,
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}
        />
      ),
      [surfaceHex, handleIndicatorHex],
    );

    return (
      <BottomSheetModal
        ref={ref}
        ...
        backgroundStyle={{ backgroundColor: surfaceHex }}
        ...
      >
        {children}
      </BottomSheetModal>
    );
  },
);
```

### Target (AskUserSheet BottomSheetTextInput)
```tsx
import { useColorScheme } from "react-native";

// In component body:
const colorScheme = useColorScheme();
// gorhom's BottomSheetTextInput doesn't accept className. We mirror the
// ember dark/light token-derived hex values here. Precedent: ScrollFade.tsx.
const inputBg =
  colorScheme === "dark" ? "#201e1c" : "#ffffff"; // --color-card
const inputText =
  colorScheme === "dark" ? "#f3eee9" : "#252525"; // --color-foreground
const inputPlaceholder =
  colorScheme === "dark" ? "#ada6a3" : "#808080"; // --color-muted-foreground

<BottomSheetTextInput
  ...
  style={{
    minHeight: 96,
    padding: 12,
    borderRadius: 8,
    backgroundColor: inputBg,
    color: inputText,
    fontSize: 15,
  }}
  placeholderTextColor={inputPlaceholder}
/>
```

### Anti-pattern
- `useColorScheme() === undefined` — RN can return `null`, `"light"`, `"dark"`, or `undefined`. Treat anything other than `"dark"` as light (default).
- Computing colors inside the `renderHandle` callback without `useMemo` — stable refs matter for `useCallback` dependency arrays.
- Forgetting to update `useCallback` dependency arrays after adding the new computed values.

## DESIGN

**References:**
- Red-hat review F-1, F-2, DG-6
- `ScrollFade.tsx:11-30` (precedent)
- `apps/mobile/components/ui/AUDIT.md` (gorhom + vendor constraints)
- `apps/mobile/global.css` token values (light + dark)

**Pattern source:** `apps/mobile/components/ScrollFade/ScrollFade.tsx:11-30`
**Anti-pattern:** Importing THEME from `lib/theme.ts` (triggers expo-router prep crash in Storybook). Hardcoding light AND dark values to the same color "for simplicity."

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| useColorScheme in BottomSheet | `grep "useColorScheme" apps/mobile/components/BottomSheet/BottomSheet.tsx` | 2+ (import + call) |
| useColorScheme in AskUserSheet | `grep "useColorScheme" apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx` | 2+ |
| BottomSheet ternary present | `grep -E "colorScheme === ['\"]dark['\"]" apps/mobile/components/BottomSheet/BottomSheet.tsx` | 1+ |
| AskUserSheet ternary present | `grep -E "colorScheme === ['\"]dark['\"]" apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx` | 1+ |
| Hex values match tokens | manual: extract conditional pairs, compare to global.css HSL→hex | within ±2/channel |
| Comments present | `grep -B 5 "useColorScheme" apps/mobile/components/BottomSheet/BottomSheet.tsx apps/mobile/screens/chat-view/views/AskUserSheet/AskUserSheet.tsx \| grep -E "gorhom\|className\|ScrollFade"` | 2+ |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |
| Lint | `bun run lint apps/mobile/components/BottomSheet/ apps/mobile/screens/chat-view/views/AskUserSheet/` | EXIT 0 |

## AGENT INSTRUCTIONS

1. READ `ScrollFade.tsx` to internalize the existing useColorScheme idiom.
2. RED — grep current state; confirm hardcoded hex values present (proving the bug).
3. GREEN — refactor `BottomSheet.tsx`:
   - Add `import { useColorScheme } from "react-native"`.
   - Call hook, compute `surfaceHex` + `handleIndicatorHex`.
   - Update `renderHandle` callback + `backgroundStyle`.
   - Add deps to `useCallback` array.
   - Add rationale comment.
4. GREEN — refactor `AskUserSheet.tsx`:
   - Same hook + compute 3 hex values (inputBg, inputText, inputPlaceholder).
   - Update `<BottomSheetTextInput>` inline style + placeholderTextColor.
   - Add rationale comment.
5. Verify all 14 TCs.

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** RN component refactor using `react-native` hooks + vendor primitive constraints. Same domain as ScrollFade.

## DEPENDENCIES

- **depends_on:** REMED-002 (the light muted-foreground value `#808080` placeholder color depends on the light token being correctly aligned to desktop)
- **blocks:** none

## NOTES

This task assumes light theme values exist in `global.css` `@variant light`
matching:
- `--color-card` light → `hsl(0 0% 100%)` ≈ `#ffffff`
- `--color-foreground` light → `hsl(0 0% 14.5%)` ≈ `#252525`
- `--color-muted-foreground` light → after REMED-002 lands: `hsl(0 0% 55%)` ≈ `#808080`
- `--color-sidebar` light → after REMED-004 lands: `hsl(0 0% 98%)` ≈ `#fafafa`

If REMED-004 has not landed yet (sidebar token absent), use `--color-card`
light value (`#ffffff`) as the sheet surface fallback. Update this task's
hex pairs after REMED-004 merges.

60-min estimate covers both component refactors + comment writing + manual
storybook verification on both themes.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN BottomSheet.tsx WHEN I grep useColorScheme THEN hook imported + called, handle and backgroundStyle resolve via colorScheme ternary", "verify": "grep useColorScheme + ternary"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN AskUserSheet.tsx WHEN I grep useColorScheme THEN hook imported + called, BottomSheetTextInput bg, color, placeholderTextColor resolve via colorScheme", "verify": "grep + ternary"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN conditional values WHEN I extract and convert to RGB THEN they match global.css light + dark token-derived hex within ±2/channel", "verify": "hex comparison"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN resolution logic WHEN I grep for rationale THEN comment references gorhom no-className AND ScrollFade precedent", "verify": "grep comment"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN edits WHEN typecheck + lint run THEN EXIT 0", "verify": "bun run typecheck && bun run lint"},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN edits WHEN I open BottomSheet + AskUserSheet stories in light theme THEN sheet handle/surface/text input render light-themed", "verify": "manual on-device storybook"},
    {"id": "TC-1", "type": "test_criterion", "description": "useColorScheme imported in BottomSheet.tsx", "maps_to_ac": "AC-1", "verify": "grep"},
    {"id": "TC-2", "type": "test_criterion", "description": "BottomSheet handle backgroundColor resolves via colorScheme", "maps_to_ac": "AC-1", "verify": "grep ternary"},
    {"id": "TC-3", "type": "test_criterion", "description": "BottomSheet backgroundStyle resolves via colorScheme", "maps_to_ac": "AC-1", "verify": "grep ternary"},
    {"id": "TC-4", "type": "test_criterion", "description": "useColorScheme imported in AskUserSheet.tsx", "maps_to_ac": "AC-2", "verify": "grep"},
    {"id": "TC-5", "type": "test_criterion", "description": "BottomSheetTextInput backgroundColor resolves via colorScheme", "maps_to_ac": "AC-2", "verify": "grep ternary"},
    {"id": "TC-6", "type": "test_criterion", "description": "BottomSheetTextInput text color resolves via colorScheme", "maps_to_ac": "AC-2", "verify": "grep ternary"},
    {"id": "TC-7", "type": "test_criterion", "description": "BottomSheetTextInput placeholderTextColor resolves via colorScheme", "maps_to_ac": "AC-2", "verify": "grep ternary"},
    {"id": "TC-8", "type": "test_criterion", "description": "Light + dark hex pairs match global.css token-derived values ±2/channel", "maps_to_ac": "AC-3", "verify": "hex comparison"},
    {"id": "TC-9", "type": "test_criterion", "description": "Rationale comment present in BottomSheet.tsx", "maps_to_ac": "AC-4", "verify": "grep"},
    {"id": "TC-10", "type": "test_criterion", "description": "Rationale comment present in AskUserSheet.tsx", "maps_to_ac": "AC-4", "verify": "grep"},
    {"id": "TC-11", "type": "test_criterion", "description": "bun run typecheck exits 0", "maps_to_ac": "AC-5", "verify": "bash exit"},
    {"id": "TC-12", "type": "test_criterion", "description": "bun run lint exits 0 for both folders", "maps_to_ac": "AC-5", "verify": "bash exit"},
    {"id": "TC-13", "type": "test_criterion", "description": "BottomSheet renders light-themed in light theme storybook", "maps_to_ac": "AC-6", "verify": "manual"},
    {"id": "TC-14", "type": "test_criterion", "description": "AskUserSheet text input renders light-themed in light theme storybook", "maps_to_ac": "AC-6", "verify": "manual"}
  ]
}
-->
