# TASK: DESIGN-PLATF-003 — Iconography spec — Lucide icon set for chat actions

**TASK_TYPE:** DESIGN
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** XS
**ESTIMATE:** 30 min
**AGENT:** implementer=`frontend-designer` · reviewer=`design-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 115/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** Owns the canonical glyph→action mapping table and size-scale decisions; gates all implementer tasks that render icons

---

## OUTCOME

Any implementer can open the icon spec and, without consulting any other document, know the exact Lucide icon name, size in pt, strokeWidth, and token color to use for any chat-surface action.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- MUST produce a markdown icon spec at apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md — NO React code, NO TypeScript
- MUST commit to a single status-icon approach for ⌖ ⚠ ● ○ (Unicode glyphs OR Lucide icons, consistent with the decision in DESIGN-NAV-001) — the decision MUST be documented with rationale
- MUST use only --color-* tokens from apps/mobile/global.css for all color assignments — never hardcode hex or hsl values
- MUST specify strokeWidth={1.5} for ALL Lucide icons across all size tiers — no per-icon overrides

### NEVER
- NEVER hardcode hex or hsl color values — use CSS variable names only
- NEVER write TypeScript, JSX, or React component code
- NEVER mix Unicode glyph and Lucide icon approaches within the status-icon set

### STRICTLY
- All size values expressed in points (pt)
- The complete glyph→action mapping table must cover every action listed in the task brief — no omissions

---

## SPECIFICATION

**Objective:** Produce a markdown iconography spec defining: the four size tiers (16/20/24/48pt) and their use contexts; the complete glyph→action mapping table for all chat-surface actions; the universal strokeWidth={1.5} rule; the token color mapping for each icon context; and the status-icon decision (Unicode vs Lucide) with documented rationale. This spec becomes the cross-task icon reference that MOB-NAV-002, MOB-NAV-003, MOB-NAV-004, and MOB-NAV-008-UI all cite.

**Success state:** Any implementer can open the icon spec and, without consulting any other document, know the exact Lucide icon name, size in pt, strokeWidth, and token color to use for any chat-surface action.

---

## DONE WHEN

- [ ] [AC-1] Size-tier table
- [ ] [AC-2] Complete glyph→action mapping table
- [ ] [AC-3] Status-icon decision documented
- [ ] [AC-4] Universal strokeWidth rule stated
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — Size-tier table
**GIVEN** The icon spec is reviewed by any sessions-list implementer
**WHEN** The implementer reads the size-tier section
**THEN** The spec contains a table mapping each of the four size tiers to its use context: 16pt = inline status icons (SessionRow row indicators); 20pt = action icons in toolbars/footers; 24pt = navigation header icons; 48pt = empty-state illustration icons
**VERIFY:** ``

### AC-2 — Complete glyph→action mapping table
**GIVEN** The icon spec is reviewed by any sessions-list implementer
**WHEN** The implementer reads the mapping table
**THEN** The table covers all 25+ actions from the task brief: Send→Send, Stop→Square, Approve→Check, Decline→X, Close→X, ChevronExpand→ChevronDown, ChevronCollapse→ChevronUp, ChevronRight→ChevronRight, PlusFAB→Plus, Search→Search, Clear→X, ScrollToBottom→ArrowDown, Refresh→RefreshCw, Reasoning→Brain, Plan→ListChecks, ToolCall→Wrench, Streaming→Activity, HostOnline→Wifi, HostOffline→WifiOff, Bell→Bell, EmptyHost→Server, EmptyWorkspace→FolderOpen, EmptySessions→MessageSquare, NoSearch→SearchX, Monitor→Monitor, Cloud→Cloud; each row specifies: action name, Lucide icon name, size tier(s), and token color
**VERIFY:** ``

### AC-3 — Status-icon decision documented
**GIVEN** The icon spec is reviewed by a MOB-NAV-002 implementer
**WHEN** The implementer reads the Status Icon Decision section
**THEN** The spec states exactly one chosen approach (Unicode glyphs ⌖ ⚠ ● ○ OR Lucide icons) with documented rationale, and cross-references DESIGN-NAV-001 where the same decision applies; if Lucide approach is chosen, the table maps each status to a specific Lucide icon name and token color; if Unicode approach is chosen, the table maps each glyph to a token color
**VERIFY:** ``

### AC-4 — Universal strokeWidth rule stated
**GIVEN** The icon spec is reviewed by any implementer
**WHEN** The implementer reads the rendering rules section
**THEN** The spec states that ALL Lucide icons use strokeWidth={1.5} with no per-icon overrides, that color is always set via token prop (never hardcoded), and that icon size matches the pt value from the size-tier table (no visual scaling via transform)
**VERIFY:** ``


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | The icon spec file exists at apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md | AC-1 | test_criterion | `test -f apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS` |
| TC-2 | The icon spec contains the four size tiers: 16pt, 20pt, 24pt, and 48pt | AC-1 | test_criterion | `grep -q '16pt\\|16 pt' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && grep -q '20pt\\|20 pt' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && grep -q '48pt\\|48 pt' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS` |
| TC-3 | The icon spec contains strokeWidth={1.5} in the rendering rules | AC-4 | test_criterion | `grep -q 'strokeWidth\\|stroke-width\\|stroke width' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && grep -q '1.5' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS` |
| TC-4 | The icon spec contains a Status Icon Decision section | AC-3 | test_criterion | `grep -q 'Status Icon Decision\\|status-icon decision\\|status icon decision' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS` |
| TC-5 | HUMAN-VERIFIED: Mapping table covers all 25+ actions from the task brief; every color reference uses a --color- token name, not a hardcoded value | AC-2 | test_criterion | `HUMAN: open icon spec; count mapping-table rows (expect >= 25); grep for 'hsl(' or '#' in color columns (expect zero hits); cross-check icon names against lucide-react-native exports` |

---

## READING LIST

- `plans/chat-mobile-plan/09-uc-nav.md` (lines 60-70) — Status icons ⌖ ⚠ ● ○ definitions and their semantic meanings (streaming / pause-pending / idle / dormant)
- `apps/mobile/global.css` (lines 1-56) — All 20 semantic tokens — exclusive palette; all icon color assignments must reference these names
- `plans/20260521-mobile-chat-research.md` (lines 487-515) — strokeWidth={1.5} recommendation for size-3.5 (14px) icons on Retina; icon-name 1:1 lucide-react → lucide-react-native mapping
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 170-195) — 44pt hit-target rule; Tailwind→RN translation table (reference only — icons don't use Tailwind)

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md (NEW)

### WRITE PROHIBITED
- **/*.tsx — design tasks produce markdown only
- **/*.ts — design tasks produce markdown only
- apps/mobile/global.css — tokens are READ-ONLY
- Any file not listed in write_allowed

---

## DESIGN

### References
- plans/chat-mobile-plan/09-uc-nav.md lines 60-70 — status icon semantic definitions
- apps/mobile/global.css — 20 semantic tokens for all icon color assignments
- plans/20260521-mobile-chat-research.md lines 487-515 — strokeWidth recommendation

### Interaction notes
- ChevronDown appears twice in the table: once as ChevronExpand (WorkspaceSection collapse) and once as ScrollToBottom — the spec should note both usages to prevent implementer confusion
- X appears three times: Close (sheet), Decline (approval), Clear (search) — spec must note they share the same Lucide icon (X) but are assigned different token colors (--color-foreground for Close/Clear, --color-destructive for Decline)
- Monitor vs Cloud host icons: the host row renders Monitor for local hosts and Cloud for cloud/remote hosts — the spec should note the discriminator (e.g. host.type == 'local' ? Monitor : Cloud)
- Status icon Unicode vs Lucide decision carries across DESIGN-NAV-001 and DESIGN-PLATF-003 — they must agree; designer should decide once in DESIGN-PLATF-003 and DESIGN-NAV-001 cross-references it
- Brain icon (Reasoning): at 20pt size, strokeWidth={1.5} — verify lucide-react-native ships Brain; if not, substitute Cpu as fallback and note the fallback in the spec

### Pattern
lucide-react → lucide-react-native is a 1:1 icon-name swap per plans/20260521-mobile-chat-research.md §8.7 — use the same Lucide icon names the desktop uses; do not invent alternative names

**Pattern source:** plans/20260521-mobile-chat-research.md:487-515

### Anti-pattern
Do not hardcode a hex or hsl value anywhere in the icon spec — every color assignment must be expressed as a CSS variable name (--color-primary, --color-muted-foreground, etc.) so the implementer maps it through the theme system

---

## VERIFICATION GATES

### File existence
- **Command:** `test -f apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS || echo FAIL`
- **Expected:** PASS

### Four size tiers present
- **Command:** `grep -c 'pt' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md`
- **Expected:** >= 4 matches

### strokeWidth present
- **Command:** `grep -q '1.5' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS || echo FAIL`
- **Expected:** PASS

### No hardcoded colors
- **Command:** `grep -E 'hsl\(|#[0-9a-fA-F]{3,6}' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md | wc -l`
- **Expected:** 0 (no hardcoded color values)

### HUMAN visual review
- **Command:** `HUMAN: open icon spec; confirm mapping table completeness; confirm status-icon decision matches DESIGN-NAV-001`
- **Expected:** Reviewer signs off


---

## DEPENDENCIES

- **Depends on:** None
- **Blocks:** MOB-NAV-002, MOB-NAV-003, MOB-NAV-004, MOB-NAV-008-UI

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
      "description": "GIVEN the icon spec is reviewed by any sessions-list implementer, WHEN the implementer reads the size-tier section, THEN it contains a table mapping all four size tiers (16/20/24/48pt) to their use contexts",
      "verify": "HUMAN-VERIFIED: reviewer reads size-tier section and confirms all four tiers with contexts",
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
      "description": "GIVEN the icon spec is reviewed by any sessions-list implementer, WHEN the implementer reads the mapping table, THEN it covers all 25+ actions with icon name, size tier, and token color for each",
      "verify": "HUMAN-VERIFIED: reviewer reads mapping table and confirms completeness against task brief action list",
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
      "description": "GIVEN the icon spec is reviewed, WHEN the implementer reads the Status Icon Decision section, THEN exactly one approach is documented with rationale and cross-reference to DESIGN-NAV-001",
      "verify": "HUMAN-VERIFIED: reviewer reads Status Icon Decision section and confirms single approach chosen with rationale",
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
      "description": "GIVEN the icon spec is reviewed, WHEN the implementer reads the rendering rules section, THEN strokeWidth={1.5} and token-only color are stated as universal rules with no per-icon overrides",
      "verify": "HUMAN-VERIFIED: reviewer reads rendering rules and confirms strokeWidth and token-color rules are present",
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
      "description": "The icon spec file exists at apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md",
      "verify": "test -f apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS",
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
      "description": "The icon spec contains the four size tiers: 16pt, 20pt, 24pt, and 48pt",
      "verify": "grep -q '16pt' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && grep -q '20pt' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && grep -q '48pt' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS",
      "maps_to_ac": "AC-1",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "The icon spec contains strokeWidth={1.5} in the rendering rules",
      "verify": "grep -q 'strokeWidth\\|1.5' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS",
      "maps_to_ac": "AC-4",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "The icon spec contains a Status Icon Decision section",
      "verify": "grep -q 'Status Icon Decision\\|status icon decision' apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md && echo PASS",
      "maps_to_ac": "AC-3",
      "satisfied": null,
      "evidence": null,
      "remediation": null,
      "last_evaluated_cycle": null,
      "last_evaluated_commit": null
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "HUMAN-VERIFIED: Mapping table covers all 25+ actions; every color reference uses a --color- token name",
      "verify": "HUMAN: open icon spec; count mapping-table rows (expect >= 25); grep for 'hsl(' or '#' (expect zero hits in color columns)",
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
