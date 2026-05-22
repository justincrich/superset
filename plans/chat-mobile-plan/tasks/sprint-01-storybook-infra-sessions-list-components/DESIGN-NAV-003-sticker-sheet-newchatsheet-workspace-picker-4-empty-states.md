# TASK: DESIGN-NAV-003 — Sticker sheet — NewChatSheet (workspace picker) + 4 empty states

**TASK_TYPE:** DESIGN
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** S
**ESTIMATE:** 60 min
**AGENT:** implementer=`frontend-designer` · reviewer=`design-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 112/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** Owns visual specification of the NewChatSheet and four empty-state variants; gates MOB-NAV-004 implementer task for SessionsEmptyState

---

## OUTCOME

A reviewer can open the sticker sheet and derive every token color, typography spec, icon name and size, spacing measurement, and CTA affordance needed to implement all four empty-state variants and the NewChatSheet at pixel-fidelity.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- MUST produce a markdown sticker sheet at apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md — NO React code, NO TypeScript
- MUST use only the 20 semantic tokens already defined in apps/mobile/global.css — never propose new tokens
- MUST specify all four empty-state variants: no-hosts (UC-NAV-06.1), no-workspaces (UC-NAV-06.2), no-sessions (UC-NAV-06.3), and no-search-results (UC-NAV-07)
- MUST specify 44pt minimum hit target for all interactive controls (workspace rows, CTA buttons, clear-search text button)
- MUST NOT auto-reconcile the cool-neutral (mobile) vs warm-ember (desktop) palette delta

### NEVER
- NEVER reference or propose CSS variables not in apps/mobile/global.css
- NEVER write TypeScript, JSX, or React component code
- NEVER conflate the NewChatSheet workspace rows with the SessionRow component — these are distinct components with different heights and data

### STRICTLY
- All sizing values expressed in points (pt)
- Empty-state icons must use the Lucide icon names specified in the task brief and cross-reference DESIGN-PLATF-003 for the 48pt size tier

---

## SPECIFICATION

**Objective:** Produce a markdown sticker sheet specifying the visual design for the NewChatSheet bottom sheet (workspace picker) and the four SessionsEmptyState variants. The sticker sheet becomes the single design source-of-truth for the MOB-NAV-004 implementer building SessionsEmptyState and for the MOB-NAV-008-UI analogue for NewChatSheet.

**Success state:** A reviewer can open the sticker sheet and derive every token color, typography spec, icon name and size, spacing measurement, and CTA affordance needed to implement all four empty-state variants and the NewChatSheet at pixel-fidelity.

---

## DONE WHEN

- [ ] [AC-1] NewChatSheet chrome and workspace-row specification
- [ ] [AC-2] no-hosts empty state (UC-NAV-06.1)
- [ ] [AC-3] no-workspaces empty state (UC-NAV-06.2)
- [ ] [AC-4] no-sessions and no-search-results empty states
- [ ] [AC-5] All empty states use center-aligned layout
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — NewChatSheet chrome and workspace-row specification
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-004 implementer
**WHEN** The implementer reads the NewChatSheet section
**THEN** The sheet specifies: sheet chrome (handle identical to DESIGN-NAV-002); 'Start a new chat' title at 17sp semibold; X close 44pt; workspace row at 56pt height with project · branch at 15sp medium and meta line at 12sp in --color-muted-foreground; sort treatment (workspaces-with-sessions first by recent activity, empty workspaces after); empty-picker inline message when host has zero workspaces
**VERIFY:** ``

### AC-2 — no-hosts empty state (UC-NAV-06.1)
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-004 implementer
**WHEN** The implementer reads the no-hosts empty-state section
**THEN** The sheet specifies: Lucide Server icon 48pt in --color-muted; 'No devices yet' heading at 18sp in --color-foreground; body 'Connect a device from the Workspaces tab.' in --color-muted-foreground; primary CTA button 'Go to Workspaces' at 44pt height in --color-primary / --color-primary-foreground; HostChip omitted from header in this state
**VERIFY:** ``

### AC-3 — no-workspaces empty state (UC-NAV-06.2)
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-004 implementer
**WHEN** The implementer reads the no-workspaces empty-state section
**THEN** The sheet specifies: Lucide FolderOpen icon 48pt in --color-muted; 'No workspaces on this host' heading at 18sp; body 'Create a workspace from desktop.'; no CTA button; HostChip retained in header in this state
**VERIFY:** ``

### AC-4 — no-sessions and no-search-results empty states
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-004 implementer
**WHEN** The implementer reads the no-sessions and no-search sections
**THEN** The sheet specifies for no-sessions (UC-NAV-06.3): Lucide MessageSquare 48pt --color-muted; 'Start your first chat' heading; 'Tap + to pick a workspace.' body; FAB visually accented (note: accent is a visual treatment on the existing FAB, not a separate component). And for no-search (UC-NAV-07): Lucide SearchX 48pt --color-muted; 'No matches' heading; body referencing the query string as a placeholder; 'Clear search' text button in --color-primary at 44pt tap target
**VERIFY:** ``

### AC-5 — All empty states use center-aligned layout
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-004 implementer
**WHEN** The implementer reads the layout-spec section
**THEN** The sheet specifies that all four empty states use center-aligned layout (icon + heading + body + optional CTA stacked vertically), with consistent vertical spacing values in pt between each element, and that the layout fills the available space between the header and the FAB
**VERIFY:** ``


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | The sticker sheet file exists at the correct path | AC-1 | test_criterion | `test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && echo PASS` |
| TC-2 | The sticker sheet contains all four empty-state variant names | AC-2 | test_criterion | `grep -q 'no-hosts\\|no hosts' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'no-workspaces\\|no workspaces' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'no-sessions\\|no sessions' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'no-search\\|no search\\|no matches\\|no.results' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && echo PASS` |
| TC-3 | The sticker sheet references Lucide icons Server, FolderOpen, MessageSquare, and SearchX | AC-2 | test_criterion | `grep -q 'Server' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'FolderOpen' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'MessageSquare' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'SearchX' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && echo PASS` |
| TC-4 | HUMAN-VERIFIED: Reviewer confirms all four empty-state variants match 09-uc-nav.md §E wireframes and no novel token names are introduced | AC-2 | test_criterion | `HUMAN: open sticker sheet; verify four empty-state sections against 09-uc-nav.md §E; grep all '--color-' names against apps/mobile/global.css` |

---

## READING LIST

- `plans/chat-mobile-plan/09-uc-nav.md` (lines 175-250) — §C wireframe for NewChatSheet workspace picker; §E wireframes for all three empty states (no-hosts / no-workspaces / no-sessions); §A3 for no-search-results empty state
- `apps/mobile/global.css` (lines 1-56) — All 20 semantic tokens — exclusive palette for this sticker sheet
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 1-30) — SessionsEmptyState canonical path and UC-NAV-06 four-state renderer description

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md (NEW)

### WRITE PROHIBITED
- **/*.tsx — design tasks produce markdown only
- **/*.ts — design tasks produce markdown only
- apps/mobile/global.css — tokens are READ-ONLY
- Any file not listed in write_allowed

---

## DESIGN

### References
- plans/chat-mobile-plan/09-uc-nav.md §C and §E — NewChatSheet and empty-state wireframes
- plans/chat-mobile-plan/09-uc-nav.md §A3 lines 96-134 — no-search-results empty state
- apps/mobile/global.css — 20 semantic tokens

### Interaction notes
- no-hosts CTA 'Go to Workspaces': taps navigate to the (home)/workspaces tab — note this is a tab-switch, not a sheet dismiss; specify it as a primary action button at full width 44pt height
- no-search 'Clear search' affordance: text button (no background) in --color-primary at 44pt minimum tap height — not a filled button
- FAB visual accent in no-sessions state: the FAB is the same NewChatFab component but optionally with a subtle pulse animation or elevated shadow — sticker sheet should spec the specific treatment (e.g. Reanimated scale pulse 1.0→1.05→1.0, 1.5s loop) without requiring a new component
- NewChatSheet workspace rows: 56pt height aligns with SessionRow but the label is 'project · branch' at 15sp medium (same) and the meta line is 'N sessions · Xm ago' (different content) — ensure the sticker sheet makes this distinction clear
- Empty workspace row in NewChatSheet: show label and 'no sessions yet' meta in --color-muted-foreground; sorted after workspaces-with-sessions

### Pattern
Empty-state layout pattern mirrors the cadra-app ConversationPlaceholder: icon 48pt centered, heading 18sp centered, body 14sp centered, optional CTA 44pt centered below body

**Pattern source:** plans/20260521-mobile-chat-research.md:408-434

### Anti-pattern
Do not spec the NewChatSheet workspace picker as a variant of the HostPickerSheet — they share chrome structure but have distinct row content and heights; keep them as separate sections in this sticker sheet

---

## VERIFICATION GATES

### File existence
- **Command:** `test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && echo PASS || echo FAIL`
- **Expected:** PASS

### All four empty-state variants present
- **Command:** `grep -c 'no-hosts\|no-workspaces\|no-sessions\|no-search\|no matches' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md`
- **Expected:** >= 4 matches

### HUMAN visual review
- **Command:** `HUMAN: open sticker sheet; verify NewChatSheet and all four empty-state variants are complete against wireframes`
- **Expected:** Reviewer signs off


---

## DEPENDENCIES

- **Depends on:** None
- **Blocks:** MOB-NAV-004

---

## CODING STANDARDS

- `AGENTS.md`
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md`

