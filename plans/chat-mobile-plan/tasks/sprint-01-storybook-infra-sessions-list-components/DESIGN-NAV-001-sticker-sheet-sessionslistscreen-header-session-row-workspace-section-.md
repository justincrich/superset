# TASK: DESIGN-NAV-001 — Sticker sheet — SessionsListScreen header, session row, workspace section header, LoadMorePill

**TASK_TYPE:** DESIGN
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** M
**ESTIMATE:** 90 min
**AGENT:** implementer=`frontend-designer` · reviewer=`design-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 115/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** Owns visual specification of sessions-list-tier chat components; design decisions here gate every MOB-NAV-002/003/004 implementer task

---

## OUTCOME

A reviewer can open the sticker sheet markdown file and, without looking at any other document, derive the complete token color mapping, typography scale, spacing measurements, state matrix, and interaction affordances needed to implement and review each of the four component types at pixel-fidelity against design intent.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- MUST produce a markdown sticker sheet at apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md — NO React code, NO TypeScript
- MUST use only the 20 semantic tokens already defined in apps/mobile/global.css — never propose new tokens
- MUST specify 44pt minimum hit target for every interactive control per 05-ui-infrastructure.md
- MUST commit to a single status-icon approach across the entire sticker sheet: either Unicode glyphs (⌖ ⚠ ● ○) OR Lucide icons — implementer must not mix; document the decision and its rationale explicitly
- MUST NOT auto-reconcile the cool-neutral (mobile) vs warm-ember (desktop) palette delta — flag any cross-app divergence in a 'Palette Delta' callout section; this is an OPEN product decision

### NEVER
- NEVER reference or propose CSS variables not present in apps/mobile/global.css
- NEVER write TypeScript, JSX, or React component code in the sticker sheet
- NEVER silently resolve the status-icon approach — the choice must be documented with rationale

### STRICTLY
- All spacing and sizing values expressed in points (pt), not pixels or rems
- State matrices must cover every documented state from 09-uc-nav.md — no undocumented states added, no documented states omitted

---

## SPECIFICATION

**Objective:** Produce a comprehensive markdown sticker sheet specifying the visual design for four sessions-list-tier components: the SessionsListScreen header (title + HostChip + SessionSearchBar), the WorkspaceSection sticky header, the SessionRow, and the LoadMorePill. The sticker sheet becomes the single design source-of-truth that MOB-NAV-002, MOB-NAV-003, and MOB-NAV-004 reference when building Storybook stories.

**Success state:** A reviewer can open the sticker sheet markdown file and, without looking at any other document, derive the complete token color mapping, typography scale, spacing measurements, state matrix, and interaction affordances needed to implement and review each of the four component types at pixel-fidelity against design intent.

---

## DONE WHEN

- [ ] [AC-1] SessionsListScreen header specification
- [ ] [AC-2] WorkspaceSection sticky-header specification
- [ ] [AC-3] SessionRow state matrix
- [ ] [AC-4] LoadMorePill specification
- [ ] [AC-5] Status-icon approach documented with rationale
- [ ] [AC-6] Palette delta flagged
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — SessionsListScreen header specification
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-004 implementer
**WHEN** The implementer reads the header section
**THEN** The sheet specifies: background token --color-background; 'Sessions' title at 17sp semibold in --color-foreground; HostChip right-aligned at 32pt height with --color-secondary background and 44pt tap target; SessionSearchBar below the title row at 34pt height with search magnifier icon left and X affordance right; all interactive controls meet 44pt minimum
**VERIFY:** ``

### AC-2 — WorkspaceSection sticky-header specification
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-003 implementer
**WHEN** The implementer reads the WorkspaceSection header section
**THEN** The sheet specifies: --color-muted background; '{project · branch}' label at 14sp medium in --color-foreground; chevron icon in --color-muted-foreground; 44pt row height; sticky-pinned visual treatment (contact-directory pattern per 09-uc-nav.md §A4); collapsed (chevron right) and expanded (chevron down) states; collapse animation: Reanimated withTiming 150ms Easing.out
**VERIFY:** ``

### AC-3 — SessionRow state matrix
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-002 implementer
**WHEN** The implementer reads the SessionRow section
**THEN** The sheet contains a state matrix table covering all four status states (streaming/pause-pending/idle/dormant) with: the chosen status icon approach and its specific glyph or Lucide icon name per state; the token color applied to the status icon per state; row height 56pt; 16pt horizontal padding; 20pt status icon column; title at 15sp 1-line truncated in --color-foreground; timestamp at 12sp right-aligned in --color-muted-foreground; long-press affordance copy note
**VERIFY:** ``

### AC-4 — LoadMorePill specification
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-003 implementer
**WHEN** The implementer reads the LoadMorePill section
**THEN** The sheet specifies: --color-secondary background; 34pt height; --radius corners; horizontally centered; 'Load more (N more)' label text in --color-secondary-foreground; minimum 44pt tap target (taller than visual height if needed via padding); hidden state when displayedCount >= totalCount
**VERIFY:** ``

### AC-5 — Status-icon approach documented with rationale
**GIVEN** The sticker sheet document is opened
**WHEN** A reviewer reads the 'Status Icon Decision' section
**THEN** The sheet contains exactly one chosen approach (Unicode glyphs OR Lucide icons, not both), states the rationale for the choice (e.g. glyph approach: no dependency, zero render cost, visually distinct; Lucide approach: token-colored, consistent stroke, animatable), and cross-references DESIGN-PLATF-003 for the complete icon mapping
**VERIFY:** ``

### AC-6 — Palette delta flagged
**GIVEN** The sticker sheet document is opened
**WHEN** A reviewer reads the 'Palette Delta' callout
**THEN** The sheet contains a clearly-marked callout noting that mobile uses the cool-neutral palette (hsl values from apps/mobile/global.css) while desktop uses warm-ember, that cross-app alignment is an OPEN product decision, and that this sticker sheet specs mobile-only values
**VERIFY:** ``


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | The sticker sheet file exists at apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md | AC-1 | test_criterion | `test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS` |
| TC-2 | The sticker sheet contains a state matrix table for SessionRow covering streaming, pause-pending, idle, and dormant states | AC-3 | test_criterion | `grep -q 'streaming' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && grep -q 'pause.pending\\|pause-pending' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && grep -q 'dormant' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS` |
| TC-3 | The sticker sheet specifies 56pt row height for SessionRow | AC-3 | test_criterion | `grep -q '56pt\\|56 pt' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS` |
| TC-4 | The sticker sheet contains a 'Status Icon Decision' section naming exactly one chosen approach | AC-5 | test_criterion | `grep -q 'Status Icon Decision\\|status-icon decision\\|status icon decision' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS` |
| TC-5 | The sticker sheet contains a 'Palette Delta' callout referencing the open product decision | AC-6 | test_criterion | `grep -q 'Palette Delta\\|palette delta\\|cool-neutral\\|warm-ember' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS` |
| TC-6 | HUMAN-VERIFIED: Reviewer opens the sticker sheet and confirms all token references use only the 20 tokens from apps/mobile/global.css (no novel token names) | AC-1 | test_criterion | `HUMAN: Open apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md; grep for '--color-' occurrences; confirm every name matches the 20 tokens in apps/mobile/global.css` |

---

## READING LIST

- `plans/chat-mobile-plan/09-uc-nav.md` (lines 28-150) — Canonical ASCII wireframes §A/A2/A3/A4 — session row status icons (⌖ ⚠ ● ○), sticky-header scroll progression, LoadMorePill appearance
- `apps/mobile/global.css` (lines 1-56) — All 20 semantic tokens in @variant light and @variant dark — the complete and exclusive token palette for this sticker sheet
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 1-60) — Component tree with canonical file paths, 44pt hit-target rule, Tailwind→RN translation table, design token list confirmation
- `plans/20260521-mobile-chat-research.md` (lines 487-515) — Design-tokens audit: 80% desktop class parity, cool-neutral vs warm-ember delta, icon stroke-width recommendation
- `apps/desktop/src/renderer/components/Chat/ChatInterface` — Visual reference only — desktop component names and Tailwind class patterns; DO NOT copy JSX; note any warm-ember values as palette-delta callouts

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md (NEW)

### WRITE PROHIBITED
- **/*.tsx — design tasks produce markdown only, no React code
- **/*.ts — design tasks produce markdown only
- apps/mobile/global.css — tokens are READ-ONLY; never add new tokens
- Any file not listed in write_allowed

---

## DESIGN

### References
- plans/chat-mobile-plan/09-uc-nav.md §A/A2/A3/A4 — canonical wireframes
- apps/mobile/global.css — 20 semantic tokens (cool-neutral palette)
- apps/mobile/lib/theme.ts — THEME.light/dark resolved values for reference
- plans/20260521-mobile-chat-research.md §8.7 — design-tokens audit

### Interaction notes
- SessionRow long-press: must note that long-press copies session title to clipboard — specify which RN API (Clipboard.setString) and that the affordance is invisible until held
- WorkspaceSection chevron rotation: specify ChevronRight (collapsed) → ChevronDown (expanded) via Reanimated withTiming 150ms Easing.out on the `rotate` transform
- LoadMorePill tap: specify onPress appends next 5 sessions to that section in-place; pill disappears when displayedCount >= totalCount
- HostChip tap target: visual height 32pt but tap target must be 44pt — use paddingVertical to expand touch area without changing visual size
- SessionSearchBar X clear: only visible when query.length > 0; tap resets to empty and dismisses keyboard

### Pattern
Desktop ChatInterface component names mirror mobile names 1:1 per plans/20260521-mobile-chat-research.md §8.1 — the sticker sheet should use those same names

**Pattern source:** plans/20260521-mobile-chat-research.md:408-434

### Anti-pattern
Do not reference Tailwind utility classes (e.g. `bg-secondary`, `text-muted-foreground`) in the sticker sheet — use CSS variable names (`--color-secondary`, `--color-muted-foreground`) and pt values so the spec is RN-idiomatic; the implementer handles the Tailwind class translation

---

## VERIFICATION GATES

### File existence
- **Command:** `test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS || echo FAIL`
- **Expected:** PASS

### State matrix present
- **Command:** `grep -c 'streaming\|pause\|dormant' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md`
- **Expected:** >= 3 matches

### No novel tokens
- **Command:** `HUMAN: grep --color -n -- '--color-' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md | grep -v 'background\|foreground\|card\|popover\|primary\|secondary\|muted\|accent\|destructive\|border\|input\|ring\|radius'`
- **Expected:** No output (all token names matched)

### HUMAN visual review
- **Command:** `HUMAN: open sticker sheet; verify SessionRow, WorkspaceSection, LoadMorePill sections are complete and consistent with 09-uc-nav.md wireframes`
- **Expected:** Reviewer signs off


---

## DEPENDENCIES

- **Depends on:** None
- **Blocks:** MOB-NAV-002, MOB-NAV-003, MOB-NAV-004

---

## CODING STANDARDS

- `AGENTS.md`
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md`

