---
task_id: REMED-003
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: frontend-designer
estimate_minutes: 45
task_type: DESIGN
status: Backlog
priority: P0
effort: S
prd_refs: [TS-9]
upstream_review: red-hat 2026-05-23 §7.3 T-4, §7.10 Priority 1
---

# REMED-003 — Resolve `--color-state-warning-fg` light spec contradiction + apply

## Background

**Problem:** The canonical `designs/tokens/tokens.css` light-mode warning
token is mapped to `chart-3` whose light value is a cool blue-gray
(`oklch(0.398 0.07 227.392)` ≈ `#506070`). `tokens.css:96-98` carries an
inline comment acknowledging the mismatch: `chart-3 light is cool; we keep
it for warning`. Meanwhile, mobile's current `global.css` `@variant light`
uses an amber (`hsl(38 70% 45%)` ≈ `#c28420`) — which is what users
intuitively expect "warning" to look like.

This is the only token in the entire palette where the canonical spec
and mobile implementation disagree on hue family (not just brightness).
The red-hat reviewer flagged it as Critical for TS-9 light-mode sign-off.

**Why it matters:** Warning is used by `Banner --variant=offline`,
`PendingActionPill --kind=approval`, `ToolStatusRule --variant=pending`,
and the host-offline banner. A wrong-hue warning in light mode will
either (a) confuse users (cool blue doesn't read as warning) or (b)
mismatch the dark-mode amber (jarring on theme toggle).

**Current:**
- `designs/tokens/tokens.css:96-98` — cool blue-gray (with apology comment)
- `apps/mobile/global.css` `@variant light` — amber `hsl(38 70% 45%)`
- `apps/desktop/src/renderer/globals.css` — desktop globals don't expose a separate `state-warning-fg`; this is a mobile-domain token

**Desired:** A design decision is made (amber wins OR cool blue wins),
the chosen value is applied to mobile global.css + lib/theme.ts, and
the contradiction in `tokens.css` is resolved (either by amending the
spec to match the decision, or by formally documenting the deliberate
divergence).

## CRITICAL CONSTRAINTS

- **MUST** make an explicit design decision documented in this task file's NOTES section before any code edits.
- **MUST** keep light and dark warning-fg in the same hue family (both amber OR both cool) — never split.
- **NEVER** silently change `tokens.css` without also documenting WHY.
- **MUST** update `apps/mobile/global.css` light value to match the decision, AND mirror into `apps/mobile/lib/theme.ts`.

## SPECIFICATION

**Objective:** Resolve the `state-warning-fg` light hue contradiction with
an explicit design decision and apply it consistently across `tokens.css`,
`global.css`, and `lib/theme.ts`.

**Success state:** Reviewer toggles light theme in Storybook → `Banner
variant="offline"` and `PendingActionPill kind="approval"` render with
the decided warning color. The decision rationale is captured in
`14-token-migration-audit.md` (or a successor doc) so future
contributors don't re-litigate.

## ACCEPTANCE CRITERIA

### AC-1: design decision documented
**Given** the spec contradiction described above,
**When** frontend-designer reviews and decides,
**Then** a written rationale appears in `plans/chat-mobile-plan/14-token-migration-audit.md` (or a new addendum) stating which hue family wins and why.

**Verify:** `grep -n -A 3 "state-warning-fg light" plans/chat-mobile-plan/14-token-migration-audit.md` → returns the decision block

### AC-2: mobile light value updated
**Given** the decision,
**When** I inspect `apps/mobile/global.css` `@variant light` `--color-state-warning-fg`,
**Then** it matches the chosen hex within RGB distance ≤ 5.

**Verify:** `grep -A 50 "@variant light" apps/mobile/global.css | grep -- "--color-state-warning-fg:"` → returns the new HSL value

### AC-3: dark unchanged OR explicitly bridged
**Given** the decision,
**When** I inspect `@variant dark` `--color-state-warning-fg`,
**Then** EITHER the dark value is unchanged (decision: amber wins) AND aligns with the canonical desktop `#d4a84b`, OR dark is updated to match a new shared cool-warning palette (decision: cool wins) — both light and dark must be in the same hue family.

**Verify:** Manual review: both light + dark HSL hue components are within 30° of each other

### AC-4: tokens.css reconciled
**Given** the decision,
**When** I inspect `designs/tokens/tokens.css:96-98`,
**Then** the inline contradiction comment is either removed (canonical updated to match) OR the comment is rewritten to explicitly state "mobile DEVIATES INTENTIONALLY because…".

**Verify:** `grep -n -B 1 -A 2 "warning" designs/tokens/tokens.css` → comment is updated, no stale "we keep it for warning" wording remains

### AC-5: lib/theme.ts mirrored
**Given** the new global.css value,
**When** I inspect `apps/mobile/lib/theme.ts` THEME.light.stateWarningFg,
**Then** the HSL string matches global.css exactly.

**Verify:** `grep "stateWarningFg" apps/mobile/lib/theme.ts` → returns matching HSL

### AC-6: typecheck passes
**Given** the edits,
**When** I run `cd apps/mobile && bun run typecheck`,
**Then** EXIT 0.

**Verify:** `cd apps/mobile && bun run typecheck` → EXIT 0

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | Design decision block exists in 14-token-migration-audit.md (or addendum) with explicit hue-family choice + rationale | AC-1 | grep audit doc |
| TC-2 | `--color-state-warning-fg` light hex resolves within RGB distance ≤ 5 of decided target | AC-2 | HSL→RGB conversion |
| TC-3 | Light and dark `--color-state-warning-fg` hue components differ by ≤ 30° | AC-3 | manual HSL hue comparison |
| TC-4 | `tokens.css` warning-fg comment is rewritten to reflect the decision | AC-4 | grep tokens.css |
| TC-5 | THEME.light.stateWarningFg in lib/theme.ts matches global.css light value | AC-5 | grep both, assert equal |
| TC-6 | `bun run typecheck` exits 0 | AC-6 | bash exit code |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `designs/tokens/tokens.css` | 90-105 | Canonical warning + chart-3 mapping with contradiction comment |
| `apps/mobile/global.css` | `@variant light` warning block | Mobile light value to change |
| `apps/mobile/global.css` | `@variant dark` warning block | Reference (likely unchanged) |
| `apps/mobile/components/Banner/Banner.tsx` | all | Primary warning consumer — sanity-check decision |
| `apps/mobile/components/PendingActionPill/PendingActionPill.tsx` | KIND mapping | Warning consumer |
| `apps/mobile/components/ToolStatusRule/ToolStatusRule.tsx` | running/pending variants | Warning consumer |
| `plans/chat-mobile-plan/14-token-migration-audit.md` | §3, §6 | Audit context, where to add decision block |

## GUARDRAILS

**WRITE-ALLOWED:**
- `plans/chat-mobile-plan/14-token-migration-audit.md` (MODIFY) — append decision block.
- `apps/mobile/global.css` (MODIFY) — only `--color-state-warning-fg` lines (light, and dark if decision flips both).
- `apps/mobile/lib/theme.ts` (MODIFY) — only `stateWarningFg` mirror.
- `designs/tokens/tokens.css` (MODIFY) — only the warning / chart-3 light comment + value if decision flips canonical.

**WRITE-PROHIBITED:**
- Any other `--color-*` tokens (those are owned by REMED-001 / REMED-002 / REMED-004).
- Banner/PendingActionPill/ToolStatusRule component code — they consume the token, do not mutate it.
- `apps/desktop/**`, `packages/ui/**`.

## DESIGN

**References:**
- Red-hat review §7.3 light mismatch table — T-4 row
- Red-hat review §7.10 Priority 1 + spec-resolution note
- `tokens.css:96-98` inline contradiction comment
- `apps/mobile/global.css` light + dark warning blocks
- Banner, PendingActionPill, ToolStatusRule consumers

**Pattern:** Decision must apply uniformly across all warning consumers — no per-component override.

**Anti-pattern:** Keeping light=cool AND dark=amber without rationale. That guarantees jarring theme-toggle UX.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| Decision block | `grep -n -A 3 "state-warning-fg light" plans/chat-mobile-plan/14-token-migration-audit.md` | Returns decision rationale |
| Light value | `grep -A 50 "@variant light" apps/mobile/global.css \| grep "state-warning-fg"` | New HSL matching decision |
| Hue parity | (manual) Light + dark hue components within 30° | Same hue family |
| tokens.css updated | `grep -B 1 -A 2 "warning" designs/tokens/tokens.css \| grep -i "DEVIATES\|chart-3 light"` | Comment updated |
| theme.ts mirror | `grep stateWarningFg apps/mobile/lib/theme.ts` | Matches global.css |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |

## AGENT INSTRUCTIONS

1. READ the 3 warning consumers (Banner, PendingActionPill, ToolStatusRule) and the audit doc.
2. DECIDE: amber wins (intuitive warning hue, matches dark, requires `tokens.css` correction) OR cool-blue wins (matches canonical, requires updating all 3 consumers' expectations + mobile dark).
3. WRITE the decision + rationale into `14-token-migration-audit.md` (append a §7 "Warning hue resolution" section).
4. APPLY the chosen HSL value to `global.css` light (and dark, if decision flips).
5. MIRROR into `lib/theme.ts`.
6. UPDATE `tokens.css:96-98` comment to reflect the resolution.
7. Verify all 6 ACs.

## AGENT ASSIGNMENT

**Agent:** `frontend-designer`
**Rationale:** Hue-family choice is a visual design decision, not a token-math task. The designer also owns spec reconciliation (`tokens.css`).

## DEPENDENCIES

- **depends_on:** none (can run parallel to REMED-001 / REMED-002, but coordinates with REMED-002 to avoid touching the same `@variant light` block in conflicting commits)
- **blocks:** none (other tasks don't read warning-fg)

## NOTES

**Suggested default decision** (frontend-designer may override): **amber wins.**
Rationale: (a) warning-amber is universally intuitive across web/mobile/desktop apps,
(b) dark mode is already amber and a theme-toggle hue flip is jarring,
(c) the `tokens.css:96-98` inline comment self-admits the cool-blue mapping is a chart-3 reuse, not a deliberate warning choice. Applying amber would require updating `tokens.css` to remove the `chart-3` mapping for warning-fg light and replace with a dedicated amber light value (e.g., `oklch(0.65 0.16 70)` ≈ `#c28420`).

If frontend-designer overrides to cool-blue, the dark `--color-state-warning-fg` must also flip cool-blue, and all 3 consumer components need visual review on dark mode.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN the spec contradiction WHEN frontend-designer decides THEN written rationale appears in 14-token-migration-audit.md (or addendum)", "verify": "grep -n -A 3 'state-warning-fg light' plans/chat-mobile-plan/14-token-migration-audit.md"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN the decision WHEN I inspect @variant light --color-state-warning-fg THEN it matches the chosen hex within ±5/channel", "verify": "grep -A 50 '@variant light' apps/mobile/global.css | grep -- '--color-state-warning-fg:'"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN the decision WHEN I inspect @variant dark warning-fg THEN light + dark are in the same hue family", "verify": "manual HSL hue comparison ≤30°"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN the decision WHEN I inspect tokens.css:96-98 THEN the contradiction comment is removed or rewritten as INTENTIONAL DEVIATION", "verify": "grep -n -B 1 -A 2 'warning' designs/tokens/tokens.css"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN new global.css value WHEN I inspect THEME.light.stateWarningFg THEN HSL matches global.css", "verify": "grep stateWarningFg apps/mobile/lib/theme.ts"},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN edits WHEN typecheck runs THEN EXIT 0", "verify": "cd apps/mobile && bun run typecheck"},
    {"id": "TC-1", "type": "test_criterion", "description": "Decision block exists in 14-token-migration-audit.md with explicit hue-family choice + rationale", "maps_to_ac": "AC-1", "verify": "grep audit doc"},
    {"id": "TC-2", "type": "test_criterion", "description": "--color-state-warning-fg light hex resolves within RGB distance ≤ 5 of decided target", "maps_to_ac": "AC-2", "verify": "HSL→RGB conversion"},
    {"id": "TC-3", "type": "test_criterion", "description": "Light + dark warning-fg hue components differ by ≤ 30°", "maps_to_ac": "AC-3", "verify": "manual HSL hue comparison"},
    {"id": "TC-4", "type": "test_criterion", "description": "tokens.css warning-fg comment is rewritten to reflect the decision", "maps_to_ac": "AC-4", "verify": "grep tokens.css"},
    {"id": "TC-5", "type": "test_criterion", "description": "THEME.light.stateWarningFg matches global.css light", "maps_to_ac": "AC-5", "verify": "grep both, assert equal"},
    {"id": "TC-6", "type": "test_criterion", "description": "bun run typecheck exits 0", "maps_to_ac": "AC-6", "verify": "bash exit code"}
  ]
}
-->
