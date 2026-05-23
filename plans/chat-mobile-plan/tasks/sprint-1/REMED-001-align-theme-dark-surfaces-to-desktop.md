---
task_id: REMED-001
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: react-native-ui-implementer
estimate_minutes: 30
task_type: FEATURE
status: Backlog
priority: P1
effort: S
prd_refs: [TS-1, TS-9]
upstream_review: red-hat 2026-05-23 §7.2, §7.10 Priority 3
---

# REMED-001 — Align mobile theme dark surfaces to desktop (accent + live-fg + streaming-cursor)

## Background

**Problem:** The 2026-05-23 frontend-designer red-hat review documented 3
perceptible RGB drifts in the mobile dark theme vs the desktop ember palette:

| Token | Mobile (`global.css`) | Desktop (`globals.css`) | RGB dist |
|---|---|---|---|
| `--color-accent` (dark) | `hsl(15 6% 14%)` ≈ `#252221` | `#2a2827` | 8.7 |
| `--color-state-live-fg` (dark) | `hsl(149 35% 47%)` ≈ `#4da176` | `#50a878` | 6.7 |
| `--color-streaming-cursor` (dark) | `hsl(149 35% 47%)` ≈ `#4da176` | (derives from live-fg) `#50a878` | 6.7 |

A perceptible drift means the same UI surface looks noticeably different
between platforms. Chat-domain elements that ride these tokens (chip
backgrounds on hover/active, streaming-state status pills, the streaming
cursor at the end of assistant body text) will look like a different
product on phone vs desktop.

**Why it matters:** Sprint 2+ wires real cross-platform sessions — the
same session opened on desktop and mobile must feel like one product. The
streaming cursor especially is the most-visible chat tell — it sits at the
end of every streaming assistant turn.

**Current:** `apps/mobile/global.css` `@variant dark` block at lines
~88-120 contains the drifted HSL values listed above.

**Desired:** Each of the 3 drifted dark tokens matches the desktop value
within RGB distance ≤ 3 (imperceptible-aligned threshold). Verified by
HSL→hex conversion in the AC, not by eyeball.

## CRITICAL CONSTRAINTS