---

## QUALITY RUBRIC SCORE

**Total: 115/115** ✅ PASS

| Section | Earned / Max |
|---------|--------------|
| CRITICAL CONSTRAINTS | 13/13 |
| SPECIFICATION | 10/10 |
| ACCEPTANCE CRITERIA | 25/25 |
| TEST CRITERIA | 15/15 |
| STABLE REQUIREMENT IDS | 5/5 |
| GUARDRAILS | 7/7 |
| DESIGN | 10/10 |
| VERIFICATION GATES | 15/15 |
| AGENT ASSIGNMENT | 5/5 |
| ESTIMATE | 5/5 |
| CODING STANDARDS | 5/5 |

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-004 implementer, WHEN the implementer reads the header section, THEN it specifies background token, title typography, HostChip dimensions, SessionSearchBar dimensions, and 44pt minimum for all interactive controls",
      "verify": "HUMAN-VERIFIED: reviewer reads sticker sheet header section and confirms all listed specs are present",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-003 implementer, WHEN the implementer reads the WorkspaceSection header section, THEN it specifies background token, label typography, chevron token color, 44pt row height, sticky visual treatment, collapsed/expanded states, and collapse animation spec",
      "verify": "HUMAN-VERIFIED: reviewer reads WorkspaceSection section and confirms all listed specs",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-002 implementer, WHEN the implementer reads the SessionRow section, THEN it contains a state matrix covering streaming/pause-pending/idle/dormant with status icon, token color, 56pt height, 16pt padding, 20pt icon column, title/timestamp typography, and long-press note",
      "verify": "HUMAN-VERIFIED: reviewer reads SessionRow section and confirms state matrix completeness",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-003 implementer, WHEN the implementer reads the LoadMorePill section, THEN it specifies --color-secondary background, 34pt height, --radius corners, centered layout, label text, and hidden condition",
      "verify": "HUMAN-VERIFIED: reviewer reads LoadMorePill section and confirms all listed specs",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN the sticker sheet document is opened, WHEN a reviewer reads the Status Icon Decision section, THEN exactly one approach is chosen (Unicode OR Lucide) with documented rationale and cross-reference to DESIGN-PLATF-003",
      "verify": "HUMAN-VERIFIED: reviewer reads Status Icon Decision section and confirms single approach chosen with rationale",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN the sticker sheet document is opened, WHEN a reviewer reads the Palette Delta callout, THEN it clearly marks the cool-neutral vs warm-ember divergence as an OPEN product decision without auto-reconciling",
      "verify": "HUMAN-VERIFIED: reviewer reads Palette Delta callout and confirms it flags but does not resolve the divergence",
      "maps_to_ac": null,
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "The sticker sheet file exists at apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md",
      "verify": "test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS",
      "maps_to_ac": "AC-1",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "The sticker sheet contains a state matrix table for SessionRow covering streaming, pause-pending, idle, and dormant states",
      "verify": "grep -q 'streaming' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && grep -q 'pause' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && grep -q 'dormant' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS",
      "maps_to_ac": "AC-3",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "The sticker sheet specifies 56pt row height for SessionRow",
      "verify": "grep -q '56pt\\|56 pt' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS",
      "maps_to_ac": "AC-3",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "The sticker sheet contains a Status Icon Decision section naming exactly one chosen approach",
      "verify": "grep -q 'Status Icon Decision\\|status-icon decision\\|status icon decision' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS",
      "maps_to_ac": "AC-5",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "The sticker sheet contains a Palette Delta callout referencing the open product decision",
      "verify": "grep -q 'Palette Delta\\|palette delta\\|cool-neutral\\|warm-ember' apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md && echo PASS",
      "maps_to_ac": "AC-6",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "HUMAN-VERIFIED: Every --color- reference in the sticker sheet matches one of the 20 tokens in apps/mobile/global.css",
      "verify": "HUMAN: grep all '--color-' from the sticker sheet; cross-check each name against apps/mobile/global.css",
      "maps_to_ac": "AC-1",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    }
  ]
}
-->
