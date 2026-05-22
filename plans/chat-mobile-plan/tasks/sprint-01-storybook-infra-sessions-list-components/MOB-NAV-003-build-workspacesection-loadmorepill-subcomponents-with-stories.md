# TASK: MOB-NAV-003 — Build WorkspaceSection + LoadMorePill subcomponents with stories

**TASK_TYPE:** FEATURE
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** M
**ESTIMATE:** 180 min
**AGENT:** implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 115/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** RN/Expo UI specialist; owns FlashList integration, sticky-header layout, and collapse/expand interactions.

---

## OUTCOME

Both component folders exist with .tsx/.stories/.test/index.ts; tests cover collapsed/expanded/load-more visibility; 7+ stories render correctly; SessionRow is composed via barrel import; typecheck + lint pass; Storybook displays each state on simulator.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- WorkspaceSection MUST be a pure component — no data hooks, no Electric/tRPC. Props supply sessions list, collapsed state, and callbacks.
- WorkspaceSection MUST live at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/` per `05-ui-infrastructure.md`.
- LoadMorePill MUST nest under WorkspaceSection per `12-component-organization-addendum.md` (used only inside WorkspaceSection): `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/`.
- Each component MUST co-locate `*.tsx`, `*.stories.tsx`, `*.test.tsx`, and `index.ts` barrel.
- WorkspaceSection props EXACTLY: `{ workspace: { id: string; projectName: string; branch: string }; sessions: SessionRowProps['session'][]; totalSessionCount: number; displayedCount: number; isCollapsed: boolean; isCapEnabled: boolean; onToggleCollapse(workspaceId: string): void; onLoadMore(workspaceId: string): void; onSessionPress(sessionId: string): void; testID?: string }`.
- WorkspaceSection MUST render its header row as `{projectName} · {branch}` with a chevron icon (`ChevronDown` when expanded, `ChevronRight` when collapsed) at 20pt strokeWidth 1.5; header row min-height 44pt.
- When `isCollapsed === true`: render header only, hide sessions and pill.
- When `isCollapsed === false` AND `isCapEnabled === true` AND `displayedCount < totalSessionCount`: render `<LoadMorePill remainingCount={totalSessionCount - displayedCount} onPress={() => onLoadMore(workspace.id)} />` after the visible sessions.
- When `isCapEnabled === false` (single-workspace mode) OR `displayedCount >= totalSessionCount`: do NOT render LoadMorePill.
- Use the existing `SessionRow` from MOB-NAV-002 via its barrel import: `import { SessionRow } from '../SessionRow'`.
- LoadMorePill props EXACTLY: `{ remainingCount: number; onPress(): void; testID?: string }`. Renders a centered pill with label `Load more (${remainingCount} more)` at min-height 44pt with rounded-full pill shape via tokens (`bg-secondary text-secondary-foreground rounded-full`).
- Expose testIDs: `workspace-section-${workspace.id}`, `workspace-section-header-${workspace.id}`, `workspace-section-chevron-${workspace.id}`, `load-more-pill-${workspace.id}`.
- Stories MUST cover at least: expanded-multi-cap, expanded-with-loadmore, expanded-no-cap (single-workspace), expanded-cap-exhausted, collapsed, empty-workspace, AND a dedicated LoadMorePill story with three remainingCount values (1, 5, 99).

### NEVER
- NEVER import FlashList here — WorkspaceSection renders its session list with native `<View>` and `.map()` (the parent screen will eventually wrap it in FlashList in Phase 2). Phase 1 must stay framework-light to keep stories renderable in isolation.
- NEVER hardcode the cap value (5) inside WorkspaceSection — it is implicit in `displayedCount`/`totalSessionCount` which the parent computes.
- NEVER bundle mock workspace/session data outside `*.stories.tsx`.
- NEVER use Reanimated for collapse/expand in Phase 1 — keep visual; transitions are Phase 2 polish.
- NEVER reach into SessionRow internals; consume it as a component via its barrel.

### STRICTLY
- STRICTLY co-locate LoadMorePill under WorkspaceSection (used in only one parent — addendum Convention 2).
- STRICTLY enforce 44pt min-height on header row, LoadMorePill, and inherit SessionRow's 44pt.

---

## SPECIFICATION

**Objective:** Implement WorkspaceSection (pure, props-driven) plus its nested LoadMorePill subcomponent: header with project · branch label + chevron, collapse/expand visibility, conditional Load-more pill, all rendering correctly across multi-workspace cap, single-workspace no-cap, collapsed, and empty scenarios.

**Success state:** Both component folders exist with .tsx/.stories/.test/index.ts; tests cover collapsed/expanded/load-more visibility; 7+ stories render correctly; SessionRow is composed via barrel import; typecheck + lint pass; Storybook displays each state on simulator.

---

## DONE WHEN

- [ ] [AC-1] WorkspaceSection file set exists with barrel
- [ ] [AC-2] LoadMorePill nested under WorkspaceSection with barrel
- [ ] [AC-3] Header renders project · branch label and chevron
- [ ] [AC-4] Collapsed state hides sessions + pill
- [ ] [AC-5] Tapping header invokes onToggleCollapse with workspace.id
- [ ] [AC-6] Load-more pill renders only when cap enabled and not exhausted
- [ ] [AC-7] Load-more pill hidden when cap disabled (single-workspace)
- [ ] [AC-8] Load-more pill hidden when cap reached and exhausted
- [ ] [AC-9] Header + LoadMorePill meet 44pt hit target
- [ ] [AC-10] Components are pure — no data-layer imports
- [ ] [AC-11] Typecheck + lint clean
- [ ] [AC-12] Stories render on simulator
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — WorkspaceSection file set exists with barrel
**GIVEN** Sprint 01 nests subcomponents under SessionsListScreen
**WHEN** I check the filesystem
**THEN** WorkspaceSection.tsx, .stories.tsx, .test.tsx, and index.ts all exist under `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/`
**VERIFY:** `test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/index.ts'`

