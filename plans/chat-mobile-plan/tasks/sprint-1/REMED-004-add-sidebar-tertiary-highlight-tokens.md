---
task_id: REMED-004
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: react-native-ui-implementer
estimate_minutes: 30
task_type: FEATURE
status: Backlog
priority: P1
effort: S
prd_refs: [TS-3, TS-4 prep]
upstream_review: red-hat 2026-05-23 §7.4, §7.10 Priority 2
---

# REMED-004 — Add sidebar / tertiary / highlight tokens (pre-Sprint-02 prep)

## Background

**Problem:** 10 tokens that exist in `apps/desktop/src/renderer/globals.css`
are absent from `apps/mobile/global.css`. Sprint 2 (sessions-list integration)
will need 7 of them; the chat search feature (Sprint 3+) will need the
other 3.

Missing on mobile:
- `--color-tertiary`, `--color-tertiary-active`
- `--color-sidebar`, `--color-sidebar-primary`, `--color-sidebar-accent`, `--color-sidebar-foreground`, `--color-sidebar-border`
- `--color-highlight`, `--color-highlight-match`, `--color-highlight-active`

**Why it matters:** Sessions-list will be built in another session per
user direction. Pre-adding the tokens it needs means that sprint can
focus on component work without re-litigating the palette.

**Current:** `apps/mobile/global.css` has 95 tokens; 10 desktop tokens are
absent.

**Desired:** All 10 tokens present in both `@variant light` and `@variant dark`
blocks with values aligned to `apps/desktop/src/renderer/globals.css`.
Mirrored into `apps/mobile/lib/theme.ts` THEME constant. No component code
touched — pure token addition.

## CRITICAL CONSTRAINTS

- **MUST** add ALL 10 tokens in BOTH light + dark variants — no half-additions.
- **MUST** name tokens exactly per desktop (`--color-sidebar-primary` NOT `--color-sidebar-accent-color` or other variants).
- **MUST** source values from `apps/desktop/src/renderer/globals.css` (not invent values).
- **MUST** mirror into `apps/mobile/lib/theme.ts` THEME under both `.light` and `.dark`.
- **MUST NOT** add components or storybook stories that consume these tokens — that's Sprint 2's job.
- **NEVER** add to `designs/tokens/tokens.css` — canonical spec is owned by design.

## SPECIFICATION

**Objective:** Add 10 missing tokens (× 2 themes = 20 CSS lines) + 20
theme.ts mirror entries, aligned token-for-token to desktop.

**Success state:** Sprint 2 sessions-list components can reference
`bg-sidebar`, `text-sidebar-primary`, `bg-tertiary`, `bg-highlight-match`, etc.
without any token-prep work.

## ACCEPTANCE CRITERIA

### AC-1: all 10 tokens present in @variant dark
**Given** `apps/mobile/global.css` `@variant dark` block,
**When** I grep for each of the 10 token names,
**Then** all 10 are present with values matching desktop dark.

**Verify:** `grep -A 200 "@variant dark" apps/mobile/global.css | grep -cE -- "--color-(tertiary|tertiary-active|sidebar|sidebar-primary|sidebar-accent|sidebar-foreground|sidebar-border|highlight|highlight-match|highlight-active):"` → returns `10`

### AC-2: all 10 tokens present in @variant light
**Given** `apps/mobile/global.css` `@variant light` block,
**When** I grep for each of the 10 token names,
**Then** all 10 are present with values matching desktop light.

**Verify:** `grep -A 200 "@variant light" apps/mobile/global.css | grep -cE -- "--color-(tertiary|tertiary-active|sidebar|sidebar-primary|sidebar-accent|sidebar-foreground|sidebar-border|highlight|highlight-match|highlight-active):"` → returns `10`

### AC-3: token values align to desktop
**Given** the new tokens,
**When** I HSL→hex convert each and diff against desktop,
**Then** each value matches desktop within RGB distance ≤ 5 per channel.

**Verify:** scripted hex comparison across all 20 tokens (light + dark × 10)

