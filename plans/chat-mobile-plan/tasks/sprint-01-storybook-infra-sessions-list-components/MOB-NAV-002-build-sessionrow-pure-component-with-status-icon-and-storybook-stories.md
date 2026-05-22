# TASK: MOB-NAV-002 — Build SessionRow pure component with status icon and Storybook stories

**TASK_TYPE:** FEATURE
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** M
**ESTIMATE:** 120 min
**AGENT:** implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 115/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** RN/Expo UI specialist; owns Lucide iconography, token wiring, and component co-location.

---

## OUTCOME

`SessionRow.tsx`, `SessionRow.stories.tsx`, `SessionRow.test.tsx`, `index.ts` all exist at the canonical path; six stories cover the four status states + truncation + long-time-label; `bun run typecheck` and `bun run lint` exit 0; component renders correctly on simulator with each story.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- MUST be a pure component — no data hooks, no useEffect, no Electric/tRPC/selectedHost imports. Props supply every render input.
- MUST live at `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx` per `11-technical-requirements/05-ui-infrastructure.md` (sessions-list-tier components nest under SessionsListScreen).
- MUST co-locate `SessionRow.stories.tsx`, `SessionRow.test.tsx`, and `index.ts` (barrel) in the same folder per `12-component-organization-addendum.md`.
- MUST render status icon via Lucide (`lucide-react-native`): `streaming → Crosshair` (16pt, color = token --color-primary), `pause_pending → AlertTriangle` (16pt, --color-destructive), `idle → Circle (filled)` (16pt, --color-foreground), `dormant → Circle (outline)` (16pt, --color-muted-foreground). `strokeWidth={1.5}`. Map ASCII glyphs `⌖ ⚠ ● ○` from `09-uc-nav.md` §A.
- MUST hit 44pt minimum row height per `11-technical-requirements/05-ui-infrastructure.md` Hit targets section.
- MUST accept these props exactly: `{ session: { id: string; title: string; status: 'streaming'|'pause_pending'|'idle'|'dormant'; lastActiveAt: Date | string; relativeTimeLabel: string; }, onPress(sessionId: string): void; testID?: string }`. No more, no fewer.
- MUST expose stable testIDs: `session-row-${session.id}` on the outer Pressable, `session-row-status-icon-${session.id}` on the icon, `session-row-title-${session.id}` on the title Text, `session-row-time-${session.id}` on the relative-time Text.
- MUST use NativeWind/Tailwind classes that map to mobile tokens (e.g., `text-foreground`, `text-muted-foreground`, `bg-card`) — NEVER hex literals.
- MUST cover all four status states + a long-title (truncation) state in stories.
- Mock data lives ONLY in `*.stories.tsx`; no mock adapters in the production component.

### NEVER
- NEVER import from `lib/collections`, `@/hooks/useElectric*`, `@/hooks/useSelectedHost`, or any data layer.
- NEVER use hardcoded colors, shadows, or radii — all visuals via tokens / NativeWind class names.
- NEVER render multiple components from `SessionRow.tsx` (one-component-per-file rule).
- NEVER place stories or tests outside the component folder.

### STRICTLY
- STRICTLY use Lucide icons via `lucide-react-native` per DESIGN-PLATF-003 iconography spec.
- STRICTLY return early or render a fallback icon if `session.status` is not one of the four known values (defensive `_exhaustive: never` switch).

---

## SPECIFICATION

**Objective:** Implement `SessionRow` as a pure, props-driven row that renders one session with its status icon, title, and relative-time label, suitable for use inside a FlashList by `WorkspaceSection`.

**Success state:** `SessionRow.tsx`, `SessionRow.stories.tsx`, `SessionRow.test.tsx`, `index.ts` all exist at the canonical path; six stories cover the four status states + truncation + long-time-label; `bun run typecheck` and `bun run lint` exit 0; component renders correctly on simulator with each story.

---

## DONE WHEN