### AC-2 — LoadMorePill nested under WorkspaceSection with barrel
**GIVEN** LoadMorePill is used only by WorkspaceSection per `05-ui-infrastructure.md`
**WHEN** I check the filesystem
**THEN** LoadMorePill.tsx, .stories.tsx, .test.tsx, index.ts exist under `WorkspaceSection/components/LoadMorePill/`
**VERIFY:** `test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/index.ts'`

### AC-3 — Header renders project · branch label and chevron
**GIVEN** WorkspaceSection rendered with `workspace={{ projectName:'superset', branch:'chat-mobile-plan' }}`
**WHEN** The story mounts
**THEN** Header Text contains literal substring `superset · chat-mobile-plan` and a Lucide `ChevronDown` icon at 20pt (or `ChevronRight` if collapsed) is rendered next to it
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'`

### AC-4 — Collapsed state hides sessions + pill
**GIVEN** `isCollapsed={true}`
**WHEN** Mounted
**THEN** No SessionRow nodes are rendered and no LoadMorePill node exists; only the header row is present
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'`

### AC-5 — Tapping header invokes onToggleCollapse with workspace.id
**GIVEN** An expanded WorkspaceSection
**WHEN** Header is pressed via `fireEvent.press` on testID `workspace-section-header-${workspace.id}`
**THEN** `onToggleCollapse` is called once with the workspace.id string
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'`

### AC-6 — Load-more pill renders only when cap enabled and not exhausted
**GIVEN** `isCapEnabled={true}`, `displayedCount=5`, `totalSessionCount=17`
**WHEN** Mounted expanded
**THEN** LoadMorePill renders with label text `Load more (12 more)`; tapping it invokes `onLoadMore(workspace.id)` exactly once
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'`

### AC-7 — Load-more pill hidden when cap disabled (single-workspace)
**GIVEN** `isCapEnabled={false}`, `displayedCount=20`, `totalSessionCount=20`
**WHEN** Mounted expanded
**THEN** No LoadMorePill is rendered; all 20 SessionRows render
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'`

### AC-8 — Load-more pill hidden when cap reached and exhausted
**GIVEN** `isCapEnabled={true}`, `displayedCount=10`, `totalSessionCount=10`
**WHEN** Mounted expanded
**THEN** No LoadMorePill is rendered (`displayedCount >= totalSessionCount`)
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'`