### AC-4: lib/theme.ts mirror present
**Given** the 10 new CSS tokens,
**When** I inspect `lib/theme.ts` THEME.light and THEME.dark,
**Then** each block has 10 corresponding camelCase entries (`tertiary`, `tertiaryActive`, `sidebar`, `sidebarPrimary`, `sidebarAccent`, `sidebarForeground`, `sidebarBorder`, `highlight`, `highlightMatch`, `highlightActive`) with matching HSL strings.

**Verify:** `grep -cE "(tertiary|tertiaryActive|sidebar|sidebarPrimary|sidebarAccent|sidebarForeground|sidebarBorder|highlight|highlightMatch|highlightActive):" apps/mobile/lib/theme.ts` → returns ≥ 20

### AC-5: no component edits
**Given** the additions,
**When** I run `git diff --stat`,
**Then** only `global.css`, `lib/theme.ts` (and optionally storybook color catalog) are modified — no files under `apps/mobile/components/` are touched.

**Verify:** `git diff --stat | grep -E "apps/mobile/components/"` → no output (empty)

### AC-6: typecheck passes
**Given** the additions,
**When** I run `cd apps/mobile && bun run typecheck`,
**Then** EXIT 0.

**Verify:** `cd apps/mobile && bun run typecheck` → EXIT 0

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | 10 new tokens present in `@variant dark` block | AC-1 | grep count = 10 |
| TC-2 | 10 new tokens present in `@variant light` block | AC-2 | grep count = 10 |
| TC-3 | Each new dark token hex value matches desktop dark token within RGB ≤ 5 | AC-3 | scripted hex comparison |
| TC-4 | Each new light token hex value matches desktop light token within RGB ≤ 5 | AC-3 | scripted hex comparison |
| TC-5 | THEME.light and THEME.dark in lib/theme.ts each gain 10 new camelCase entries | AC-4 | grep count ≥ 20 |
| TC-6 | No files under `apps/mobile/components/` are modified | AC-5 | git diff filter |
| TC-7 | `bun run typecheck` exits 0 after additions | AC-6 | bash exit code |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `apps/desktop/src/renderer/globals.css` | 17-309 | Full desktop palette — source of truth for the 10 tokens |
| `apps/mobile/global.css` | full | Current mobile palette — to extend |
| `apps/mobile/lib/theme.ts` | THEME.light + THEME.dark | Mirror to extend |
| `plans/chat-mobile-plan/14-token-migration-audit.md` | §3 | Original migration spec (sidebar tokens were deferred per audit decision; this task adds them back) |
| Red-hat review §7.4 | (in conversation) | Token-by-token desktop values |

## GUARDRAILS

**WRITE-ALLOWED:**
- `apps/mobile/global.css` (MODIFY) — add 20 lines (10 dark + 10 light), no other edits.
- `apps/mobile/lib/theme.ts` (MODIFY) — add 20 entries in THEME object, no other edits.
- (Optional) `apps/mobile/.rnstorybook/stories/DesignSystem/Colors.stories.tsx` — append swatches for the 10 new tokens so reviewers can preview them.

**WRITE-PROHIBITED:**
- `apps/desktop/**`, `packages/ui/**`, `designs/tokens/tokens.css`.
- Any component, view, or storybook story OTHER than the optional Colors catalog.
- Other tokens already in `global.css` — REMED-001/002/003 own those.

## CODE PATTERN

### Reference (desktop dark block, source values)
**Source:** `apps/desktop/src/renderer/globals.css:17-57`
```css
:root {
  --color-tertiary:             #1a1716;
  --color-tertiary-active:      #252220;
  --color-sidebar:              #1a1716;
  --color-sidebar-primary:      #e07850;
  --color-sidebar-accent:       #252220;
  --color-sidebar-foreground:   #eae8e6;
  --color-sidebar-border:       #2a2827;
  --color-highlight:            #e07850;
  --color-highlight-match:      rgba(224, 120, 80, 0.2);
  --color-highlight-active:     rgba(224, 120, 80, 0.5);
}
```