- [ ] [AC-1] File set exists at canonical path with barrel
- [ ] [AC-2] Streaming status renders Crosshair icon
- [ ] [AC-3] Pause-pending status renders AlertTriangle in destructive color
- [ ] [AC-4] Idle vs dormant render filled vs outlined Circle
- [ ] [AC-5] Row meets 44pt minimum touch target
- [ ] [AC-6] Long titles truncate to one line with ellipsis
- [ ] [AC-7] onPress invoked with session.id when row pressed
- [ ] [AC-8] Component is pure — no data-layer imports
- [ ] [AC-9] Typecheck + lint clean
- [ ] [AC-10] Stories render on simulator
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — File set exists at canonical path with barrel
**GIVEN** Sprint 01 places sessions-list subcomponents under SessionsListScreen/components/
**WHEN** I check the filesystem
**THEN** All four files exist: SessionRow.tsx, SessionRow.stories.tsx, SessionRow.test.tsx, index.ts under `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/`
**VERIFY:** `test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/index.ts'`

### AC-2 — Streaming status renders Crosshair icon
**GIVEN** A story renders `<SessionRow session={{ status: 'streaming', ... }} />`
**WHEN** The story is mounted
**THEN** A Lucide `Crosshair` icon is rendered at 16pt with strokeWidth 1.5 and the `text-primary` className (or equivalent token-mapped color), found via testID `session-row-status-icon-${session.id}`
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'`

### AC-3 — Pause-pending status renders AlertTriangle in destructive color
**GIVEN** A story renders `<SessionRow session={{ status: 'pause_pending', ... }} />`
**WHEN** The story is mounted
**THEN** A Lucide `AlertTriangle` icon is rendered at 16pt with the destructive token color via NativeWind class `text-destructive`
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'`

### AC-4 — Idle vs dormant render filled vs outlined Circle
**GIVEN** Two stories render the same row with status `'idle'` and `'dormant'`
**WHEN** Both stories are mounted
**THEN** Idle uses a filled Circle (fill='currentColor') with class `text-foreground`; dormant uses a stroke-only Circle with class `text-muted-foreground`
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'`

### AC-5 — Row meets 44pt minimum touch target
**GIVEN** Any SessionRow is rendered
**WHEN** I inspect the root Pressable's computed min-height
**THEN** The root Pressable has `minHeight: 44` (via `h-11` NativeWind class or inline style) per `05-ui-infrastructure.md` Hit targets
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'`

### AC-6 — Long titles truncate to one line with ellipsis
**GIVEN** A story renders a session with a title longer than the row width (e.g. 80+ characters)
**WHEN** The story is mounted
**THEN** The title `<Text>` has `numberOfLines={1}` and `ellipsizeMode='tail'`
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'`

### AC-7 — onPress invoked with session.id when row pressed
**GIVEN** A story renders `<SessionRow ... onPress={fn} />`
**WHEN** The Pressable's onPress fires (simulated via testing-library `fireEvent.press`)
**THEN** `fn` is called exactly once with the session's id string as the only argument
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'`

### AC-8 — Component is pure — no data-layer imports
**GIVEN** Production code paths must stay free of data hooks per Phase 1 rules
**WHEN** I grep `SessionRow.tsx`
**THEN** It contains zero imports from `lib/collections`, `@/hooks/useElectric`, `@/hooks/useSelectedHost`, `@/lib/host-service-client`, `@trpc/client`, or `@tanstack/electric-db-collection`
**VERIFY:** `! grep -E '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx'`

### AC-9 — Typecheck + lint clean
**GIVEN** All files for SessionRow are present
**WHEN** I run typecheck and lint
**THEN** Both exit 0 with no warnings
**VERIFY:** `cd apps/mobile && bun run typecheck && bun run lint`