### AC-9 — Header + LoadMorePill meet 44pt hit target
**GIVEN** Both controls are interactive
**WHEN** I inspect their root min-height
**THEN** Header Pressable and LoadMorePill Pressable both have minHeight 44
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx' && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx'`

### AC-10 — Components are pure — no data-layer imports
**GIVEN** Phase 1 purity rule
**WHEN** I grep both .tsx files
**THEN** Neither contains imports from `lib/collections`, `useElectric`, `useSelectedHost`, `host-service-client`, `@trpc/client`, or `@tanstack/electric-db-collection`
**VERIFY:** `! grep -E '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx'`

### AC-11 — Typecheck + lint clean
**GIVEN** All files in place
**WHEN** I run both gates
**THEN** Exit 0 with no warnings
**VERIFY:** `cd apps/mobile && bun run typecheck && bun run lint`

### AC-12 — Stories render on simulator
**GIVEN** Storybook is configured
**WHEN** A developer launches `bun run storybook` and navigates to WorkspaceSection + LoadMorePill
**THEN** All seven WorkspaceSection stories (expanded-multi-cap, expanded-with-loadmore, expanded-no-cap, expanded-cap-exhausted, collapsed, empty-workspace, header-chevron-transition) and all three LoadMorePill stories render visually against design tokens in light + dark mode
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator)`


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | WorkspaceSection folder has .tsx/.stories/.test/index.ts | AC-1 | happy_path | `test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/index.ts'` |
| TC-2 | LoadMorePill folder has .tsx/.stories/.test/index.ts nested under WorkspaceSection/components/ | AC-2 | happy_path | `test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/index.ts'` |
| TC-3 | Header renders 'superset · chat-mobile-plan' label + ChevronDown when expanded | AC-3 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'` |
| TC-4 | Collapsed=true → zero SessionRows rendered + no LoadMorePill | AC-4 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'` |
| TC-5 | Press header → onToggleCollapse(workspace.id) fires once | AC-5 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'` |
| TC-6 | isCapEnabled+displayed<total → LoadMorePill renders with 'Load more (12 more)' label; tap fires onLoadMore once | AC-6 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'` |
| TC-7 | isCapEnabled=false → no LoadMorePill | AC-7 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'` |
| TC-8 | displayedCount>=totalSessionCount → no LoadMorePill | AC-8 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'` |
| TC-9 | Header + LoadMorePill have minHeight 44 | AC-9 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx' && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx'` |
| TC-10 | Both .tsx files contain no data-layer imports | AC-10 | error_case | `! grep -E '(lib/collections\|useElectric\|useSelectedHost\|host-service-client\|@trpc/client\|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx'` |
| TC-11 | Typecheck + lint exit 0 | AC-11 | happy_path | `cd apps/mobile && bun run typecheck && bun run lint` |
| TC-12 | All WorkspaceSection + LoadMorePill stories render on simulator (HUMAN) | AC-12 | happy_path | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)` |

---

## READING LIST

