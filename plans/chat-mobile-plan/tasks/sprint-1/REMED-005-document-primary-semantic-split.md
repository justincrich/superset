---
task_id: REMED-005
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: react-native-ui-implementer
estimate_minutes: 20
task_type: DOCS
status: Backlog
priority: P2
effort: XS
prd_refs: [TS-3, TS-9]
upstream_review: red-hat 2026-05-23 §7.1, §7.8 T-1, §7.10 Priority 4
---

# REMED-005 — Document mobile-vs-desktop `--color-primary` semantic split

## Background

**Problem:** The 2026-05-23 red-hat review identified the largest single
structural divergence between mobile and desktop themes:

- **Desktop dark** (`apps/desktop/src/renderer/globals.css:17-57`):
  `--color-primary = #eae8e6` (neutral foreground). Ember routes through
  `--sidebar-primary`, `--chart-1`, etc.
- **Mobile dark** (`apps/mobile/global.css`):
  `--color-primary = hsl(17 69% 60%)` (ember).

RGB distance: 183.9 (drastic). The drift is **intentional**: mobile uses
`react-native-reusables` Button primitive where `bg-primary` is the
default-variant fill — so making `primary = ember` produces correct
ember-colored buttons. Desktop uses shadcn Button where the primary
variant is a high-contrast neutral fill, and ember is reserved for
sidebar accents.

**Why it matters:** Without documentation, a future maintainer comparing
the two CSS files will see "primary is ember on mobile, neutral on
desktop" and "fix" one or the other — silently breaking either the Button
default or the sidebar-active state on whichever platform they touch.

**Current:** No comment in `apps/mobile/global.css` explains the split.

**Desired:** A comment block adjacent to `--color-primary` in both
`@variant light` and `@variant dark` documents the deliberate divergence
and points at this task / red-hat review. Optionally, an alias token
`--color-ember` is added so future code can use `bg-ember` unambiguously.

## CRITICAL CONSTRAINTS