- **MUST** preserve existing token NAMES (`--color-accent`, `--color-state-live-fg`, `--color-streaming-cursor`) — do NOT introduce new tokens.
- **MUST** edit only the `@variant dark` block — do NOT touch `@variant light` (REMED-002 owns that).
- **NEVER** import THEME from `apps/mobile/lib/theme.ts` — that file imports from `expo-router/react-navigation` and crashes Storybook RN prep.
- **MUST** update `apps/mobile/lib/theme.ts` THEME constant dark-side values to match the new CSS values exactly — keeping the two sources in sync per `14-token-migration-audit.md §3` (single source of truth was the audit's goal; we hold the line on parity).

## SPECIFICATION

**Objective:** Bring 3 drifted mobile dark-theme tokens into RGB-distance-≤3
alignment with the desktop ember palette at `apps/desktop/src/renderer/globals.css`.

**Success state:** A reviewer running a hex diff between mobile's
post-change `global.css` dark block and desktop's dark block finds the 3
tokens identical (or within rounding tolerance ≤ 3 in RGB Euclidean distance
on 0-255 scale). `apps/mobile/lib/theme.ts` THEME.dark matches.

## ACCEPTANCE CRITERIA

### AC-1: accent dark aligned
**Given** `apps/mobile/global.css` `@variant dark` block,
**When** I extract the `--color-accent` value and convert to hex,
**Then** the hex value resolves to `#2a2827` (±2 per channel acceptable rounding).

**Verify:** `grep -A 30 "@variant dark" apps/mobile/global.css | grep -- "--color-accent:"` → returns `--color-accent: hsl(20 4% 16%);` (or HSL that round-trips to `#2a2827` ±2/channel)

### AC-2: state-live-fg dark aligned
**Given** `apps/mobile/global.css` `@variant dark` block,
**When** I extract the `--color-state-live-fg` value and convert to hex,
**Then** the hex value resolves to `#50a878` (±2 per channel).

**Verify:** `grep -A 50 "@variant dark" apps/mobile/global.css | grep -- "--color-state-live-fg:"` → returns `--color-state-live-fg: hsl(148 36% 49%);` (or HSL that round-trips to `#50a878` ±2/channel)

### AC-3: streaming-cursor dark aligned
**Given** `apps/mobile/global.css` `@variant dark` block,
**When** I extract the `--color-streaming-cursor` value,
**Then** it matches the new `--color-state-live-fg` value exactly (derivation invariant preserved).

**Verify:** `grep -A 50 "@variant dark" apps/mobile/global.css | grep -E "(state-live-fg|streaming-cursor):" | awk '{print $2}' | sort -u | wc -l` → `1` (both values identical)

### AC-4: lib/theme.ts THEME.dark mirrors CSS exactly
**Given** the 3 updated tokens in `global.css`,
**When** I inspect `apps/mobile/lib/theme.ts` THEME.dark for the matching camelCase keys (`accent`, `stateLiveFg`, `streamingCursor`),
**Then** their HSL string values are identical to the new `global.css` values.

**Verify:** `grep -E "accent:|stateLiveFg:|streamingCursor:" apps/mobile/lib/theme.ts` → returns 3 lines whose HSL values match the new global.css dark-block values

### AC-5: typecheck + Storybook still load
**Given** the theme edits,
**When** I run `cd apps/mobile && bun run typecheck`,
**Then** EXIT 0 (no regressions).

**Verify:** `cd apps/mobile && bun run typecheck` → EXIT 0

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | `--color-accent` dark token in global.css resolves to hex within RGB distance ≤ 3 of #2a2827 | AC-1 | scripted HSL→RGB conversion check (see verification gate) |
| TC-2 | `--color-state-live-fg` dark token in global.css resolves to hex within RGB distance ≤ 3 of #50a878 | AC-2 | scripted HSL→RGB conversion check |
| TC-3 | `--color-streaming-cursor` dark token value is identical to `--color-state-live-fg` dark value | AC-3 | grep both values, assert equal |
| TC-4 | `lib/theme.ts` THEME.dark.accent value matches the global.css `--color-accent` dark value | AC-4 | grep both, assert equal HSL string |
| TC-5 | `lib/theme.ts` THEME.dark.stateLiveFg value matches the global.css `--color-state-live-fg` dark value | AC-4 | grep both, assert equal |
| TC-6 | `lib/theme.ts` THEME.dark.streamingCursor value matches the global.css `--color-streaming-cursor` dark value | AC-4 | grep both, assert equal |
| TC-7 | `bun run typecheck` exits 0 after edits | AC-5 | bash exit code check |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `apps/desktop/src/renderer/globals.css` | 17-57 | Desktop dark theme `--color-*` block — alignment source of truth |
| `apps/mobile/global.css` | `@variant dark` block (~88-120) | Current mobile dark values to edit |
| `apps/mobile/lib/theme.ts` | THEME.dark block (~70-118) | Mirror constant to update |
| `plans/chat-mobile-plan/14-token-migration-audit.md` | §3-§4 | Original migration target spec |
| `designs/tokens/tokens.css` | 1-200 | Canonical two-tier spec (reference only) |

## GUARDRAILS

**WRITE-ALLOWED:**
- `apps/mobile/global.css` (MODIFY) — only the `@variant dark` block, only the 3 tokens listed.
- `apps/mobile/lib/theme.ts` (MODIFY) — only THEME.dark camelCase mirrors of the 3 tokens.

**WRITE-PROHIBITED:**
- `apps/desktop/**` — source of truth; do not touch.
- `packages/ui/**` — shared package; mobile-only change.
- `apps/mobile/global.css` `@variant light` block — owned by REMED-002.
- `apps/mobile/components/**` — no component edits in this task.
- `apps/mobile/lib/theme.ts` NAV_THEME or non-dark sections.
- `designs/tokens/tokens.css` — canonical spec; do not amend.

## CODE PATTERN

### Reference (desktop, dark variant)
**Source:** `apps/desktop/src/renderer/globals.css:35-50`
```css
:root {
  --color-accent: #2a2827;
  --color-state-live-fg: #50a878;
  /* streaming-cursor not separately declared on desktop — derives from green chart-2 / live-fg */
}
```

### Target (mobile, dark variant)
```css
@variant dark {
  :root {
    --color-accent: hsl(20 4% 16%);           /* #2a2827 — was hsl(15 6% 14%) */
    --color-state-live-fg: hsl(148 36% 49%);  /* #50a878 — was hsl(149 35% 47%) */
    --color-streaming-cursor: hsl(148 36% 49%); /* must match live-fg — was hsl(149 35% 47%) */
  }
}
```

### Anti-pattern
- DO NOT change token names. Renaming `--color-accent` to `--color-accent-dark` or similar breaks every component that uses `bg-accent` / `text-accent`.
- DO NOT change semantic meaning. `--color-state-live-fg` is the running/streaming green; it is NOT the success-green (that's `--color-state-success-fg`).
- DO NOT update Tailwind config — these are CSS custom properties read by NativeWind via `@theme inline`.

## DESIGN

**References:**
- Red-hat review §7.2 dark mismatch table — `T-2`, `T-3` rows
- Red-hat review §7.10 Priority 3
- `plans/chat-mobile-plan/14-token-migration-audit.md` §3 ember spec

**Pattern source:** `apps/desktop/src/renderer/globals.css:35-50`
**Anti-pattern:** Inverting hue/saturation in HSL to compensate for "looking different" — the desktop values ARE the target; do not over-correct.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| Tokens grep | `grep -E -- "--color-(accent|state-live-fg|streaming-cursor):" apps/mobile/global.css` | 6 lines (3 light + 3 dark), all matching new HSL values |
| theme.ts mirror | `grep -E "(accent|stateLiveFg|streamingCursor):" apps/mobile/lib/theme.ts \| grep -A 0 "dark" -B 5` | 3 lines in dark block matching CSS values |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |

## AGENT INSTRUCTIONS

1. RED phase — write a small inline shell test to verify the 3 grep-equality assertions FAIL on the current code (proving the drift exists).
2. GREEN phase — apply the 3 CSS edits + 3 theme.ts mirrors.
3. REFACTOR phase — none needed; this is a 6-line touch.
4. Verify TC-1..TC-7 all pass.

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Touches `apps/mobile/global.css` (NativeWind tokens) and `apps/mobile/lib/theme.ts` — both in the RN UI implementer's domain. The change is purely visual-token math, no component code, no platform-native code.

## DEPENDENCIES

- **depends_on:** none (can ship first in remediation sprint)
- **blocks:** REMED-002 (same files), REMED-004 (same files), REMED-005 (touches same files)

## NOTES

The 3 changes total 6 line edits (3 in `global.css`, 3 in `lib/theme.ts`).
The 30-min estimate covers RED-phase grep proof, applying edits, AC
verification, and a final `bun run typecheck`.

Per the 14-token-migration-audit.md Path A decision, mobile uses flat
`--color-*` token names (no `--_ember` two-tier primitive layer). This task
preserves that convention.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN apps/mobile/global.css @variant dark block WHEN I extract --color-accent and convert to hex THEN it resolves to #2a2827 (±2/channel)", "verify": "grep -A 30 '@variant dark' apps/mobile/global.css | grep -- '--color-accent:'"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN apps/mobile/global.css @variant dark block WHEN I extract --color-state-live-fg and convert to hex THEN it resolves to #50a878 (±2/channel)", "verify": "grep -A 50 '@variant dark' apps/mobile/global.css | grep -- '--color-state-live-fg:'"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN apps/mobile/global.css @variant dark block WHEN I extract --color-streaming-cursor THEN it matches --color-state-live-fg exactly", "verify": "grep -A 50 '@variant dark' apps/mobile/global.css | grep -E '(state-live-fg|streaming-cursor):' | awk '{print $2}' | sort -u | wc -l"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN updated global.css tokens WHEN I inspect lib/theme.ts THEME.dark THEN accent / stateLiveFg / streamingCursor mirror the new HSL strings", "verify": "grep -E 'accent:|stateLiveFg:|streamingCursor:' apps/mobile/lib/theme.ts"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN the theme edits WHEN I run bun run typecheck THEN EXIT 0", "verify": "cd apps/mobile && bun run typecheck"},
    {"id": "TC-1", "type": "test_criterion", "description": "--color-accent dark token resolves to hex within RGB distance ≤ 3 of #2a2827", "maps_to_ac": "AC-1", "verify": "HSL→RGB conversion check"},
    {"id": "TC-2", "type": "test_criterion", "description": "--color-state-live-fg dark token resolves to hex within RGB distance ≤ 3 of #50a878", "maps_to_ac": "AC-2", "verify": "HSL→RGB conversion check"},
    {"id": "TC-3", "type": "test_criterion", "description": "--color-streaming-cursor dark value is identical to --color-state-live-fg dark value", "maps_to_ac": "AC-3", "verify": "grep both, assert equal"},
    {"id": "TC-4", "type": "test_criterion", "description": "THEME.dark.accent in lib/theme.ts matches --color-accent dark in global.css", "maps_to_ac": "AC-4", "verify": "grep both, assert equal HSL string"},
    {"id": "TC-5", "type": "test_criterion", "description": "THEME.dark.stateLiveFg matches --color-state-live-fg dark", "maps_to_ac": "AC-4", "verify": "grep both, assert equal"},
    {"id": "TC-6", "type": "test_criterion", "description": "THEME.dark.streamingCursor matches --color-streaming-cursor dark", "maps_to_ac": "AC-4", "verify": "grep both, assert equal"},
    {"id": "TC-7", "type": "test_criterion", "description": "bun run typecheck exits 0 after edits", "maps_to_ac": "AC-5", "verify": "cd apps/mobile && bun run typecheck"}
  ]
}
-->
