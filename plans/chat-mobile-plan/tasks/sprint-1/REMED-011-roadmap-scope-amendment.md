---
task_id: REMED-011
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: claude
estimate_minutes: 45
task_type: DOCS
status: Backlog
priority: P1
effort: S
prd_refs: [ROADMAP Sprint 01]
upstream_review: red-hat 2026-05-23 contradictions C-1, C-2, C-3, C-4, C-5
---

# REMED-011 — ROADMAP.md scope amendment: reconcile manifest-vs-ROADMAP contradiction; defer missing tiers to specific sprints

## Background

**Problem:** The red-hat review surfaced 5 explicit contradictions between
`plans/chat-mobile-plan/ROADMAP.md` Sprint 01 (which says certain tiers
are REQUIRED for the Phase 1 gate) and `apps/mobile/design/manifest.json`
(which says those tiers were DEFERRED):

- **C-1**: ROADMAP TS-4 lists sessions-list tier as Sprint 01 required; manifest says deferred. (Parallel work as of 2026-05-23 is building sessions-list as "Wave 5" — needs to be reflected in ROADMAP.)
- **C-2**: TS-6 specifies TiptapPromptEditor; implementation uses Textarea. Not deferred anywhere, just silently substituted.
- **C-3**: ROADMAP cross-cutting note mandates `transition-* → Reanimated`; CollapsedBlock + PickerTrigger violate it. (REMED-007 fixes the code; ROADMAP should reflect this as a known remediation.)
- **C-4**: TS-7 names `PendingQuestionSheet`; built component is named `AskUserSheet` (view, not isolated molecule).
- **C-5**: TS-8 requires `RebableInSettingsBanner` + `NotificationIconPreview`; not built.

Without amending ROADMAP.md, every future reviewer hits the same gate
ambiguity: "is Sprint 01 done?" There is no canonical answer.

**Why it matters:** Sprint 2+ all depend on Sprint 01. With the gate
ambiguous, every dependency is also ambiguous. The PR shipping these
remediation tasks needs a ROADMAP that says explicitly what Sprint 01
covers + what got deferred where.

**Current:** ROADMAP.md Sprint 01 reads as "all-encompassing"; manifest
says "chat-view only"; reality is "chat-view + parallel-running
sessions-list" + "missing TiptapPromptEditor / MessageMarkdown /
PushPrePromptScreen / RebableInSettingsBanner / NotificationIconPreview /
NewChatSheet."

**Desired:** ROADMAP.md Sprint 01 explicitly lists what's IN-SCOPE +
what's been deferred to specific later sprints. A new "## Sprint 01 Scope
Resolution (2026-05-23)" section makes the truth explicit. The
sessions-list parallel work is acknowledged. The remaining missing tiers
each get a clear deferral target.

## CRITICAL CONSTRAINTS

- **MUST** NOT silently delete original Sprint 01 test steps — preserve them as historical scope; ANNOTATE with deferral status.
- **MUST** create explicit deferral entries with a target sprint for EACH missing tier (Sprint 02 / 03 / 04 / 05 / 06 / dedicated).
- **MUST** reference the red-hat review report by date (2026-05-23) for traceability.
- **MUST** update `apps/mobile/design/manifest.json` `build_plan.scope_note` to point at the new ROADMAP amendment.
- **NEVER** change Sprint 02-07 sprint structure in this task — only Sprint 01 amendment + manifest cross-reference.

## SPECIFICATION

**Objective:** Add a "## Sprint 01 Scope Resolution" section to ROADMAP.md
that maps every TS-1 through TS-9 deliverable to its actual status:
COMPLETED in chat-view tier, COMPLETED in sessions-list parallel work,
DEFERRED to Sprint NN (with explicit target), or WAIVED (with rationale).

**Success state:** A reviewer reading the ROADMAP can trace any Sprint 01
TS item to its status without needing to cross-reference the manifest,
the red-hat review, or commit history.

## ACCEPTANCE CRITERIA

### AC-1: Sprint 01 Scope Resolution section added
**Given** ROADMAP.md,
**When** I grep for the new section,
**Then** a "## Sprint 01 Scope Resolution (2026-05-23)" header exists with content underneath.

**Verify:** `grep -n "Sprint 01 Scope Resolution\|Scope Resolution.*2026-05-23" plans/chat-mobile-plan/ROADMAP.md` → 1+ match