- **MUST** add the comment in both `@variant light` AND `@variant dark` (one comment per block; they're parsed independently by Uniwind).
- **MUST** reference the red-hat review and the `react-native-reusables` Button precedent in the comment.
- **NEVER** change the actual `--color-primary` value — this task is documentation only.
- **MAY** optionally add `--color-ember` as an alias if it improves clarity (alias = same HSL string as primary).

## SPECIFICATION

**Objective:** Add a maintainer-facing comment block to `apps/mobile/global.css`
explaining why `--color-primary` is ember on mobile and neutral on desktop.

**Success state:** A code reviewer reading `apps/mobile/global.css` for
the first time understands the deliberate semantic split without needing
to cross-reference desktop or the red-hat review.

## ACCEPTANCE CRITERIA

### AC-1: dark-variant comment present
**Given** `apps/mobile/global.css` `@variant dark` block,
**When** I grep for the documentation marker,
**Then** a comment block adjacent to `--color-primary` references the desktop split.

**Verify:** `grep -B 5 -- "--color-primary:" apps/mobile/global.css | grep -E "desktop|sidebar-primary|rn-reusables|red-hat"` → returns 1+ matches

### AC-2: light-variant comment present
**Given** `apps/mobile/global.css` `@variant light` block,
**When** I grep for the same marker,
**Then** the same comment (or a one-liner pointing to the dark-block comment) is present.

**Verify:** `grep -B 5 -A 1 "@variant light" apps/mobile/global.css | head -50 | grep -i "primary"` → comment or pointer present

### AC-3: optional ember alias is internally consistent
**Given** the optional `--color-ember` alias,
**When** I extract its value,
**Then** if present, it equals `--color-primary` HSL string exactly (no divergence) AND is present in both light and dark blocks.

**Verify:** `grep -E -- "--color-(primary|ember):" apps/mobile/global.css` → primary + optional ember (if present) share values within each variant block

### AC-4: no functional change
**Given** the documentation edit,
**When** I run `cd apps/mobile && bun run typecheck`,
**Then** EXIT 0.

**Verify:** `cd apps/mobile && bun run typecheck` → EXIT 0

### AC-5: brief mention in 14-token-migration-audit.md
**Given** the documentation,
**When** I check `plans/chat-mobile-plan/14-token-migration-audit.md` (or a §7 addendum),
**Then** a paragraph notes the primary-semantic split as a known intentional divergence so the audit reflects current state.

**Verify:** `grep -n -A 3 "primary" plans/chat-mobile-plan/14-token-migration-audit.md | grep -i "ember\|sidebar\|deliberate"` → 1+ match

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | Comment in @variant dark mentions desktop split + rn-reusables OR red-hat review | AC-1 | grep |
| TC-2 | @variant light has comment or pointer | AC-2 | grep |
| TC-3 | If `--color-ember` alias exists, its value equals `--color-primary` exactly in both variants | AC-3 | grep both, assert equal |
| TC-4 | `bun run typecheck` exits 0 | AC-4 | bash exit code |
| TC-5 | 14-token-migration-audit.md has a paragraph noting the intentional primary divergence | AC-5 | grep |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `apps/desktop/src/renderer/globals.css` | 17-57 | Desktop `--color-primary` + `--sidebar-primary` for reference |
| `apps/mobile/global.css` | `@variant dark/light` `--color-primary` lines | Where to add comments |
| `apps/mobile/components/ui/button.tsx` | full | The `bg-primary` consumer that motivates mobile's ember-as-primary choice |
| `plans/chat-mobile-plan/14-token-migration-audit.md` | §3, §6 | Audit context |

## GUARDRAILS

**WRITE-ALLOWED:**
- `apps/mobile/global.css` (MODIFY) — add comment block(s) only, NO value changes.
- `plans/chat-mobile-plan/14-token-migration-audit.md` (MODIFY) — append a short documentation paragraph.

**WRITE-PROHIBITED:**
- Any `--color-*` value (this is doc-only).
- `apps/mobile/lib/theme.ts` (no functional change needed).
- `apps/desktop/**`, `packages/ui/**`, `designs/tokens/tokens.css`.

## CODE PATTERN

### Target comment (dark variant)
```css
@variant dark {
  :root {
    /* … existing tokens … */

    /*
     * NOTE — DELIBERATE CROSS-PLATFORM SPLIT (2026-05-23 red-hat review)
     *
     * Mobile binds `--color-primary` to EMBER (#e07850) because the
     * react-native-reusables Button primitive uses `bg-primary` for its
     * default variant — we want default-variant buttons to be ember.
     *
     * Desktop binds `--color-primary` to NEUTRAL FOREGROUND (#eae8e6)
     * and routes ember through `--sidebar-primary` + `--chart-1`. The
     * shadcn Button primitive there uses neutral default fill.
     *
     * Both are correct. DO NOT "align" mobile's primary to desktop's
     * neutral without updating every rn-reusables Button consumer.
     * See `apps/desktop/src/renderer/globals.css` for the desktop side,
     * `plans/chat-mobile-plan/14-token-migration-audit.md §7` for context.
     */
    --color-primary: hsl(17 69% 60%);          /* ember — intentional */
    --color-primary-foreground: hsl(13 16% 7%);

    /* … existing tokens … */
  }
}
```

### Target comment (light variant)
```css
@variant light {
  :root {
    /* … existing tokens … */

    /* See @variant dark for the cross-platform `--color-primary` split rationale. */
    --color-primary: hsl(17 69% 60%);
    --color-primary-foreground: hsl(13 16% 7%);

    /* … existing tokens … */
  }
}
```

### Optional ember alias
```css
/* In both variants, after --color-primary: */
--color-ember: var(--color-primary);   /* Semantic alias for ember-as-primary callers */
```

### Anti-pattern
- Adding the comment ONLY in dark and not light — Uniwind compiles each variant separately, maintainers may read only the light block.
- Changing the value while adding the comment "since we're touching the line anyway" — out of scope here.

## DESIGN

**References:**
- Red-hat review §7.1 architecture comparison, §7.2 T-1 mismatch row, §7.10 Priority 4
- `apps/desktop/src/renderer/globals.css:17-57`
- `apps/mobile/components/ui/button.tsx` (rn-reusables consumer)

**Pattern source:** Existing comment blocks in `apps/mobile/global.css` (e.g., the chat-domain tokens section)
**Anti-pattern:** Removing the comment in a future cleanup pass; documenting only as a commit message (lost on rebase).

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| Dark comment | `grep -B 5 -- "--color-primary:" apps/mobile/global.css \| grep -E "desktop\|sidebar-primary\|rn-reusables"` | 1+ match |
| Light pointer | `grep -B 3 -- "--color-primary:" apps/mobile/global.css \| grep -E "See @variant\|primary split"` | 1+ match (light block) |
| Ember alias parity | If `--color-ember` exists, grep both blocks; assert value identical to primary | match |
| Audit note | `grep -n "primary" plans/chat-mobile-plan/14-token-migration-audit.md \| grep -i "ember\|sidebar\|deliberate"` | 1+ match |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |

## AGENT INSTRUCTIONS

1. READ `apps/mobile/components/ui/button.tsx` to confirm `bg-primary` usage (justifies the split).
2. INSERT the dark-variant comment block above `--color-primary` in `@variant dark`.
3. INSERT the light-variant pointer above `--color-primary` in `@variant light`.
4. (Optional) ADD `--color-ember: var(--color-primary);` alias in both blocks if it improves call-site clarity.
5. APPEND a short paragraph (3-5 lines) to `14-token-migration-audit.md` noting the deliberate split as a known divergence.
6. Verify all 5 ACs.

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Documentation in mobile theme files + brief audit-doc paragraph. RN UI domain.

## DEPENDENCIES

- **depends_on:** REMED-001, REMED-002 (avoid simultaneous edits on the same lines)
- **blocks:** none

## NOTES

The optional `--color-ember` alias is recommended but not required. Argument
for it: future code that wants ember explicitly (independent of "primary"
semantics) can use `bg-ember` and be unambiguous. Argument against:
duplicates the token; minor maintenance debt.

This task is DOCS-only. No component code, no tests, no Storybook
changes. The 20-min estimate covers reading the consumer + writing the
comment + appending to the audit doc.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN @variant dark block WHEN I grep for the doc marker THEN a comment adjacent to --color-primary references desktop split", "verify": "grep -B 5 -- '--color-primary:' apps/mobile/global.css | grep -E 'desktop|sidebar-primary|rn-reusables|red-hat'"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN @variant light block WHEN I grep for the marker THEN the comment or pointer is present", "verify": "grep -B 5 -A 1 '@variant light' apps/mobile/global.css | head -50 | grep -i 'primary'"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN the optional --color-ember alias WHEN I extract its value THEN if present it equals --color-primary exactly in both variants", "verify": "grep -E -- '--color-(primary|ember):' apps/mobile/global.css"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN doc edits WHEN I run typecheck THEN EXIT 0", "verify": "cd apps/mobile && bun run typecheck"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN the documentation WHEN I check 14-token-migration-audit.md THEN a paragraph notes the primary-semantic split", "verify": "grep -n -A 3 'primary' plans/chat-mobile-plan/14-token-migration-audit.md | grep -i 'ember|sidebar|deliberate'"},
    {"id": "TC-1", "type": "test_criterion", "description": "Comment in @variant dark mentions desktop split + rn-reusables OR red-hat review", "maps_to_ac": "AC-1", "verify": "grep"},
    {"id": "TC-2", "type": "test_criterion", "description": "@variant light has comment or pointer", "maps_to_ac": "AC-2", "verify": "grep"},
    {"id": "TC-3", "type": "test_criterion", "description": "If --color-ember alias exists, value equals --color-primary in both variants", "maps_to_ac": "AC-3", "verify": "grep both, assert equal"},
    {"id": "TC-4", "type": "test_criterion", "description": "bun run typecheck exits 0", "maps_to_ac": "AC-4", "verify": "bash exit code"},
    {"id": "TC-5", "type": "test_criterion", "description": "14-token-migration-audit.md has paragraph noting intentional primary divergence", "maps_to_ac": "AC-5", "verify": "grep"}
  ]
}
-->
