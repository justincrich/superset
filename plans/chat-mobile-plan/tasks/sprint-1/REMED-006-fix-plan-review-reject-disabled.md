---
task_id: REMED-006
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: react-native-ui-implementer
estimate_minutes: 20
task_type: BUG_FIX
status: Backlog
priority: P0
effort: XS
prd_refs: [TS-7, UC-PAUSE-03]
upstream_review: red-hat 2026-05-23 DG-8, R-6
---

# REMED-006 — Fix PlanReviewScreen Reject button disabled state

## Background

**Problem:** `apps/mobile/components/PlanReviewScreen/PlanReviewScreen.tsx`
line ~98: the Reject button's `disabled` prop currently is `{isSubmitting}`
alone. Per TS-7 (Sprint 01 Test Step 7), the Reject button MUST be
disabled while the feedback textarea is empty — users should only be able
to reject a plan with explicit feedback explaining why.

If shipped as-is, users tapping Reject with no feedback will trigger
`onReject("")` — the agent receives an empty rejection, can't act on it,
and the UX feels broken (silent reject).

**Why it matters:** UC-PAUSE-03 §A acceptance: "Reject disabled until
feedback is non-empty." This is a product-behavior AC, not a visual
preference.

**Current:** `disabled={isSubmitting}` — Reject is tappable with empty feedback.

**Desired:** `disabled={isSubmitting || feedbackValue.trim().length === 0}`
— Reject is greyed/inert until feedback has non-whitespace content.

## CRITICAL CONSTRAINTS