### Target (mobile dark + light, HSL form)
```css
@variant dark {
  :root {
    /* … existing tokens … */
    --color-tertiary:           hsl(15 8% 9%);     /* #1a1716 */
    --color-tertiary-active:    hsl(24 7% 14%);    /* #252220 */
    --color-sidebar:            hsl(15 8% 9%);     /* #1a1716 */
    --color-sidebar-primary:    hsl(17 69% 60%);   /* #e07850 ember */
    --color-sidebar-accent:     hsl(24 7% 14%);    /* #252220 */
    --color-sidebar-foreground: hsl(30 6% 91%);    /* #eae8e6 */
    --color-sidebar-border:     hsl(20 4% 16%);    /* #2a2827 */
    --color-highlight:          hsl(17 69% 60%);   /* #e07850 */
    --color-highlight-match:    rgba(224, 120, 80, 0.2);
    --color-highlight-active:   rgba(224, 120, 80, 0.5);
  }
}

@variant light {
  :root {
    /* … existing tokens … */
    --color-tertiary:           hsl(40 5% 95%);    /* desktop oklch(0.95) ≈ #f2f2f1 */
    --color-tertiary-active:    hsl(40 5% 90%);    /* desktop oklch(0.9)  ≈ #e7e5e2 */
    --color-sidebar:            hsl(0 0% 98%);     /* desktop oklch(0.985) ≈ #fafafa */
    --color-sidebar-primary:    hsl(17 69% 60%);   /* ember — same in both themes */
    --color-sidebar-accent:     hsl(40 5% 95%);    /* ≈ #f2f2f1 */
    --color-sidebar-foreground: hsl(0 0% 14.5%);   /* matches foreground light */
    --color-sidebar-border:     hsl(0 0% 92%);     /* matches border light */
    --color-highlight:          hsl(17 69% 60%);
    --color-highlight-match:    rgba(224, 120, 80, 0.2);
    --color-highlight-active:   rgba(224, 120, 80, 0.5);
  }
}
```

### Anti-pattern
- DO NOT use Hsla() instead of HSL + rgba mix — keep rgba() for transparent overlays exactly as desktop does.
- DO NOT skip light variants "because sessions-list will be dark-mostly" — TS-9 requires light parity.

## DESIGN

**References:**
- Red-hat review §7.4 missing-tokens table (full list with desktop values)
- Red-hat review §7.10 Priority 2 recommended diff
- `apps/desktop/src/renderer/globals.css` lines 17-309

**Pattern source:** `apps/desktop/src/renderer/globals.css:17-99`
**Anti-pattern:** Adding tokens that "feel right" without sourcing from desktop globals — manual color math diverges quickly.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| Dark count | `grep -A 200 "@variant dark" apps/mobile/global.css \| grep -cE -- "--color-(tertiary\|tertiary-active\|sidebar\|sidebar-primary\|sidebar-accent\|sidebar-foreground\|sidebar-border\|highlight\|highlight-match\|highlight-active):"` | 10 |
| Light count | `grep -A 200 "@variant light" apps/mobile/global.css \| grep -cE -- "--color-(tertiary\|tertiary-active\|sidebar\|sidebar-primary\|sidebar-accent\|sidebar-foreground\|sidebar-border\|highlight\|highlight-match\|highlight-active):"` | 10 |
| theme.ts mirror | `grep -cE "(tertiary\|tertiaryActive\|sidebar\|sidebarPrimary\|sidebarAccent\|sidebarForeground\|sidebarBorder\|highlight\|highlightMatch\|highlightActive):" apps/mobile/lib/theme.ts` | ≥ 20 |
| No component diff | `git diff --stat \| grep -E "apps/mobile/components/"` | empty |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |

## AGENT INSTRUCTIONS