### AC-2: every TS-1 through TS-9 has a status
**Given** the new section,
**When** I inspect the resolution table/list,
**Then** every test step (TS-1 ... TS-9) has an explicit status: COMPLETED / DEFERRED-TO-SPRINT-NN / WAIVED.

**Verify:** `grep -E "TS-[1-9]" plans/chat-mobile-plan/ROADMAP.md | grep -iE "COMPLETED\|DEFERRED\|WAIVED"` → 9+ matches (one per TS)

### AC-3: each deferral cites a target sprint
**Given** any DEFERRED entry,
**When** I read it,
**Then** the deferral cites a specific target sprint (Sprint NN) OR a dedicated session.

**Verify:** `grep -E "DEFERRED" plans/chat-mobile-plan/ROADMAP.md | grep -E "Sprint [0-9]+|dedicated session"` → matches all DEFERRED entries

### AC-4: missing components each have a target
**Given** the 5 missing-tier components from the red-hat review (TiptapPromptEditor, MessageMarkdown, NewChatSheet, PushPrePromptScreen, RebableInSettingsBanner, NotificationIconPreview),
**When** I grep the resolution section,
**Then** each component name appears with a clear "→ deferred to Sprint NN" or "→ Sprint 1b REMED-NNN" annotation.

**Verify:** For each of `TiptapPromptEditor|MessageMarkdown|NewChatSheet|PushPrePromptScreen|RebableInSettingsBanner|NotificationIconPreview` — `grep` finds it followed by "Sprint" within 100 chars

### AC-5: sessions-list parallel work acknowledged
**Given** sessions-list is being built in parallel ("Wave 5" tasks 501-504 in TaskList as of 2026-05-23),
**When** I read TS-4 status,
**Then** it acknowledges the parallel work AND links to where the built artifacts live (`apps/mobile/screens/sessions-list/`).

**Verify:** `grep -A 3 "TS-4" plans/chat-mobile-plan/ROADMAP.md | grep -E "sessions-list|Wave 5|screens/sessions-list"` → 1+ match

### AC-6: manifest cross-references the amendment
**Given** the amended ROADMAP,
**When** I read `apps/mobile/design/manifest.json` `build_plan.scope_note`,
**Then** the scope note references "ROADMAP Sprint 01 Scope Resolution".

**Verify:** `grep "Scope Resolution" apps/mobile/design/manifest.json` → 1+ match

### AC-7: contradictions C-1 through C-5 explicitly addressed
**Given** the red-hat review's 5 contradictions,
**When** I read the resolution section,
**Then** each contradiction (C-1, C-2, C-3, C-4, C-5) is explicitly named + resolved (either via remediation task ID OR formal deferral).

**Verify:** `grep -E "C-[1-5]" plans/chat-mobile-plan/ROADMAP.md` → 5+ matches (one per contradiction)

### AC-8: no Sprint 02-07 structural changes
**Given** the ROADMAP edits,
**When** I `git diff`,
**Then** no hunks fall inside Sprint 02 through Sprint 07 sprint sections (only Sprint 01 + a new resolution section).

**Verify:** `git diff plans/chat-mobile-plan/ROADMAP.md | grep -B 5 "Sprint 0[2-7]:\|## Sprint 0[2-7]"` → empty (no diff hunks near those headers)

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | "Sprint 01 Scope Resolution" section exists in ROADMAP.md | AC-1 | grep |
| TC-2 | Every TS-1 through TS-9 has explicit status | AC-2 | grep count ≥ 9 |
| TC-3 | Every DEFERRED entry cites a target sprint | AC-3 | grep filter |
| TC-4 | All 6 missing components are named + targeted | AC-4 | grep each |
| TC-5 | Sessions-list parallel work acknowledged with screen path link | AC-5 | grep TS-4 |
| TC-6 | manifest.json scope_note references "Scope Resolution" | AC-6 | grep |
| TC-7 | Contradictions C-1 through C-5 explicitly named in resolution | AC-7 | grep ≥ 5 |
| TC-8 | No Sprint 02-07 sections modified | AC-8 | git diff filter |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `plans/chat-mobile-plan/ROADMAP.md` | Sprint 01 §Test Steps + §Component Inventory | What was promised |
| `apps/mobile/design/manifest.json` | platforms.mobile-ios.build_plan | What was built (chat-view + Wave 5 sessions-list in progress) |
| `plans/chat-mobile-plan/SPRINT-01b-remediation.md` | full | Remediation scope (this sprint) |
| Red-hat review report (2026-05-23 in conversation) | §1 (AC verdict table), §6 (contradictions) | Source of truth on what's deferred vs done |
| `apps/mobile/screens/chat-view/` and `apps/mobile/screens/sessions-list/` (if present) | folder structure | Empirical evidence of what's been built |