- **MUST** trim whitespace before checking emptiness — pure-whitespace input is NOT valid feedback.
- **MUST** preserve Approve button's existing behavior (only `disabled={isSubmitting}`) — Approve doesn't require feedback.
- **MUST NOT** add a visible "feedback required" error message; the disabled state IS the affordance.
- **NEVER** disable Reject during submission of an Approve action (the Approve path doesn't read feedback).

## SPECIFICATION

**Objective:** Make the Reject button in PlanReviewScreen disabled when
the feedback textarea is empty or whitespace-only.

**Success state:** Reviewer opens `Views/Chat/03-PlanReviewModal` in
Storybook → confirms Reject button starts disabled. Types a character →
Reject becomes enabled. Deletes back to empty → Reject becomes disabled
again. Approve remains enabled throughout.

## ACCEPTANCE CRITERIA

### AC-1: empty feedback disables Reject
**Given** `PlanReviewScreen` renders with no feedback typed,
**When** I inspect the Reject button props,
**Then** `disabled` is `true`.

**Verify:** Story `Views/Chat/03-PlanReviewModal` → Reject button starts disabled. (Code grep: `grep -A 5 "Reject" PlanReviewScreen.tsx | grep "disabled=" | grep -E "feedbackValue.*length|trim()"`)

### AC-2: non-empty feedback enables Reject
**Given** `PlanReviewScreen` with feedback `"the plan is wrong"`,
**When** I inspect Reject,
**Then** `disabled` is `false`.

**Verify:** Manually type into the storybook story; observe Reject enabled.

### AC-3: whitespace-only feedback disables Reject
**Given** `PlanReviewScreen` with feedback `"   "` (whitespace only),
**When** I inspect Reject,
**Then** `disabled` is `true`.

**Verify:** `grep "feedbackValue" PlanReviewScreen.tsx | grep ".trim()"` → confirms trim() applied before length check

### AC-4: Approve button unaffected
**Given** any feedback state (empty / whitespace / typed),
**When** I inspect Approve,
**Then** `disabled` is `isSubmitting` only — same as before this task.

**Verify:** `grep -A 5 "Approve" PlanReviewScreen.tsx | grep "disabled="` → `disabled={isSubmitting}` (unchanged)

### AC-5: typecheck + lint pass
**Given** the edits,
**When** I run typecheck + lint,
**Then** EXIT 0 on both.

**Verify:** `cd apps/mobile && bun run typecheck && cd ../.. && bun run lint apps/mobile/components/PlanReviewScreen/` → both EXIT 0

### AC-6: PlanReviewModal story updated to cover the disabled-then-enabled flow (optional)
**Given** the storybook view at `screens/chat-view/views/PlanReviewModal/PlanReviewModal.stories.tsx`,
**When** I inspect the story,
**Then** the docs description notes the Reject disabled-while-empty behavior.

**Verify:** `grep -i "disabled\|empty\|feedback" apps/mobile/screens/chat-view/views/PlanReviewModal/PlanReviewModal.stories.tsx`

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | Reject button disabled prop includes `feedbackValue.trim().length === 0` check | AC-1, AC-3 | grep |
| TC-2 | Reject button disabled when feedbackValue is empty string | AC-1 | manual storybook check |
| TC-3 | Reject button enabled when feedbackValue contains at least 1 non-whitespace character | AC-2 | manual storybook check |
| TC-4 | Reject button disabled when feedbackValue is whitespace-only | AC-3 | manual storybook check |
| TC-5 | Approve button disabled prop unchanged | AC-4 | grep + git diff |
| TC-6 | `bun run typecheck` exits 0 | AC-5 | bash exit code |
| TC-7 | `bun run lint` for PlanReviewScreen folder exits 0 | AC-5 | bash exit code |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `apps/mobile/components/PlanReviewScreen/PlanReviewScreen.tsx` | 80-120 | Footer with Approve + Reject buttons; the disabled prop is on the Reject Button component |
| `apps/mobile/screens/chat-view/views/PlanReviewModal/PlanReviewModal.tsx` | full | Storybook view wrapping the organism with useState |
| `apps/mobile/screens/chat-view/views/PlanReviewModal/PlanReviewModal.stories.tsx` | full | Story file to update docs string |
| `plans/chat-mobile-plan/07-uc-pause.md` | UC-PAUSE-03 §A | Acceptance criteria for plan review |
| `plans/chat-mobile-plan/ROADMAP.md` | Sprint 01 TS-7 | Pause-container tier test step |

## GUARDRAILS

**WRITE-ALLOWED:**
- `apps/mobile/components/PlanReviewScreen/PlanReviewScreen.tsx` (MODIFY) — only the Reject button's `disabled` prop line.
- `apps/mobile/screens/chat-view/views/PlanReviewModal/PlanReviewModal.stories.tsx` (MODIFY, optional) — only the docs description string.

**WRITE-PROHIBITED:**
- The Approve button (different scope).
- Any other PlanReviewScreen props or behavior.
- `apps/mobile/components/ui/button.tsx` (vendor primitive, immutable).
- Storybook stories OTHER than the PlanReviewModal story.

## CODE PATTERN

### Reference (current state — buggy)
**Source:** `apps/mobile/components/PlanReviewScreen/PlanReviewScreen.tsx:96-103`
```tsx
<Button
  variant="outline"
  className="flex-1"
  onPress={() => onReject(feedbackValue)}
  disabled={isSubmitting}    // ← BUG: doesn't gate on feedback content
>
  <Text>Reject</Text>
</Button>
```

### Target
```tsx
<Button
  variant="outline"
  className="flex-1"
  onPress={() => onReject(feedbackValue)}
  disabled={isSubmitting || feedbackValue.trim().length === 0}
>
  <Text>Reject</Text>
</Button>
```

### Anti-pattern
- `disabled={isSubmitting || !feedbackValue}` — fails for whitespace-only strings (`"   "` is truthy).
- `disabled={isSubmitting || feedbackValue.length === 0}` — misses whitespace-only.
- Adding a separate validation function `isFeedbackValid()` — overkill for a single boolean check; inline expression is clearer.

## DESIGN

**References:**
- Red-hat review DG-8 + R-6
- `plans/chat-mobile-plan/07-uc-pause.md` UC-PAUSE-03 §A AC: "Reject disabled until feedback non-empty"
- `plans/chat-mobile-plan/ROADMAP.md` Sprint 01 TS-7 Pause-container tier test

**Pattern source:** Same pattern as Send button disabled-when-empty in `apps/mobile/components/ComposerRow/ComposerRow.tsx` (compose-tier precedent for "disable action when input is empty")

**Anti-pattern:** Showing a "feedback required" inline error instead of disabling — adds UI noise; the disabled affordance is sufficient.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| Reject disabled prop | `grep -A 5 "Reject\|onReject" apps/mobile/components/PlanReviewScreen/PlanReviewScreen.tsx \| grep "disabled="` | Contains `feedbackValue.trim().length === 0` |
| Approve unchanged | `git diff apps/mobile/components/PlanReviewScreen/PlanReviewScreen.tsx \| grep -B 5 -A 5 "Approve"` | No diff hunks around Approve button |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |
| Lint | `cd /Users/justinrich/Projects/superset/.claude/worktrees/chat-mobile-sprint-1 && bun run lint apps/mobile/components/PlanReviewScreen/` | EXIT 0 |
| Storybook docs (optional) | `grep -i "disabled\|empty\|feedback" apps/mobile/screens/chat-view/views/PlanReviewModal/PlanReviewModal.stories.tsx` | 1+ match in docs description |

## AGENT INSTRUCTIONS

1. RED — modify the story or add a quick assertion that current Reject button is enabled with empty feedback (proving the bug).
2. GREEN — apply the 1-line fix on the Reject `disabled` prop.
3. REFACTOR — none; inline expression is final.
4. (Optional) Update PlanReviewModal.stories.tsx docs description to mention the empty-feedback disabled behavior.
5. Verify all 7 TCs.

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Single-line TSX edit in an existing RN component. RN UI implementer domain.

## DEPENDENCIES

- **depends_on:** none
- **blocks:** none

## NOTES

This is a 1-line code change. The 20-min estimate covers RED-phase
verification, the edit, optional story docstring update, and verification
of all ACs.

If `feedbackValue` is the controlled value via `feedback` prop (when
`PlanReviewScreen` is in controlled mode), the same expression works —
controlled or uncontrolled, `feedbackValue` is the local variable
referenced.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN PlanReviewScreen with no feedback typed WHEN I inspect Reject button THEN disabled is true", "verify": "grep + storybook manual"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN feedback 'the plan is wrong' WHEN I inspect Reject THEN disabled is false", "verify": "storybook manual"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN whitespace-only feedback WHEN I inspect Reject THEN disabled is true", "verify": "grep for .trim() applied"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN any feedback state WHEN I inspect Approve THEN disabled is isSubmitting only", "verify": "grep -A 5 'Approve' + git diff"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN edits WHEN typecheck + lint run THEN EXIT 0", "verify": "cd apps/mobile && bun run typecheck && bun run lint"},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN the storybook view WHEN I inspect the docs THEN it notes the Reject disabled-while-empty behavior", "verify": "grep stories.tsx"},
    {"id": "TC-1", "type": "test_criterion", "description": "Reject disabled prop includes feedbackValue.trim().length === 0", "maps_to_ac": "AC-1", "verify": "grep"},
    {"id": "TC-2", "type": "test_criterion", "description": "Reject disabled when feedback empty", "maps_to_ac": "AC-1", "verify": "storybook"},
    {"id": "TC-3", "type": "test_criterion", "description": "Reject enabled when feedback has non-whitespace char", "maps_to_ac": "AC-2", "verify": "storybook"},
    {"id": "TC-4", "type": "test_criterion", "description": "Reject disabled when feedback whitespace-only", "maps_to_ac": "AC-3", "verify": "storybook"},
    {"id": "TC-5", "type": "test_criterion", "description": "Approve disabled prop unchanged", "maps_to_ac": "AC-4", "verify": "grep + git diff"},
    {"id": "TC-6", "type": "test_criterion", "description": "bun run typecheck exits 0", "maps_to_ac": "AC-5", "verify": "bash exit code"},
    {"id": "TC-7", "type": "test_criterion", "description": "bun run lint exits 0 for PlanReviewScreen folder", "maps_to_ac": "AC-5", "verify": "bash exit code"}
  ]
}
-->
