---
task_id: REMED-002
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: react-native-ui-implementer
estimate_minutes: 30
task_type: FEATURE
status: Backlog
priority: P0
effort: S
prd_refs: [TS-1, TS-9]
upstream_review: red-hat 2026-05-23 §7.3, §7.10 Priority 1
---

# REMED-002 — Align mobile theme light values to desktop (muted-foreground + destructive)

## Background

**Problem:** The 2026-05-23 red-hat review flagged 2 significant light-theme
drifts that BLOCK the TS-9 light-mode gate (per ROADMAP.md Sprint 01 Test
Step 9):

| Token | Mobile light | Desktop light | Drift |
|---|---|---|---|
| `--color-muted-foreground` | `hsl(0 0% 35%)` ≈ `#595959` | `oklch(0.556 0 0)` ≈ `#808080` | 20 L-points darker on mobile |
| `--color-destructive` | `hsl(0 84.2% 60.2%)` ≈ `#ee4444` | `oklch(0.577 0.245 27.325)` ≈ `#d14040` | Brighter/lighter on mobile |

Muted-foreground is the most-used "secondary text" color in the entire
app — timestamps, metadata lines, helper text, placeholder hints, USER
section labels. Being 20 lightness points darker makes mobile-light look
heavy-handed vs desktop's airy gray. Destructive is the error/delete
button color — appearing more saturated on mobile makes destructive UI
"shout" louder on phone than desktop.

**Why it matters:** TS-9 explicitly requires both themes work for every
component. With these drifts, side-by-side comparison (desktop monitor +
phone) will reveal the platforms feel different.

**Current:** `apps/mobile/global.css` `@variant light` block contains the
drifted HSL values.

**Desired:** Both light-theme tokens match desktop within RGB-distance ≤ 5
(more tolerance for light because oklch→hex conversion approximations
introduce 2-3 channel rounding).

## CRITICAL CONSTRAINTS

- **MUST** preserve existing token names — do NOT introduce new tokens.
- **MUST** edit only the `@variant light` block — REMED-001 owns dark.
- **NEVER** import THEME from `apps/mobile/lib/theme.ts` in storybook-loadable code.
- **MUST** mirror the updated values into `apps/mobile/lib/theme.ts` THEME.light for the native-stack navigation theme parity.
- **MUST NOT** touch `--color-state-warning-fg` light — REMED-003 owns that (it has an unresolved spec contradiction).

## SPECIFICATION

**Objective:** Bring 2 drifted mobile light-theme tokens within RGB distance
≤ 5 of the desktop ember palette.

**Success state:** Reviewer toggles to light theme in Storybook and the
muted text + destructive button render at the SAME visual weight as the
desktop equivalent. Verified by hex comparison, not eyeball.

## ACCEPTANCE CRITERIA

### AC-1: muted-foreground light aligned
**Given** `apps/mobile/global.css` `@variant light` block,
**When** I extract `--color-muted-foreground` and convert to hex,
**Then** the hex value resolves to `#808080` (±5 per channel).

**Verify:** `grep -A 30 "@variant light" apps/mobile/global.css | grep -- "--color-muted-foreground:"` → returns `--color-muted-foreground: hsl(0 0% 55%);`

### AC-2: destructive light aligned
**Given** `apps/mobile/global.css` `@variant light` block,
**When** I extract `--color-destructive` and convert to hex,
**Then** the hex value resolves to `#d14040` (±5 per channel).

**Verify:** `grep -A 30 "@variant light" apps/mobile/global.css | grep -- "--color-destructive:"` → returns `--color-destructive: hsl(0 60% 51%);` (or HSL that round-trips to `#d14040` ±5/channel)

### AC-3: lib/theme.ts THEME.light mirrors CSS exactly
**Given** the 2 updated light tokens in `global.css`,
**When** I inspect `apps/mobile/lib/theme.ts` THEME.light for `mutedForeground` and `destructive`,
**Then** their HSL string values are identical to the new `global.css` values.

**Verify:** `grep -E "mutedForeground:|destructive:" apps/mobile/lib/theme.ts` → THEME.light entries match new global.css values

### AC-4: no regression to dark
**Given** the edits to `@variant light`,
**When** I inspect `@variant dark` `--color-muted-foreground` and `--color-destructive`,
**Then** the dark values are UNCHANGED.

**Verify:** `git diff apps/mobile/global.css` → diff hunks touch only lines inside the `@variant light` block

### AC-5: typecheck passes
**Given** the theme edits,
**When** I run `cd apps/mobile && bun run typecheck`,
**Then** EXIT 0.

**Verify:** `cd apps/mobile && bun run typecheck` → EXIT 0

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | `--color-muted-foreground` light value resolves to hex within RGB distance ≤ 5 of #808080 | AC-1 | HSL→RGB conversion |
| TC-2 | `--color-destructive` light value resolves to hex within RGB distance ≤ 5 of #d14040 | AC-2 | HSL→RGB conversion |
| TC-3 | THEME.light.mutedForeground in lib/theme.ts matches global.css light value | AC-3 | grep both, assert equal |
| TC-4 | THEME.light.destructive in lib/theme.ts matches global.css light value | AC-3 | grep both, assert equal |
| TC-5 | `@variant dark` values for both tokens are unchanged | AC-4 | git diff narrow to light block |
| TC-6 | `bun run typecheck` exits 0 after edits | AC-5 | bash exit code |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `apps/desktop/src/renderer/globals.css` | 61-99 | Desktop light theme — oklch source values |
| `apps/mobile/global.css` | `@variant light` block | Mobile light values to update |
| `apps/mobile/lib/theme.ts` | THEME.light | Mirror to update |
| `plans/chat-mobile-plan/14-token-migration-audit.md` | §3 | Original migration spec |