## GUARDRAILS

**WRITE-ALLOWED:**
- `plans/chat-mobile-plan/ROADMAP.md` (MODIFY) — only Sprint 01 section + new "Scope Resolution" section at the end of Sprint 01.
- `apps/mobile/design/manifest.json` (MODIFY) — only `build_plan.scope_note` field.

**WRITE-PROHIBITED:**
- Any Sprint 02-07 content in ROADMAP.md.
- Any other manifest field.
- `01-scope.md` (the PRD itself — out of scope for this task).

## CODE / DOC PATTERN

### Target Sprint 01 Scope Resolution section (template)

Append to ROADMAP.md after Sprint 01's existing content:

```markdown
## Sprint 01 Scope Resolution (2026-05-23)

Per the 2026-05-23 frontend-designer red-hat review, this section
explicitly maps every Sprint 01 deliverable to its actual status. This
resolves the contradictions C-1 through C-5 the review surfaced between
the original ROADMAP scope and the actual implementation.

### Test Step Status

| TS  | Description                                       | Status                      | Reference |
|-----|---------------------------------------------------|-----------------------------|-----------|
| TS-1 | Phase 0 token migration audit ACs                 | COMPLETED (10/10 code; AC-7/8 RESOLVED via REMED-010) | REMED-010 |
| TS-2 | `bun storybook` launches + storybook.requires.ts  | COMPLETED                   | — |
| TS-3 | Design System group renders ember tokens          | COMPLETED                   | — |
| TS-4 | Sessions-list tier (9 components)                 | IN-PROGRESS (parallel Wave 5 — apps/mobile/screens/sessions-list/) | TaskList #501-504 |
| TS-5 | Chat-tree tier                                    | PARTIAL — MessageMarkdown DEFERRED to Sprint 03 | — |
| TS-6 | Composer tier (TiptapPromptEditor, NewChatSheet)  | PARTIAL — TiptapPromptEditor DEFERRED to Sprint 04; NewChatSheet DEFERRED to Sprint 04 | — |
| TS-7 | Pause-container tier                              | COMPLETED (AskUserSheet covers PendingQuestionSheet semantically; REMED-006 fixes Reject button) | REMED-006 |
| TS-8 | Platform-surface tier                             | PARTIAL — PushPrePromptScreen + RebableInSettingsBanner + NotificationIconPreview DEFERRED to Sprint 06 | — |
| TS-9 | Light/dark theme toggle works for every component | IN-PROGRESS — REMED-001..009 close the remaining drift + bypass | REMED-001..009 |

### Contradictions Addressed

- **C-1** (sessions-list deferred vs required): RESOLVED — sessions-list is now in-progress as "Wave 5" (parallel session); see TaskList #501-504; built artifacts live in `apps/mobile/screens/sessions-list/`. Once that work merges, TS-4 flips to COMPLETED.
- **C-2** (TiptapPromptEditor vs Textarea substitution): DEFERRED — Tiptap editor is rescoped to Sprint 04 (Compose + Send Integration), where the wiring to real send/stop is implemented anyway. Documented under Sprint 04's component inventory.
- **C-3** (transition-transform CSS in RN): RESOLVED by REMED-007 (Reanimated rotation replacement).
- **C-4** (PendingQuestionSheet naming vs AskUserSheet): RESOLVED via decision: keep `AskUserSheet` view name; future references to "PendingQuestionSheet" in Sprint 05+ tasks should resolve to `AskUserSheet`. The functional behavior is identical.
- **C-5** (TS-8 missing components): DEFERRED to Sprint 06 (Push Notifications), which already owns the push permission flow.

### Sprint Dependencies Updated

- **Sprint 02 (Sessions List Integration)**: NOT blocked by Sprint 01 sessions-list tier in isolation — Sprint 02 wires real data into the components Wave 5 is building in parallel. Both must land before Sprint 02 can fully ship, but Sprint 02 planning can proceed.
- **Sprint 03 (Chat View Read + Session Management)**: needs MessageMarkdown — add `MessageMarkdown` as a Sprint 03 component inventory item.
- **Sprint 04 (Compose + Send Integration)**: needs TiptapPromptEditor + NewChatSheet — add to Sprint 04 component inventory.
- **Sprint 06 (Push Notifications)**: needs PushPrePromptScreen + RebableInSettingsBanner + NotificationIconPreview — add to Sprint 06 component inventory (already partly listed there).
```