- `plans/chat-mobile-plan/09-uc-nav.md` (lines 26-296) — Wireframes §A/A2/A4 — section header, sticky pattern, Load more pill, single-workspace mode + UC-NAV-02 acceptance criteria
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 1-200) — WorkspaceSection + LoadMorePill paths under SessionsListScreen/components/; Tailwind translation; 44pt hit targets
- `plans/chat-mobile-plan/12-component-organization-addendum.md` (lines 1-100) — Subcomponent nesting (LoadMorePill under WorkspaceSection)

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.stories.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/index.ts (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.stories.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/index.ts (NEW)

### WRITE PROHIBITED
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx (Phase 2)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/** (owned by MOB-NAV-002 — consume via barrel only)
- apps/mobile/lib/**, apps/mobile/hooks/** (no data wiring in Phase 1)
- apps/mobile/.rnstorybook/** (owned by MOB-INFRA-002)
- apps/desktop/**, apps/web/**, packages/** (mobile-only sprint)

---

## DESIGN

### References
- DESIGN-NAV-001 (sticker sheet — to be attached at merge)
- DESIGN-PLATF-003 (Lucide iconography spec — to be attached at merge)
- plans/chat-mobile-plan/09-uc-nav.md §A2 (single-workspace) and §A4 (sticky scroll progression)
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md

### Interaction notes
- Chevron rotation: simple icon swap (ChevronDown ↔ ChevronRight) — no animation in Phase 1.
- Header touch target: full-row Pressable with minHeight 44, padding consistent with SessionRow.
- LoadMorePill: pill-shaped centered button with horizontal padding; min-height 44pt; uses bg-secondary + text-secondary-foreground tokens.
- Sticky-header approach: use FlashList's stickyHeaderIndices on a flattened data array (section header objects interleaved with session row objects) per plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md — the fallback is RN SectionList with stickySectionHeadersEnabled={true}; implementer chooses based on FlashList v1.7.x sticky stability in the sprint
- WorkspaceSection header height is 44pt exactly — use height={44} on the header container; background is --color-muted
- Label typography: '{project} · {branch}' at 14sp, fontWeight='500' (medium), color --color-foreground
- Chevron animation: collapsed = ChevronRight at 0deg, expanded = ChevronDown at 90deg — implement with Reanimated useAnimatedStyle + withTiming(90, { duration: 150, easing: Easing.out(Easing.quad) }) on the rotate transform; initial state should be instantaneous (no withTiming on mount)
- Chevron icon: 20pt, strokeWidth={1.5}, color --color-muted-foreground per DESIGN-PLATF-003
- Collapsed state: the section header renders but its session rows are hidden — implement via conditional rendering (not height animation) to avoid FlashList measurement issues
- LoadMorePill visual height is 34pt but tap target must be 44pt — add paddingVertical={5} to the Pressable wrapper; background --color-secondary on the visual pill only, not the full touch area
- LoadMorePill corners: borderRadius from the --radius token (0.5rem = 8pt equivalent); read from THEME.light.radius / THEME.dark.radius in lib/theme.ts
- LoadMorePill label: 'Load more (N more)' at 14sp, color --color-secondary-foreground, centered
- Hide LoadMorePill when displayedCount >= totalCount for that workspace section

### Pattern
Folder-per-component with subcomponent nesting (LoadMorePill nests inside WorkspaceSection because used by only this parent), per 12-component-organization-addendum.md Convention 2.

**Pattern source:** plans/chat-mobile-plan/12-component-organization-addendum.md

### Anti-pattern
Promoting LoadMorePill to the sibling level when it has only one parent; bundling FlashList here; using Reanimated for collapse in Phase 1.

---

## VERIFICATION GATES

### Files exist (both folders)
- **Command:** `test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/index.ts' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/index.ts'`
- **Expected:** Exit 0

### Unit tests
- **Command:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/'`
- **Expected:** All assertions pass

### Purity check
- **Command:** `! grep -E '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx'`
- **Expected:** Exit 0 (no matches)

### Typecheck
- **Command:** `cd apps/mobile && bun run typecheck`
- **Expected:** Exit 0

### Lint
- **Command:** `cd apps/mobile && bun run lint`
- **Expected:** Exit 0, no warnings

### Stories render
- **Command:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator)`
- **Expected:** All 7 WorkspaceSection + 3 LoadMorePill stories render across light + dark


---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-001, MOB-INFRA-002, MOB-NAV-002
- **Blocks:** None

---

## CODING STANDARDS

- `AGENTS.md — Project Structure (folder-per-component + barrel index.ts)`
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md`
- `plans/chat-mobile-plan/12-component-organization-addendum.md (Convention 2 — nesting)`

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
      "description": "WorkspaceSection.tsx/stories/test/index.ts exist under SessionsListScreen/components/WorkspaceSection/.",
      "verify": "test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/index.ts'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "LoadMorePill files exist under WorkspaceSection/components/LoadMorePill/.",
      "verify": "test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/index.ts'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "Header renders 'project · branch' label + ChevronDown when expanded.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "Collapsed=true → no SessionRows + no LoadMorePill.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "Press header → onToggleCollapse(workspace.id) fires once.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "Cap enabled + displayed<total → LoadMorePill with 'Load more (N more)' label + onLoadMore fires.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "isCapEnabled=false → no LoadMorePill.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "description": "displayed>=total → no LoadMorePill.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "AC-9",
      "type": "acceptance_criterion",
      "description": "Header + LoadMorePill minHeight 44.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx' && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx'"
    },
    {
      "id": "AC-10",
      "type": "acceptance_criterion",
      "description": "Both .tsx files have zero data-layer imports.",
      "verify": "! grep -E '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx'"
    },
    {
      "id": "AC-11",
      "type": "acceptance_criterion",
      "description": "Typecheck + lint exit 0.",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "AC-12",
      "type": "acceptance_criterion",
      "description": "All stories render on simulator (HUMAN).",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "WorkspaceSection file set exists.",
      "maps_to_ac": "AC-1",
      "verify": "test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/index.ts'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "LoadMorePill file set exists nested.",
      "maps_to_ac": "AC-2",
      "verify": "test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/index.ts'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Header label + ChevronDown render.",
      "maps_to_ac": "AC-3",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Collapsed hides sessions + pill.",
      "maps_to_ac": "AC-4",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Header press fires onToggleCollapse.",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "LoadMorePill renders with N-remaining label + fires onLoadMore.",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Cap disabled → no pill.",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Cap exhausted → no pill.",
      "maps_to_ac": "AC-8",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx'"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Hit-target 44pt enforced.",
      "maps_to_ac": "AC-9",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.test.tsx' && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.test.tsx'"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Purity check (no data-layer imports).",
      "maps_to_ac": "AC-10",
      "verify": "! grep -E '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/WorkspaceSection.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/components/LoadMorePill/LoadMorePill.tsx'"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "Typecheck + lint exit 0.",
      "maps_to_ac": "AC-11",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "Stories render on simulator (HUMAN).",
      "maps_to_ac": "AC-12",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    }
  ]
}
-->