## GUARDRAILS

**WRITE-ALLOWED:**
- `apps/mobile/global.css` (MODIFY) — only the `@variant light` block, only the 2 tokens listed.
- `apps/mobile/lib/theme.ts` (MODIFY) — only THEME.light mirrors of the 2 tokens.

**WRITE-PROHIBITED:**
- `apps/desktop/**`, `packages/ui/**`.
- `apps/mobile/global.css` `@variant dark` block — owned by REMED-001.
- `apps/mobile/global.css` `--color-state-warning-fg` light — owned by REMED-003 (unresolved spec contradiction).
- `apps/mobile/components/**` — no component edits.
- `designs/tokens/tokens.css`.

## CODE PATTERN

### Reference (desktop, light)
**Source:** `apps/desktop/src/renderer/globals.css:61-99`
```css
:root.light {
  --color-muted-foreground: oklch(0.556 0 0);  /* ≈ #808080 */
  --color-destructive:      oklch(0.577 0.245 27.325);  /* ≈ #d14040 */
}
```

### Target (mobile, light)
```css
@variant light {
  :root {
    --color-muted-foreground: hsl(0 0% 55%);   /* #808080 — was hsl(0 0% 35%) (#595959) */
    --color-destructive:      hsl(0 60% 51%);  /* #d14040 — was hsl(0 84.2% 60.2%) (#ee4444) */
  }
}
```

### Anti-pattern
- DO NOT match the canonical `tokens.css` raw `oklch()` values directly — NativeWind/Uniwind doesn't process oklch reliably on RN today; stick with HSL strings that round-trip to the same hex.

## DESIGN

**References:**
- Red-hat review §7.3 light mismatch table — T-5 row (muted-foreground), T-7 row (destructive)
- Red-hat review §7.10 Priority 1
- `apps/desktop/src/renderer/globals.css` light block

**Pattern source:** `apps/desktop/src/renderer/globals.css:61-99`
**Anti-pattern:** Picking an arbitrary "lighter" HSL — verify hex by HSL→RGB conversion before committing.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| Token grep | `grep -E -- "--color-(muted-foreground\|destructive):" apps/mobile/global.css` | 4 lines (2 light + 2 dark); the 2 LIGHT ones match the new values |
| theme.ts mirror | `grep -E "mutedForeground:\|destructive:" apps/mobile/lib/theme.ts` | THEME.light entries match the new CSS values |
| No dark regression | `git diff apps/mobile/global.css \| grep -B 3 -A 3 "muted-foreground\|destructive"` | Only @variant light hunks; no @variant dark hunks |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |

## AGENT INSTRUCTIONS

1. RED — grep the 2 tokens; assert current values diverge from new targets.
2. GREEN — apply 4 line edits (2 in global.css, 2 in theme.ts).
3. REFACTOR — none.
4. Verify TC-1..TC-6.

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** RN token / NativeWind / lib/theme.ts domain. Pure visual-token math.

## DEPENDENCIES

- **depends_on:** none (parallel to REMED-001)
- **blocks:** REMED-003 (touches same `@variant light` block — coordinate)

## NOTES

This task explicitly EXCLUDES `--color-state-warning-fg` light — that
token has an unresolved spec contradiction (canonical `tokens.css:96-98`
notes a cool blue-gray, but mobile uses amber to match dark). REMED-003
owns that decision.

`destructive-foreground` is NOT in scope here — only `destructive` itself.
If future review finds drift in destructive-foreground, add a separate
REMED task.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN @variant light block WHEN I extract --color-muted-foreground THEN it resolves to #808080 (±5/channel)", "verify": "grep -A 30 '@variant light' apps/mobile/global.css | grep -- '--color-muted-foreground:'"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN @variant light block WHEN I extract --color-destructive THEN it resolves to #d14040 (±5/channel)", "verify": "grep -A 30 '@variant light' apps/mobile/global.css | grep -- '--color-destructive:'"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN updated light tokens WHEN I inspect lib/theme.ts THEME.light THEN mutedForeground and destructive mirror the new HSL strings", "verify": "grep -E 'mutedForeground:|destructive:' apps/mobile/lib/theme.ts"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN edits to @variant light WHEN I inspect @variant dark THEN those values are unchanged", "verify": "git diff apps/mobile/global.css"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN edits WHEN I run typecheck THEN EXIT 0", "verify": "cd apps/mobile && bun run typecheck"},
    {"id": "TC-1", "type": "test_criterion", "description": "--color-muted-foreground light resolves to hex within RGB distance ≤ 5 of #808080", "maps_to_ac": "AC-1", "verify": "HSL→RGB conversion"},
    {"id": "TC-2", "type": "test_criterion", "description": "--color-destructive light resolves to hex within RGB distance ≤ 5 of #d14040", "maps_to_ac": "AC-2", "verify": "HSL→RGB conversion"},
    {"id": "TC-3", "type": "test_criterion", "description": "THEME.light.mutedForeground matches global.css light value", "maps_to_ac": "AC-3", "verify": "grep both, assert equal"},
    {"id": "TC-4", "type": "test_criterion", "description": "THEME.light.destructive matches global.css light value", "maps_to_ac": "AC-3", "verify": "grep both, assert equal"},
    {"id": "TC-5", "type": "test_criterion", "description": "@variant dark muted-foreground and destructive values are unchanged", "maps_to_ac": "AC-4", "verify": "git diff narrow to light block"},
    {"id": "TC-6", "type": "test_criterion", "description": "bun run typecheck exits 0 after edits", "maps_to_ac": "AC-5", "verify": "bash exit code"}
  ]
}
-->