### Target manifest.json scope_note update

```jsonc
"scope_note": "Chat-view tier completed (Wave 1-4). Sessions-list tier in-progress (Wave 5). Other tiers DEFERRED per ROADMAP Sprint 01 Scope Resolution (2026-05-23): TiptapPromptEditor + NewChatSheet → Sprint 04, MessageMarkdown → Sprint 03, PushPrePromptScreen + RebableInSettingsBanner + NotificationIconPreview → Sprint 06. See plans/chat-mobile-plan/ROADMAP.md '## Sprint 01 Scope Resolution' for full status table."
```

### Anti-pattern
- Editing Sprint 02-07 content to "pre-add" the deferred components — premature; let those sprints' planning own their own inventories.
- Deleting the original Sprint 01 §Test Steps — destroys the historical scope record. APPEND a resolution table, don't OVERWRITE.

## DESIGN

**References:**
- Red-hat review §6 contradictions C-1 through C-5
- ROADMAP.md Sprint 01 §Test Steps + §Component Inventory
- manifest.json `build_plan.scope_note`
- REMED-001..010 task files (this sprint)

**Pattern source:** No precedent for ROADMAP amendment in this project; adopt the "append resolution section" idiom common in agile sprint retros.

**Anti-pattern:** Pretending Sprint 01 was complete-as-defined. Honest acknowledgment of deferrals + explicit targets is the goal.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| Resolution section | `grep -n "Sprint 01 Scope Resolution" plans/chat-mobile-plan/ROADMAP.md` | 1+ |
| TS coverage | `grep -E "TS-[1-9]" plans/chat-mobile-plan/ROADMAP.md \| grep -iE "COMPLETED\|DEFERRED\|WAIVED\|IN-PROGRESS\|PARTIAL"` | ≥ 9 |
| Component deferrals | `grep -E "TiptapPromptEditor\|MessageMarkdown\|NewChatSheet\|PushPrePromptScreen\|RebableInSettingsBanner\|NotificationIconPreview" plans/chat-mobile-plan/ROADMAP.md` | All 6 appear with target sprint nearby |
| Contradictions named | `grep -E "C-[1-5]" plans/chat-mobile-plan/ROADMAP.md` | ≥ 5 |
| Sessions-list ack | `grep -A 3 "TS-4" plans/chat-mobile-plan/ROADMAP.md \| grep -E "sessions-list\|Wave 5"` | 1+ |
| Manifest pointer | `grep "Scope Resolution" apps/mobile/design/manifest.json` | 1+ |
| No Sprint 2-7 diff | `git diff plans/chat-mobile-plan/ROADMAP.md \| grep -B 5 "Sprint 0[2-7]:"` | empty |

## AGENT INSTRUCTIONS

1. READ Sprint 01 §Test Steps + §Component Inventory in ROADMAP.md.
2. READ the red-hat review §6 contradictions (in conversation).
3. READ `apps/mobile/screens/` to confirm what's actually built (chat-view tier + sessions-list parallel work).
4. WRITE the "## Sprint 01 Scope Resolution (2026-05-23)" section at the end of the Sprint 01 block, using the template above.
5. UPDATE `apps/mobile/design/manifest.json` `build_plan.scope_note` to reference the new section.
6. VERIFY all 8 TCs.
7. Optionally cross-link Sprint 03/04/06 component inventories to mention the deferred items as "will be planned here when this sprint expands" — but DO NOT amend those sprint structures themselves; that's a future kb-sprint-plan job.

## AGENT ASSIGNMENT

**Agent:** `claude` (orchestrator / generalist)
**Rationale:** This task is pure documentation/scope-management work spanning multiple project artifacts. It doesn't fit any single specialist's domain. Default `claude` agent is appropriate.