---

## QUALITY RUBRIC SCORE

**Total: 112/115** ✅ PASS

| Section | Earned / Max |
|---------|--------------|
| CRITICAL CONSTRAINTS | 13/13 |
| SPECIFICATION | 10/10 |
| ACCEPTANCE CRITERIA | 25/25 |
| TEST CRITERIA | 12/15 |
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
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-004 implementer, WHEN the implementer reads the NewChatSheet section, THEN it specifies sheet chrome, workspace-row height and typography, sort treatment, and empty-picker inline message",
      "verify": "HUMAN-VERIFIED: reviewer reads NewChatSheet section and confirms all listed specs",
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
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-004 implementer, WHEN the implementer reads the no-hosts empty-state section, THEN it specifies Lucide Server icon, headings, body, CTA button, and header behavior",
      "verify": "HUMAN-VERIFIED: reviewer reads no-hosts section and confirms all listed specs",
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
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-004 implementer, WHEN the implementer reads the no-workspaces empty-state section, THEN it specifies Lucide FolderOpen icon, headings, body, and absence of CTA",
      "verify": "HUMAN-VERIFIED: reviewer reads no-workspaces section and confirms all listed specs",
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
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-004 implementer, WHEN the implementer reads the no-sessions and no-search sections, THEN both variants are fully specified with icon, heading, body, and CTA/affordance",
      "verify": "HUMAN-VERIFIED: reviewer reads both sections and confirms all listed specs",
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
      "description": "GIVEN the sticker sheet is reviewed, WHEN the implementer reads the layout-spec section, THEN all four empty states specify center-aligned vertical stacking with pt spacing values",
      "verify": "HUMAN-VERIFIED: reviewer reads layout-spec and confirms center-alignment and spacing values are present for all four variants",
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
      "description": "The sticker sheet file exists at the correct path",
      "verify": "test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && echo PASS",
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
      "description": "The sticker sheet contains all four empty-state variant names",
      "verify": "grep -q 'no-hosts\\|no hosts' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'no-workspaces\\|no workspaces' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'no-sessions\\|no sessions' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'no-search\\|no search\\|no matches' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && echo PASS",
      "maps_to_ac": "AC-2",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "The sticker sheet references Lucide icons Server, FolderOpen, MessageSquare, and SearchX",
      "verify": "grep -q 'Server' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'FolderOpen' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'MessageSquare' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && grep -q 'SearchX' apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md && echo PASS",
      "maps_to_ac": "AC-2",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "HUMAN-VERIFIED: All four empty-state variants match 09-uc-nav.md §E wireframes; no novel tokens introduced",
      "verify": "HUMAN: open sticker sheet; verify four empty-state sections against 09-uc-nav.md §E; grep all '--color-' names against apps/mobile/global.css",
      "maps_to_ac": "AC-2",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    }
  ]
}
-->
