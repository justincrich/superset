# TASK: DESIGN-NAV-002 — Sticker sheet — HostPickerSheet (host picker bottom sheet)

**TASK_TYPE:** DESIGN
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** S
**ESTIMATE:** 45 min
**AGENT:** implementer=`frontend-designer` · reviewer=`design-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 115/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** Owns visual specification of the HostPickerSheet bottom sheet; gates MOB-NAV-008-UI implementer task

---

## OUTCOME

A reviewer can open the sticker sheet and, without referencing any other document, derive every token color, dimension, typography spec, and state variant needed to implement and review HostPickerSheet at pixel-fidelity.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- MUST produce a markdown sticker sheet at apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md — NO React code, NO TypeScript
- MUST use only the 20 semantic tokens already defined in apps/mobile/global.css — never propose new tokens
- MUST specify 44pt minimum hit target for every interactive control (host row, close button)
- MUST specify all five documented host-row states: online-selected, online-unselected, offline-unselected, loading, empty-list
- MUST NOT auto-reconcile the cool-neutral (mobile) vs warm-ember (desktop) palette delta — flag divergence in a Palette Delta callout

### NEVER
- NEVER reference or propose CSS variables not in apps/mobile/global.css
- NEVER write TypeScript, JSX, or React component code in the sticker sheet
- NEVER specify snap-point implementation details (those belong in MOB-NAV-008-UI) — spec the visual layer only

### STRICTLY
- All sizing values expressed in points (pt)
- Sheet handle must be specified as a pill shape with exact dimensions from 09-uc-nav.md §B

---

## SPECIFICATION

**Objective:** Produce a markdown sticker sheet specifying the visual design for the HostPickerSheet bottom sheet: the sheet handle pill, the header row, the section label, each host-row variant, and the selection indicator. The sticker sheet becomes the single design source-of-truth for MOB-NAV-008-UI.

**Success state:** A reviewer can open the sticker sheet and, without referencing any other document, derive every token color, dimension, typography spec, and state variant needed to implement and review HostPickerSheet at pixel-fidelity.

---

## DONE WHEN

- [ ] [AC-1] Sheet chrome specification
- [ ] [AC-2] Host-row state matrix
- [ ] [AC-3] Section label specification
- [ ] [AC-4] Palette delta flagged
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — Sheet chrome specification
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-008-UI implementer
**WHEN** The implementer reads the sheet-chrome section
**THEN** The sheet specifies: handle pill dimensions 32×4pt in --color-border with 8pt top margin; 'Switch host' title at 17sp semibold in --color-foreground; X close button at 44pt × 44pt tap target right-aligned; sheet background --color-background
**VERIFY:** ``

### AC-2 — Host-row state matrix
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-008-UI implementer
**WHEN** The implementer reads the host-row section
**THEN** The sheet contains a state matrix table covering all five states — online-selected (check icon + --color-primary dot), online-unselected (--color-primary 8pt dot), offline-unselected (--color-muted-foreground indicator), loading (spinner placeholder), empty-list (empty state inline message) — with: 60pt row height; host icon (Lucide Monitor or Cloud) at 20pt in --color-foreground; host name at 15sp medium in --color-foreground; meta line at 12sp in --color-muted-foreground; Check icon 16pt --color-primary for selected state
**VERIFY:** ``

### AC-3 — Section label specification
**GIVEN** The sticker sheet is reviewed by a MOB-NAV-008-UI implementer
**WHEN** The implementer reads the section-label area
**THEN** The sheet specifies 'This organization' label at 12sp uppercase letter-spacing in --color-muted-foreground, with appropriate vertical padding above the first host row
**VERIFY:** ``

### AC-4 — Palette delta flagged
**GIVEN** The sticker sheet document is opened
**WHEN** A reviewer reads the Palette Delta callout
**THEN** The sheet contains a clearly-marked callout noting that mobile uses the cool-neutral palette while desktop uses warm-ember, that cross-app alignment is an OPEN product decision, and that this sticker sheet specs mobile-only values
**VERIFY:** ``


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | The sticker sheet file exists at apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md | AC-1 | test_criterion | `test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && echo PASS` |
| TC-2 | The sticker sheet contains all five host-row state names | AC-2 | test_criterion | `grep -q 'online-selected\\|online.selected' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && grep -q 'offline' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && grep -q 'loading' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && echo PASS` |
| TC-3 | The sticker sheet specifies 60pt host-row height | AC-2 | test_criterion | `grep -q '60pt\\|60 pt' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && echo PASS` |
| TC-4 | HUMAN-VERIFIED: Every --color- reference in the sticker sheet matches one of the 20 tokens in apps/mobile/global.css | AC-1 | test_criterion | `HUMAN: grep all '--color-' from the sticker sheet; cross-check each name against apps/mobile/global.css` |

---

## READING LIST

- `plans/chat-mobile-plan/09-uc-nav.md` (lines 154-174) — §B wireframe for HostPickerSheet — handle, header, section label, host rows with online/offline badges and check indicator
- `apps/mobile/global.css` (lines 1-56) — All 20 semantic tokens — exclusive palette for this sticker sheet
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 1-30) — HostPickerSheet canonical path (screens/(authenticated)/(chat)/HostPickerSheet/), 44pt hit-target rule
- `apps/mobile/lib/theme.ts` (lines 1-46) — THEME.light/dark resolved HSL values for visual reference when designing states

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md (NEW)

### WRITE PROHIBITED
- **/*.tsx — design tasks produce markdown only
- **/*.ts — design tasks produce markdown only
- apps/mobile/global.css — tokens are READ-ONLY
- Any file not listed in write_allowed

---

## DESIGN

### References
- plans/chat-mobile-plan/09-uc-nav.md §B — HostPickerSheet wireframe
- apps/mobile/global.css — 20 semantic tokens

### Interaction notes
- Host row tap: tap → onSelect(host.id) → sheet closes; no real-state mutation at this layer (props-driven)
- Offline host row: tappable but tapping triggers offline-banner on the sessions list (not handled in this sheet — note as out-of-scope for the sticker sheet visual spec)
- Swipe-down / backdrop tap: standard @gorhom/bottom-sheet dismissal — no design spec needed, but note that the sticker sheet should include a 'dismissed' state as a logical end-state for the state matrix
- Online badge: use --color-primary 8pt filled circle OR 'online' text at 11sp — sticker sheet must choose one approach and document it; prefer the dot for scannability
- Offline badge: --color-muted-foreground at same position as online badge

### Pattern
Bottom-sheet chrome (handle + header + section label + scrollable list) mirrors the @gorhom/bottom-sheet pattern used in NewChatSheet (UC-NAV-04); both sheets use the same chrome template

**Pattern source:** plans/chat-mobile-plan/09-uc-nav.md:154-197

### Anti-pattern
Do not spec snap point percentages (50%/85%) in this design sticker sheet — those are implementation details for MOB-NAV-008-UI; this sheet specifies visual appearance in each state, not animation behavior

---

## VERIFICATION GATES

### File existence
- **Command:** `test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && echo PASS || echo FAIL`
- **Expected:** PASS

### Five states present
- **Command:** `grep -c 'online\|offline\|loading\|empty' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md`
- **Expected:** >= 4 matches

### HUMAN visual review
- **Command:** `HUMAN: open sticker sheet; verify all five host-row states and sheet chrome are fully specified against 09-uc-nav.md §B`
- **Expected:** Reviewer signs off


---

## DEPENDENCIES

- **Depends on:** None
- **Blocks:** MOB-NAV-008-UI

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
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-008-UI implementer, WHEN the implementer reads the sheet-chrome section, THEN it specifies handle pill dimensions, title typography, close button tap target, and sheet background token",
      "verify": "HUMAN-VERIFIED: reviewer reads sheet-chrome section and confirms all listed specs",
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
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-008-UI implementer, WHEN the implementer reads the host-row section, THEN it contains a state matrix table covering all five states with row height, icon spec, typography, and selection indicator for each",
      "verify": "HUMAN-VERIFIED: reviewer reads host-row section and confirms state matrix completeness",
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
      "description": "GIVEN the sticker sheet is reviewed by a MOB-NAV-008-UI implementer, WHEN the implementer reads the section-label area, THEN it specifies 12sp uppercase style in --color-muted-foreground with appropriate vertical padding",
      "verify": "HUMAN-VERIFIED: reviewer reads section-label spec and confirms typography and spacing",
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
      "description": "GIVEN the sticker sheet document is opened, WHEN a reviewer reads the Palette Delta callout, THEN it flags the cool-neutral vs warm-ember divergence as an OPEN product decision without auto-reconciling",
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
      "description": "The sticker sheet file exists at apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md",
      "verify": "test -f apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && echo PASS",
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
      "description": "The sticker sheet contains all five host-row state names",
      "verify": "grep -q 'online-selected\\|online.selected' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && grep -q 'offline' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && grep -q 'loading' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && echo PASS",
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
      "description": "The sticker sheet specifies 60pt host-row height",
      "verify": "grep -q '60pt\\|60 pt' apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md && echo PASS",
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