## DEPENDENCIES

- **depends_on:** REMED-010 (the AC-7/8 resolution path determines TS-1 status text)
- **blocks:** Sprint 02 final planning (which needs unambiguous Sprint 01 status)

## NOTES

This is the closing remediation task. After it lands, anyone reading
`ROADMAP.md` can answer "is Sprint 01 done?" with confidence.

The new section is APPEND-ONLY — it does NOT delete or rewrite the
original Sprint 01 content. That preserves the historical scope record
(useful for retros + future PRD versioning).

If sessions-list Wave 5 work merges before this task ships, the TS-4 row
should flip from "IN-PROGRESS" to "COMPLETED" with a link to the Wave 5
commit/PR. Adjust accordingly during execution.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN ROADMAP.md WHEN I grep THEN a 'Sprint 01 Scope Resolution (2026-05-23)' section exists with content", "verify": "grep -n 'Sprint 01 Scope Resolution|Scope Resolution.*2026-05-23' plans/chat-mobile-plan/ROADMAP.md"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN resolution section WHEN I inspect THEN every TS-1..TS-9 has explicit status", "verify": "grep -E 'TS-[1-9]' plans/chat-mobile-plan/ROADMAP.md | grep -iE 'COMPLETED|DEFERRED|WAIVED'"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN any DEFERRED entry WHEN I read it THEN it cites a target sprint", "verify": "grep -E 'DEFERRED' ROADMAP.md | grep -E 'Sprint [0-9]+|dedicated session'"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN 5 missing-tier components WHEN I grep THEN each appears with target sprint", "verify": "grep each of TiptapPromptEditor|MessageMarkdown|NewChatSheet|PushPrePromptScreen|RebableInSettingsBanner|NotificationIconPreview"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN sessions-list parallel work WHEN I read TS-4 THEN it acknowledges the parallel work + screen path link", "verify": "grep -A 3 'TS-4' ROADMAP.md | grep -E 'sessions-list|Wave 5|screens/sessions-list'"},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN amended ROADMAP WHEN I read manifest scope_note THEN it references 'ROADMAP Sprint 01 Scope Resolution'", "verify": "grep 'Scope Resolution' apps/mobile/design/manifest.json"},
    {"id": "AC-7", "type": "acceptance_criterion", "description": "GIVEN red-hat contradictions WHEN I read resolution section THEN each of C-1..C-5 is named + resolved", "verify": "grep -E 'C-[1-5]' ROADMAP.md ≥ 5"},
    {"id": "AC-8", "type": "acceptance_criterion", "description": "GIVEN ROADMAP edits WHEN I git diff THEN no hunks in Sprint 02-07 sections", "verify": "git diff | grep -B 5 'Sprint 0[2-7]:'"},
    {"id": "TC-1", "type": "test_criterion", "description": "'Sprint 01 Scope Resolution' section exists", "maps_to_ac": "AC-1", "verify": "grep"},
    {"id": "TC-2", "type": "test_criterion", "description": "Every TS-1..TS-9 has explicit status", "maps_to_ac": "AC-2", "verify": "grep count ≥ 9"},
    {"id": "TC-3", "type": "test_criterion", "description": "Every DEFERRED entry cites a target sprint", "maps_to_ac": "AC-3", "verify": "grep filter"},
    {"id": "TC-4", "type": "test_criterion", "description": "All 6 missing components named + targeted", "maps_to_ac": "AC-4", "verify": "grep each"},
    {"id": "TC-5", "type": "test_criterion", "description": "Sessions-list parallel work acknowledged with screen path link", "maps_to_ac": "AC-5", "verify": "grep TS-4"},
    {"id": "TC-6", "type": "test_criterion", "description": "manifest.json scope_note references 'Scope Resolution'", "maps_to_ac": "AC-6", "verify": "grep manifest"},
    {"id": "TC-7", "type": "test_criterion", "description": "Contradictions C-1..C-5 explicitly named in resolution", "maps_to_ac": "AC-7", "verify": "grep ≥ 5"},
    {"id": "TC-8", "type": "test_criterion", "description": "No Sprint 02-07 sections modified", "maps_to_ac": "AC-8", "verify": "git diff filter"}
  ]
}
-->