1. READ desktop globals.css lines 17-99 to extract exact source values for all 10 tokens (both themes).
2. RED — grep mobile global.css for each token name; assert all 10 absent.
3. GREEN — append 10 lines to `@variant dark` block + 10 lines to `@variant light` block. Mirror 20 entries in lib/theme.ts.
4. (Optional) Add 10 swatch entries to the Colors story catalog so reviewers can preview.
5. Verify all 7 TCs.

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Pure CSS / theme-constant addition with no component logic, no animations, no expo-router. Native RN UI implementer domain.

## DEPENDENCIES

- **depends_on:** none (parallel to REMED-001/002/003, but coordinate to avoid simultaneous edits on the same file).
- **blocks:** none (purely additive; unblocks future sessions-list sprint).

## NOTES

This task INTENTIONALLY does not add components, stories, or any consumer
of the new tokens. Storybook Colors.stories.tsx swatch additions are
optional and may be added for reviewer preview — but no Sessions* or
Sidebar* component code is in scope. That's the next session's job.

If `--color-sidebar-primary` differs visually from `--color-primary`
(both ember), the difference is purely semantic — `--color-primary` is
mobile's ember for Buttons (rn-reusables Button variant="default" reads
this), and `--color-sidebar-primary` is desktop's ember for nav-active
state. They happen to have the same value but represent different
semantic uses. See REMED-005 for the documentation task.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN @variant dark block WHEN I grep for each of the 10 token names THEN all 10 are present", "verify": "grep -A 200 '@variant dark' apps/mobile/global.css | grep -cE -- '--color-(tertiary|tertiary-active|sidebar|sidebar-primary|sidebar-accent|sidebar-foreground|sidebar-border|highlight|highlight-match|highlight-active):'"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN @variant light block WHEN I grep for each of the 10 token names THEN all 10 are present", "verify": "grep -A 200 '@variant light' apps/mobile/global.css | grep -cE -- '--color-(tertiary|tertiary-active|sidebar|sidebar-primary|sidebar-accent|sidebar-foreground|sidebar-border|highlight|highlight-match|highlight-active):'"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN new tokens WHEN I HSL→hex convert each THEN each matches desktop within RGB ≤ 5", "verify": "scripted hex comparison"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN new CSS tokens WHEN I inspect lib/theme.ts THEN both .light and .dark have 10 camelCase mirrors each", "verify": "grep -cE '(tertiary|tertiaryActive|sidebar|sidebarPrimary|sidebarAccent|sidebarForeground|sidebarBorder|highlight|highlightMatch|highlightActive):' apps/mobile/lib/theme.ts"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN additions WHEN I run git diff --stat THEN no apps/mobile/components/ files modified", "verify": "git diff --stat | grep -E 'apps/mobile/components/'"},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN additions WHEN typecheck runs THEN EXIT 0", "verify": "cd apps/mobile && bun run typecheck"},
    {"id": "TC-1", "type": "test_criterion", "description": "10 new tokens present in @variant dark", "maps_to_ac": "AC-1", "verify": "grep count = 10"},
    {"id": "TC-2", "type": "test_criterion", "description": "10 new tokens present in @variant light", "maps_to_ac": "AC-2", "verify": "grep count = 10"},
    {"id": "TC-3", "type": "test_criterion", "description": "Each new dark token matches desktop within RGB ≤ 5", "maps_to_ac": "AC-3", "verify": "hex comparison"},
    {"id": "TC-4", "type": "test_criterion", "description": "Each new light token matches desktop within RGB ≤ 5", "maps_to_ac": "AC-3", "verify": "hex comparison"},
    {"id": "TC-5", "type": "test_criterion", "description": "THEME.light and THEME.dark each gain 10 new camelCase entries", "maps_to_ac": "AC-4", "verify": "grep count ≥ 20"},
    {"id": "TC-6", "type": "test_criterion", "description": "No files under apps/mobile/components/ modified", "maps_to_ac": "AC-5", "verify": "git diff filter"},
    {"id": "TC-7", "type": "test_criterion", "description": "bun run typecheck exits 0 after additions", "maps_to_ac": "AC-6", "verify": "bash exit code"}
  ]
}
-->
