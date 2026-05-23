---
task_id: REMED-010
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: frontend-designer
estimate_minutes: 90
task_type: DOCS
status: Backlog
priority: P1
effort: M
prd_refs: [TS-1 AC-7, TS-1 AC-8]
upstream_review: red-hat 2026-05-23 DG-4, R-5
---

# REMED-010 — Visual regression evidence: capture baselines OR formally waive in ROADMAP

## Background

**Problem:** Phase 0 token migration audit (`14-token-migration-audit.md`)
has 10 ACs. AC-7 + AC-8 require visual regression evidence:
- AC-7: "Visual baseline (0a) and post-migration (0e) screenshots captured
  for every screen in §3.1, light + dark"
- AC-8: "Reviewer signs off that every non-chat screen still renders
  correctly"

The red-hat review confirmed: NO baseline screenshots exist anywhere in
the worktree. The ember migration shipped (Path A committed 2026-05-22)
without proof that non-chat screens (sign-in, tasks, workspaces, more,
settings) still render correctly under the new tokens.

**Why it matters:** Non-chat screens use the same rn-reusables primitives
that now carry ember tokens. A regression in SignInScreen could prevent
test users from authenticating during Phase 2 sprints. Without baselines,
there's no way to prove "we didn't break anything."

**Current:** No `plans/chat-mobile-plan/visual-baseline-cool-neutral/`
folder, no post-migration evidence.

**Desired (TWO PATHS):**
- **Path A (rigorous):** Capture post-migration screenshots of all non-chat
  screens in both light + dark themes on iOS Simulator. Save as PNG to
  `plans/chat-mobile-plan/visual-postmigration-ember/`. Note that pre-migration
  baselines cannot be reconstructed (the cool-neutral commit is in git history
  but capturing live screenshots from the historical state requires checkout +
  rebuild). The post-migration capture serves as "current state of record."