### AC-10 — Stories render on simulator
**GIVEN** Storybook is configured (MOB-INFRA-002)
**WHEN** A developer launches `bun run storybook` and navigates to SessionRow
**THEN** All six story variants (Streaming, PausePending, Idle, Dormant, LongTitle, OldTimestamp) render visually against design tokens in both light and dark mode
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator — confirm 6 stories render across light/dark themes)`


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | All four files exist at canonical SessionsListScreen/components/SessionRow path | AC-1 | happy_path | `test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/index.ts'` |
| TC-2 | status='streaming' renders Crosshair icon at 16pt with text-primary | AC-2 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'` |
| TC-3 | status='pause_pending' renders AlertTriangle with text-destructive | AC-3 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'` |
| TC-4 | status='idle' uses filled Circle text-foreground; status='dormant' uses stroke Circle text-muted-foreground | AC-4 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'` |
| TC-5 | Root Pressable minHeight is 44 (via h-11 or inline style) | AC-5 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'` |
| TC-6 | Title Text has numberOfLines=1 + ellipsizeMode='tail' | AC-6 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'` |
| TC-7 | Pressing the row invokes onPress with session.id exactly once | AC-7 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'` |
| TC-8 | SessionRow.tsx has no imports from data layers | AC-8 | error_case | `! grep -E '(lib/collections\|useElectric\|useSelectedHost\|host-service-client\|@trpc/client\|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx'` |
| TC-9 | Typecheck + lint exit 0 | AC-9 | happy_path | `cd apps/mobile && bun run typecheck && bun run lint` |
| TC-10 | Six stories render on simulator across light + dark (HUMAN-VERIFIED) | AC-10 | happy_path | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)` |

---

## READING LIST

- `plans/chat-mobile-plan/09-uc-nav.md` (lines 26-150) — Wireframes §A/A2/A3/A4 — status icons ⌖ ⚠ ● ○ + row visual hierarchy
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 1-200) — Component path under SessionsListScreen/components/; Tailwind→RN translation; 44pt hit targets
- `plans/chat-mobile-plan/12-component-organization-addendum.md` (lines 1-100) — Folder-per-component + barrel index.ts convention

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.stories.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/index.ts (NEW)

### WRITE PROHIBITED
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx (Phase 2 — screen assembly)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/** (separate task MOB-NAV-003)
- apps/mobile/lib/** (no data wiring in Phase 1)
- apps/mobile/hooks/useElectric*/**, apps/mobile/hooks/useSelectedHost/** (Phase 2)
- apps/mobile/.rnstorybook/** (owned by MOB-INFRA-002)
- apps/desktop/**, apps/web/**, packages/** (mobile-only sprint)

---

## DESIGN

### References
- DESIGN-NAV-001 (sticker sheet — to be attached at merge)
- DESIGN-PLATF-003 (Lucide iconography spec — to be attached at merge)
- plans/chat-mobile-plan/09-uc-nav.md §A status icons ⌖ ⚠ ● ○
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md
- apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md

### Interaction notes
- 44pt minimum row height per 05-ui-infrastructure.md Hit targets section.
- Active state on press: NativeWind `active:bg-accent` for visual feedback (no Reanimated needed for Phase 1).
- Icons: 16pt, strokeWidth 1.5, color via NativeWind token classes.
- Row height is exactly 56pt — do not use flex-grow or dynamic height; set height={56} on the container View
- Horizontal padding is 16pt on both sides — use paddingHorizontal={16}
- Status icon column is 20pt wide — allocate a fixed-width View(width={20}) left of the title column so titles align across all states
- Status icon approach MUST match the decision in DESIGN-PLATF-003 and DESIGN-NAV-001 — if Unicode glyphs: render as Text with fontFamily='monospace' or system font at 14pt; if Lucide: use lucide-react-native icon at 16pt with strokeWidth={1.5} and token color from the state matrix
- Title is 15sp, single line (numberOfLines={1}), ellipsizeMode='tail', color --color-foreground
- Timestamp is 12sp right-aligned, --color-muted-foreground, no wrap
- Long-press affordance: onLongPress={() => Clipboard.setString(session.title)} — use @react-native-clipboard/clipboard; the affordance is invisible (no visual indicator while not held); confirm the package is in the deps list from MOB-INFRA-001
- Status icon token colors from DESIGN-NAV-001 state matrix — streaming: --color-primary; pause-pending: --color-destructive; idle: --color-foreground; dormant: --color-muted-foreground
- Do NOT use Pressable with android_ripple that overflows the row — confine ripple to the row bounds with overflow='hidden'

### Pattern
Folder-per-component with barrel index.ts and co-located stories+tests, per 12-component-organization-addendum.md.

**Pattern source:** plans/chat-mobile-plan/12-component-organization-addendum.md

### Anti-pattern
Bundling mock data into production code path; using hex literals; multi-component files; placing data hooks inside pure presentational components.

---

## VERIFICATION GATES

### Files exist
- **Command:** `test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/index.ts'`
- **Expected:** Exit 0