- **Path B (waive):** Frontend-designer formally waives AC-7/AC-8 by
  amending `14-token-migration-audit.md` to acknowledge the gap and explain
  why current chat-view review is sufficient (e.g., "non-chat screens are
  out of the chat-mobile-plan scope; their visual review happens in their
  respective product owners' sprints").

Either path resolves the AC. Path B is faster; Path A produces durable
artifacts.

## CRITICAL CONSTRAINTS

- **MUST** pick exactly ONE path (A or B) — do not partially do both.
- **MUST** document the path-decision rationale in `14-token-migration-audit.md`.
- **IF Path A:** Screenshots MUST be captured on iOS Simulator at iPhone 15 Pro Max resolution (matching the device-bezel in `designs/` mocks). Both light + dark theme.
- **IF Path A:** Save to `plans/chat-mobile-plan/visual-postmigration-ember/` with descriptive filenames (e.g., `sign-in-light.png`, `tasks-dark.png`).
- **IF Path B:** The waiver MUST cite a concrete rationale, not "this is out of scope."
- **NEVER** ship without an explicit close on AC-7/AC-8 — silent omission is worse than either path.

## SPECIFICATION

**Objective:** Resolve `14-token-migration-audit.md` AC-7 + AC-8 by either
producing post-migration screenshots OR formally waiving with cited
rationale.

**Success state:** Reviewer can read `14-token-migration-audit.md`, find
the AC-7/AC-8 resolution block, and either (a) browse the screenshot
folder, OR (b) read the waiver rationale and accept it.

## ACCEPTANCE CRITERIA

### AC-1: path decision recorded
**Given** REMED-010 work,
**When** I read `14-token-migration-audit.md`,
**Then** a clear "Path A (capture)" OR "Path B (waive)" decision block is present with rationale.

**Verify:** `grep -n -B 1 -A 5 "AC-7\|AC-8" plans/chat-mobile-plan/14-token-migration-audit.md` → resolution block present

### AC-2 (Path A only): screenshots captured
**Given** Path A chosen,
**When** I list the `visual-postmigration-ember/` folder,
**Then** at least 10 PNG files exist (5 non-chat screens × 2 themes minimum: sign-in, tasks, workspaces, more, settings).

**Verify:** `ls plans/chat-mobile-plan/visual-postmigration-ember/*.png | wc -l` → ≥ 10. Skip if Path B chosen.

### AC-3 (Path A only): each screenshot file ≥ 50KB
**Given** Path A chosen,
**When** I check file sizes,
**Then** each PNG is ≥ 50KB (proxy for "actually rendered content, not a blank frame").

**Verify:** `find plans/chat-mobile-plan/visual-postmigration-ember -name "*.png" -size -50k` → empty (no undersized files). Skip if Path B.

### AC-4 (Path B only): waiver rationale is concrete
**Given** Path B chosen,
**When** I read the waiver paragraph,
**Then** it contains a SPECIFIC rationale (>50 words, not just "out of scope"), naming the affected screens AND who owns their visual review.

**Verify:** `grep -A 20 "Path B\|waive\|waiver" plans/chat-mobile-plan/14-token-migration-audit.md | wc -w` → ≥ 50. Skip if Path A.

### AC-5: AC-7 + AC-8 status reflected in audit doc
**Given** the resolution,
**When** I read AC-7 and AC-8 in `14-token-migration-audit.md`,
**Then** their status is explicitly marked as RESOLVED (Path A: "evidence captured") OR WAIVED (Path B: "see §X waiver block").

**Verify:** `grep -E "AC-7\|AC-8" plans/chat-mobile-plan/14-token-migration-audit.md | grep -iE "RESOLVED\|WAIVED\|PASS\|N/A"` → 2+ matches

### AC-6: ROADMAP.md TS-1 references the resolution
**Given** Sprint 01 TS-1 in ROADMAP.md depends on Phase 0 ACs,
**When** I read the TS-1 reference,
**Then** a one-line note points to the AC-7/AC-8 resolution method.

**Verify:** `grep -A 5 "TS-1\|Phase 0 pre-gate" plans/chat-mobile-plan/ROADMAP.md | grep -iE "screenshot\|waived\|REMED-010"` → 1+ match

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | Path-decision block exists in 14-token-migration-audit.md | AC-1 | grep |
| TC-2 (Path A) | `visual-postmigration-ember/` folder contains ≥ 10 PNG files | AC-2 | ls count |
| TC-3 (Path A) | All PNGs in the folder are ≥ 50KB | AC-3 | find -size |
| TC-4 (Path B) | Waiver block is ≥ 50 words with concrete rationale | AC-4 | word count + grep |
| TC-5 | AC-7 in audit doc marked RESOLVED/WAIVED | AC-5 | grep |
| TC-6 | AC-8 in audit doc marked RESOLVED/WAIVED | AC-5 | grep |
| TC-7 | ROADMAP.md TS-1 references the resolution | AC-6 | grep |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `plans/chat-mobile-plan/14-token-migration-audit.md` | full | Phase 0 ACs (10), §3.1 screen list |
| `plans/chat-mobile-plan/ROADMAP.md` | Sprint 01 §Test Steps | TS-1 reference to Phase 0 gate |
| `apps/mobile/screens/` | folder structure | Non-chat screens to capture (sign-in, tasks, workspaces, more, settings) |
| `apps/mobile/screens/AUDIT.md` | full | First-party app-component token-compliance audit (related context) |

## GUARDRAILS

**WRITE-ALLOWED:**
- `plans/chat-mobile-plan/14-token-migration-audit.md` (MODIFY) — append resolution block.
- `plans/chat-mobile-plan/visual-postmigration-ember/*.png` (NEW, Path A only).
- `plans/chat-mobile-plan/ROADMAP.md` (MODIFY) — one-line note in TS-1 only.

**WRITE-PROHIBITED:**
- `apps/mobile/screens/**` source code — capture screenshots, do not modify.
- Any other ROADMAP.md section.
- `designs/**`.

## CODE / WAIVER PATTERN

### Path A capture procedure (if chosen)

1. Boot iOS Simulator (iPhone 15 Pro Max) with the current ember-migrated build.
2. Launch the app, sign in.
3. For each screen (sign-in, tasks list, workspaces list, more menu, settings):
   - In light mode → screenshot via Cmd+S, save to `plans/chat-mobile-plan/visual-postmigration-ember/{screen}-light.png`
   - In dark mode (toggle iOS appearance) → screenshot, save to `{screen}-dark.png`
4. Add a brief `README.md` in the folder explaining what each shot covers and when captured.

### Path B waiver template (if chosen)
Append to `14-token-migration-audit.md`:

```markdown
## §8 AC-7 / AC-8 Resolution (REMED-010, 2026-05-23)

**Decision: WAIVE AC-7 + AC-8 per the rationale below.**

The chat-mobile-plan PRD scope (per `01-scope.md`) is the chat surface
only — chat-tree rendering, composer, pause containers, platform banners,
push pre-prompt. Non-chat screens (sign-in, tasks list, workspaces list,
more menu, settings) are owned by their respective product owners and
are NOT in this PRD's review scope. Their visual review happens in those
owners' sprints, against their own SPRINT.md gates.

The ember migration changed shared `--color-*` tokens consumed by rn-reusables
primitives. Those primitives' visual treatment is identical across all
consumers — if the rn-reusables Button renders correctly in the chat-view
storybook walk (Sprint 01 TS-3, TS-5, TS-6, TS-7, TS-8), it will render
correctly on sign-in or settings. The risk of cross-screen visual
regression from a pure-token-rename migration is low — and any latent
regression will surface in the affected screen's own product-owner review.

Accordingly: AC-7 (baseline + post-migration screenshots) and AC-8
(reviewer sign-off on non-chat screens) are waived. The visual reviewer's
chat-view walkthrough is sufficient evidence that the token set works.
```

### Anti-pattern
- Producing 2 screenshots (sign-in light + dark) and calling AC-7 satisfied — minimum is 5 screens × 2 themes = 10 PNGs.
- Waiving with rationale "this is out of scope" alone — needs concrete cited reasoning.

## DESIGN

**References:**
- Red-hat review DG-4 + R-5
- `14-token-migration-audit.md` §3.1 (screen list), §AC-7, §AC-8
- ROADMAP Sprint 01 TS-1 dependency

**Pattern:** Decision-and-evidence block at end of audit doc, with status markers on the original ACs.

**Anti-pattern:** Leaving AC-7/AC-8 silently unresolved. Either path is fine; silence is the actual failure mode.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| Path decision | `grep -n "Path A\|Path B\|REMED-010" plans/chat-mobile-plan/14-token-migration-audit.md` | 1+ |
| AC-7 / AC-8 marked | `grep -E "AC-7\|AC-8" plans/chat-mobile-plan/14-token-migration-audit.md \| grep -iE "RESOLVED\|WAIVED"` | 2+ |
| Path A screenshots (if chosen) | `ls plans/chat-mobile-plan/visual-postmigration-ember/*.png \| wc -l` | ≥ 10 |
| Path A size sanity (if chosen) | `find plans/chat-mobile-plan/visual-postmigration-ember -name "*.png" -size -50k` | empty |
| Path B rationale length (if chosen) | `awk '/Path B|waive/,/^##/' plans/chat-mobile-plan/14-token-migration-audit.md \| wc -w` | ≥ 50 |
| ROADMAP TS-1 note | `grep -A 5 "TS-1\|Phase 0 pre-gate" plans/chat-mobile-plan/ROADMAP.md \| grep -iE "screenshot\|waived\|REMED-010"` | 1+ |

## AGENT INSTRUCTIONS

1. READ `14-token-migration-audit.md` AC-7 + AC-8 + §3.1 screen list.
2. DECIDE Path A or Path B based on:
   - User's available time (Path A: 60 min capture session on simulator)
   - Project policy on rigor (Path A produces durable artifacts; Path B accepts implicit-from-storybook reasoning)
   - Default suggestion: Path B (waive) — chat-mobile-plan scope cleanly excludes non-chat screens, and the rn-reusables primitives are shared. Document the decision either way.
3. IF Path A: capture screenshots, save to folder, add brief README.
4. IF Path B: paste the waiver template into the audit doc, customize the rationale with specifics from `01-scope.md`.
5. MARK AC-7 + AC-8 status in the audit doc (RESOLVED / WAIVED).
6. APPEND one-line note in ROADMAP.md TS-1 step pointing here.
7. Verify all relevant TCs (skipping Path A or Path B-only ones based on choice).

## AGENT ASSIGNMENT

**Agent:** `frontend-designer`
**Rationale:** Visual evidence + audit doc resolution is the frontend-designer's domain. Path A capture requires visual judgment ("is this rendering correctly?"). Path B waiver requires design-scope reasoning.

## DEPENDENCIES

- **depends_on:** none (parallel to REMED-001..REMED-009)
- **blocks:** REMED-011 (ROADMAP scope amendment references this task's outcome)

## NOTES

If frontend-designer is overcommitted, escalate Path B as the default —
the chat-mobile-plan scope justification is solid and the waiver
unblocks the Sprint 01 gate cleanly.

If Path A is chosen but the simulator capture turns up an unexpected
regression in a non-chat screen, FAIL this task and open a new
follow-up task to fix the regression — do not silently waive at that
point.

90-min estimate covers either path with buffer for screen-by-screen
review.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN REMED-010 WHEN I read 14-token-migration-audit.md THEN Path A or Path B decision block is present with rationale", "verify": "grep -n -B 1 -A 5 'AC-7|AC-8' plans/chat-mobile-plan/14-token-migration-audit.md"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN Path A chosen WHEN I list visual-postmigration-ember/ THEN ≥ 10 PNG files exist", "verify": "ls plans/chat-mobile-plan/visual-postmigration-ember/*.png | wc -l"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN Path A chosen WHEN I check file sizes THEN each PNG ≥ 50KB", "verify": "find plans/chat-mobile-plan/visual-postmigration-ember -name '*.png' -size -50k"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN Path B chosen WHEN I read the waiver THEN it contains ≥ 50 words of concrete rationale citing affected screens + owners", "verify": "grep + word count"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN the resolution WHEN I read AC-7 and AC-8 THEN they are marked RESOLVED or WAIVED", "verify": "grep audit doc"},
    {"id": "AC-6", "type": "acceptance_criterion", "description": "GIVEN ROADMAP TS-1 WHEN I read it THEN a one-line note points to the resolution method", "verify": "grep ROADMAP"},
    {"id": "TC-1", "type": "test_criterion", "description": "Path-decision block exists in audit doc", "maps_to_ac": "AC-1", "verify": "grep"},
    {"id": "TC-2", "type": "test_criterion", "description": "Path A: visual-postmigration-ember/ has ≥ 10 PNGs", "maps_to_ac": "AC-2", "verify": "ls count"},
    {"id": "TC-3", "type": "test_criterion", "description": "Path A: all PNGs ≥ 50KB", "maps_to_ac": "AC-3", "verify": "find -size"},
    {"id": "TC-4", "type": "test_criterion", "description": "Path B: waiver block ≥ 50 words with concrete rationale", "maps_to_ac": "AC-4", "verify": "word count"},
    {"id": "TC-5", "type": "test_criterion", "description": "AC-7 marked RESOLVED/WAIVED in audit doc", "maps_to_ac": "AC-5", "verify": "grep"},
    {"id": "TC-6", "type": "test_criterion", "description": "AC-8 marked RESOLVED/WAIVED in audit doc", "maps_to_ac": "AC-5", "verify": "grep"},
    {"id": "TC-7", "type": "test_criterion", "description": "ROADMAP TS-1 references the resolution", "maps_to_ac": "AC-6", "verify": "grep ROADMAP"}
  ]
}
-->