### Unit tests
- **Command:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'`
- **Expected:** All assertions pass

### Purity check
- **Command:** `! grep -E '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx'`
- **Expected:** Exit 0 (no matches)

### Typecheck
- **Command:** `cd apps/mobile && bun run typecheck`
- **Expected:** Exit 0

### Lint
- **Command:** `cd apps/mobile && bun run lint`
- **Expected:** Exit 0, no warnings

### Stories render
- **Command:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator)`
- **Expected:** All six SessionRow stories render across light + dark themes


---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-001, MOB-INFRA-002
- **Blocks:** MOB-NAV-003

---

## CODING STANDARDS

- `AGENTS.md — Project Structure (folder-per-component + barrel index.ts)`
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md (component paths, Tailwind translation, 44pt hit targets)`
- `plans/chat-mobile-plan/12-component-organization-addendum.md (subcomponent nesting + co-location)`

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
      "description": "GIVEN sessions-list subcomponents nest under SessionsListScreen, WHEN I check filesystem, THEN SessionRow.tsx/stories/test/index.ts all exist.",
      "verify": "test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/index.ts'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN status='streaming', WHEN rendered, THEN Crosshair icon @ 16pt strokeWidth 1.5 with text-primary at testID session-row-status-icon-${id}.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN status='pause_pending', WHEN rendered, THEN AlertTriangle icon @ 16pt with text-destructive.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN status='idle' vs 'dormant', WHEN rendered, THEN idle uses filled Circle text-foreground; dormant uses stroke Circle text-muted-foreground.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN any SessionRow, WHEN inspected, THEN root Pressable has minHeight 44.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN long title, WHEN rendered, THEN title Text has numberOfLines=1 + ellipsizeMode='tail'.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN onPress prop, WHEN pressed, THEN it fires once with session.id.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "description": "GIVEN Phase 1 rules, WHEN I grep SessionRow.tsx, THEN zero imports from data layers.",
      "verify": "! grep -E '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx'"
    },
    {
      "id": "AC-9",
      "type": "acceptance_criterion",
      "description": "GIVEN component complete, WHEN typecheck && lint runs, THEN both exit 0.",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "AC-10",
      "type": "acceptance_criterion",
      "description": "GIVEN Storybook configured, WHEN dev runs storybook on simulator, THEN all six SessionRow stories render in light + dark.",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "All four files exist at canonical path.",
      "maps_to_ac": "AC-1",
      "verify": "test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/index.ts'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Streaming renders Crosshair @ 16pt text-primary.",
      "maps_to_ac": "AC-2",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Pause-pending renders AlertTriangle text-destructive.",
      "maps_to_ac": "AC-3",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Idle/dormant filled vs stroke Circle with correct color tokens.",
      "maps_to_ac": "AC-4",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Root Pressable minHeight=44.",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Title Text truncates with ellipsis.",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Press fires onPress(session.id) once.",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.test.tsx'"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "SessionRow.tsx has zero data-layer imports.",
      "maps_to_ac": "AC-8",
      "verify": "! grep -E '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/SessionRow.tsx'"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Typecheck + lint exit 0.",
      "maps_to_ac": "AC-9",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "Six stories render on simulator (HUMAN).",
      "maps_to_ac": "AC-10",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    }
  ]
}
-->
