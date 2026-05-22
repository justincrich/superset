# TASK: MOB-NAV-008-UI — Build HostPickerSheet pure component (UC-NAV-03 visual; no data wiring) with stories

**TASK_TYPE:** FEATURE
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** M
**ESTIMATE:** 150 min
**AGENT:** implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 115/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** RN/Expo UI specialist; owns @gorhom/bottom-sheet integration, list-row layout, and visual parity with UC-NAV-03 wireframe §B.

---

## OUTCOME

Folder + four files exist at `apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/`; tests cover row rendering / selected check / online-offline badge / empty list / press callbacks / 44pt hit targets / forwardRef; four+ stories render in Storybook on simulator across light + dark; typecheck + lint pass.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- HostPickerSheet MUST be a pure, props-driven component — NO hooks like `useAccessibleHosts`, `useSelectedHost`, no Electric/tRPC. Phase 2 task MOB-NAV-008-INT will wire data; this task is `-UI` and stays presentational.
- MUST live at `apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/` per `05-ui-infrastructure.md` (sibling of SessionsListScreen, NOT nested under SessionsListScreen/components/).
- MUST co-locate `HostPickerSheet.tsx`, `HostPickerSheet.stories.tsx`, `HostPickerSheet.test.tsx`, and `index.ts` barrel.
- MUST use `@gorhom/bottom-sheet` (installed in MOB-INFRA-001) with `BottomSheetModal` or `BottomSheet` + `BottomSheetFlatList` to render the host list per UC-NAV-03 contract; snap-points include a sheet-handle visible state.
- Props EXACTLY: `{ hosts: Array<{ id: string; name: string; isOnline: boolean; metaLine: string }>; selectedHostId: string | null; onSelect(hostId: string): void; onClose(): void; testID?: string; ref?: React.Ref<BottomSheetModalMethods> /* exposed via forwardRef for parent screen to call present()/dismiss() in Phase 2 */ }`.
- Each host row MUST render: leading icon (`Laptop` for hostname matching /macbook|desktop/i, otherwise `Cloud` — caller can override later but Phase 1 uses simple heuristic on hostName), 16pt strokeWidth 1.5; host name (font-semibold text-foreground); online/offline badge text ('online' text-emerald-500 / 'offline' text-muted-foreground); meta line (text-muted-foreground); a Lucide `Check` icon (20pt, text-primary) on the right when `host.id === selectedHostId`.
- Row MUST be 44pt minimum tappable; pressing invokes `onSelect(host.id)` and the parent dismisses the sheet (Phase 1 just calls onSelect — dismissal coupling happens in Phase 2).
- Sheet header: row with `◇` style handle (rendered as a 36×4 muted-bar centered), title `Switch host` (text-foreground font-semibold), and trailing `X` icon (24pt) wrapped in a 44pt Pressable that invokes `onClose`.
- Section header above the list: small uppercase text `THIS ORGANIZATION` (text-muted-foreground tracking-wide).
- Use `BottomSheetFlatList` to render rows so the sheet handles scrolling correctly per gorhom docs.
- Stories MUST cover: default-with-three-hosts (one selected, one online unselected, one offline), single-host-selected, empty-host-list (shows inline placeholder 'No devices yet'), and long-host-name (truncation).
- Provide a story decorator that mounts the sheet via `BottomSheetModalProvider` and presents the modal on mount so the sheet is visible immediately in Storybook.

### NEVER
- NEVER import `useAccessibleHosts`, `useSelectedHost`, `lib/collections`, `expo-secure-store`, `@trpc/client`, or `@tanstack/electric-db-collection`.
- NEVER ship mock host data inside `HostPickerSheet.tsx` — mocks live in `*.stories.tsx` only.
- NEVER hardcode 'macbook' / 'desktop' / 'cloud-1' names in production code; the heuristic for icon choice is `/macbook|desktop|laptop/i ? Laptop : Cloud` (case-insensitive regex over `host.name`).
- NEVER persist `selectedHostId` here — that is Phase 2's job. This component just reads the prop and reports selection via callback.
- NEVER hardcode hex colors — use NativeWind tokens (`text-emerald-500` allowed as the same exception used for HostChip dot).

### STRICTLY
- STRICTLY use `React.forwardRef` so a parent (Phase 2 screen) can call `ref.current?.present()` / `dismiss()` on the underlying `BottomSheetModal`.
- STRICTLY render the `Check` indicator exclusively when `host.id === selectedHostId` — no other condition.
- STRICTLY label the file with comment `// PHASE-1 VISUAL — data wiring lives in MOB-NAV-008-INT (Phase 2 sprint).` at the top of HostPickerSheet.tsx so reviewers understand the scope boundary.

---

## SPECIFICATION

**Objective:** Implement `HostPickerSheet` as a pure, props-driven gorhom bottom sheet rendering the UC-NAV-03 host-picker UI: sheet handle + title + close, section header, scrollable host rows with selected check, and an empty-state inline placeholder — wired entirely by props, ready for a Phase 2 task to attach `useAccessibleHosts` and `useSelectedHost`.

**Success state:** Folder + four files exist at `apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/`; tests cover row rendering / selected check / online-offline badge / empty list / press callbacks / 44pt hit targets / forwardRef; four+ stories render in Storybook on simulator across light + dark; typecheck + lint pass.

---

## DONE WHEN

- [ ] [AC-1] File set exists at canonical path with barrel
- [ ] [AC-2] Sheet header renders title and close button
- [ ] [AC-3] Section header 'THIS ORGANIZATION' rendered
- [ ] [AC-4] Selected host row renders Check indicator; others do not
- [ ] [AC-5] Online/offline badge color matches state
- [ ] [AC-6] Row icon heuristic picks Laptop vs Cloud
- [ ] [AC-7] Row press invokes onSelect with host.id
- [ ] [AC-8] Empty host list renders inline placeholder
- [ ] [AC-9] Row + close button meet 44pt hit target
- [ ] [AC-10] forwardRef exposes BottomSheetModal methods
- [ ] [AC-11] Component is pure — no data-layer imports
- [ ] [AC-12] Phase boundary comment present
- [ ] [AC-13] Typecheck + lint clean
- [ ] [AC-14] Stories render on simulator
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — File set exists at canonical path with barrel
**GIVEN** HostPickerSheet is a sibling of SessionsListScreen per `05-ui-infrastructure.md`
**WHEN** I check the filesystem
**THEN** HostPickerSheet.tsx, .stories.tsx, .test.tsx, and index.ts all exist under `apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/`
**VERIFY:** `test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/index.ts'`

### AC-2 — Sheet header renders title and close button
**GIVEN** Story with `hosts={[...]}, selectedHostId='h1', onClose={fn}`
**WHEN** Mounted
**THEN** Text 'Switch host' is visible; a Pressable with testID `host-picker-sheet-close` wraps a Lucide `X` icon (24pt) and tapping it invokes `onClose` once
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-3 — Section header 'THIS ORGANIZATION' rendered
**GIVEN** Any populated story
**WHEN** Mounted
**THEN** Text containing literal substring 'THIS ORGANIZATION' (uppercase) is rendered above the host list with `text-muted-foreground` styling
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-4 — Selected host row renders Check indicator; others do not
**GIVEN** Story with three hosts, `selectedHostId='h2'`
**WHEN** Mounted
**THEN** Only the row with id 'h2' contains a Lucide `Check` icon at 20pt with class `text-primary` (testID `host-row-check-h2`); rows 'h1' and 'h3' have no Check icon
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-5 — Online/offline badge color matches state
**GIVEN** A story with one online host (id 'h1') and one offline (id 'h3')
**WHEN** Mounted
**THEN** Row 'h1' contains Text 'online' with class `text-emerald-500`; row 'h3' contains Text 'offline' with class `text-muted-foreground`
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-6 — Row icon heuristic picks Laptop vs Cloud
**GIVEN** Hosts with names 'macbook', 'desktop', 'cloud-1', 'production-srv'
**WHEN** Mounted
**THEN** 'macbook' and 'desktop' rows render a `Laptop` icon; 'cloud-1' and 'production-srv' render a `Cloud` icon (the heuristic regex `/macbook|desktop|laptop/i` decides)
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-7 — Row press invokes onSelect with host.id
**GIVEN** A populated story with onSelect spy
**WHEN** I fireEvent.press on the row with testID `host-row-h3`
**THEN** `onSelect` is called exactly once with 'h3'
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-8 — Empty host list renders inline placeholder
**GIVEN** Story with `hosts={[]}, selectedHostId={null}`
**WHEN** Mounted
**THEN** No host rows are rendered; an inline Text contains literal substring 'No devices yet' (does NOT use SessionsEmptyState component — this is the sheet's own minimal empty copy)
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-9 — Row + close button meet 44pt hit target
**GIVEN** Any populated story
**WHEN** I inspect each row Pressable and the close-button Pressable
**THEN** All have minHeight ≥ 44
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-10 — forwardRef exposes BottomSheetModal methods
**GIVEN** Component is wrapped in `React.forwardRef`
**WHEN** A parent creates a `ref` and calls `ref.current.present()`
**THEN** The underlying `BottomSheetModal` ref method is invoked (verified by mocking @gorhom/bottom-sheet in test or by `expect(typeof ref.current.present).toBe('function')`)
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`

### AC-11 — Component is pure — no data-layer imports
**GIVEN** Phase 1 purity rule for the `-UI` variant
**WHEN** I grep `HostPickerSheet.tsx`
**THEN** Zero imports from `lib/collections`, `useAccessibleHosts`, `useSelectedHost`, `host-service-client`, `expo-secure-store`, `@trpc/client`, or `@tanstack/electric-db-collection`
**VERIFY:** `! grep -E '(lib/collections|useAccessibleHosts|useSelectedHost|host-service-client|expo-secure-store|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx'`

### AC-12 — Phase boundary comment present
**GIVEN** Reviewers need to know this is the UI-only variant
**WHEN** I read the first 10 lines of HostPickerSheet.tsx
**THEN** A comment containing the literal substring 'PHASE-1 VISUAL' and reference to 'MOB-NAV-008-INT' is present
**VERIFY:** `head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' | grep -q 'PHASE-1 VISUAL' && head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' | grep -q 'MOB-NAV-008-INT'`

### AC-13 — Typecheck + lint clean
**GIVEN** All files in place
**WHEN** I run both gates
**THEN** Both exit 0 with no warnings
**VERIFY:** `cd apps/mobile && bun run typecheck && bun run lint`

### AC-14 — Stories render on simulator
**GIVEN** Storybook is configured
**WHEN** Developer launches `bun run storybook` and navigates to HostPickerSheet
**THEN** All four stories (DefaultThreeHosts, SingleHostSelected, EmptyHostList, LongHostName) render visually with the sheet auto-presented (via story decorator) against design tokens in light + dark mode
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator)`


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | All four files exist at canonical HostPickerSheet path | AC-1 | happy_path | `test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/index.ts'` |
| TC-2 | Sheet header shows 'Switch host' title + X close that fires onClose once | AC-2 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-3 | Section header 'THIS ORGANIZATION' rendered with text-muted-foreground | AC-3 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-4 | Only the row matching selectedHostId shows Check icon | AC-4 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-5 | online badge text-emerald-500; offline text-muted-foreground | AC-5 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-6 | Icon heuristic: Laptop for macbook/desktop/laptop; Cloud otherwise | AC-6 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-7 | Row press fires onSelect(host.id) exactly once | AC-7 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-8 | Empty hosts=[] renders 'No devices yet' inline placeholder | AC-8 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-9 | Row + close button minHeight ≥ 44 | AC-9 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-10 | forwardRef exposes typed .present()/.dismiss() methods on the ref | AC-10 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'` |
| TC-11 | HostPickerSheet.tsx has zero data-layer imports | AC-11 | error_case | `! grep -E '(lib/collections\|useAccessibleHosts\|useSelectedHost\|host-service-client\|expo-secure-store\|@trpc/client\|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx'` |
| TC-12 | PHASE-1 VISUAL + MOB-NAV-008-INT comment present in first 10 lines | AC-12 | edge_case | `head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' \| grep -q 'PHASE-1 VISUAL' && head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' \| grep -q 'MOB-NAV-008-INT'` |
| TC-13 | Typecheck + lint exit 0 | AC-13 | happy_path | `cd apps/mobile && bun run typecheck && bun run lint` |
| TC-14 | Four stories render in Storybook on simulator (HUMAN) | AC-14 | happy_path | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)` |

---

## READING LIST

- `plans/chat-mobile-plan/09-uc-nav.md` (lines 154-313) — Wireframe §B host-picker bottom sheet + UC-NAV-03 acceptance criteria
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 1-100) — HostPickerSheet/ sibling-of-SessionsListScreen path; @gorhom/bottom-sheet + BottomSheetFlatList contract; 44pt hit targets
- `plans/chat-mobile-plan/12-component-organization-addendum.md` (lines 1-100) — Folder-per-component + barrel index.ts; route-vs-screen boundary (HostPickerSheet lives under screens/, not components/)

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.stories.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/index.ts (NEW)

### WRITE PROHIBITED
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/** (other NAV tasks own those)
- apps/mobile/providers/SelectedHostProvider/** (Phase 2 — MOB-NAV-008-INT)
- apps/mobile/hooks/useAccessibleHosts/**, apps/mobile/hooks/useSelectedHost/** (Phase 2)
- apps/mobile/lib/** (no data wiring in Phase 1)
- apps/mobile/.rnstorybook/** (owned by MOB-INFRA-002)
- apps/desktop/**, apps/web/**, packages/** (mobile-only sprint)

---

## DESIGN

### References
- DESIGN-NAV-002 (host-picker sticker sheet — to be attached at merge)
- DESIGN-PLATF-003 (Lucide iconography spec — to be attached at merge)
- plans/chat-mobile-plan/09-uc-nav.md §B host-picker wireframe
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-002-host-picker-sticker-sheet.md
- apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md

### Interaction notes
- Use BottomSheetModal + BottomSheetFlatList (per gorhom docs) — modal pattern so the sheet renders above app chrome.
- Sheet handle: rendered automatically by @gorhom/bottom-sheet; override via handleStyle if needed to match the muted-bar token.
- Snap points: ['50%','90%'] so the sheet starts half-screen and expands; configurable later by parent.
- Backdrop: render a BottomSheetBackdrop with onPress → onClose() so tap-outside dismissal works (UC-NAV-03 AC).
- Story decorator must mount BottomSheetModalProvider and call sheetRef.current?.present() in a useEffect so the sheet auto-presents inside Storybook canvas.
- Row: 44pt minHeight, horizontal padding 4 (px-4), gap-3 between icon + text-stack + check; text-stack: name (font-semibold), meta line (text-sm text-muted-foreground).
- Use @gorhom/bottom-sheet BottomSheet with snapPoints={['50%', '85%']} — initial snap to '50%'; expand to '85%' if the host list overflows
- Use BottomSheetFlatList (not FlatList) for the host list — required for gesture-handler compatibility with bottom-sheet scroll
- Sheet handle: render a custom handle component (32×4pt pill, backgroundColor --color-border, alignSelf:'center', marginTop:{8}) — do NOT use the default bottom-sheet handle which has different styling
- Sheet header: View with flexDirection:'row' justifyContent:'space-between' alignItems:'center' paddingHorizontal:{16} paddingBottom:{12}; 'Switch host' at 17sp fontWeight='600' --color-foreground left; X Pressable 44×44pt right with Close icon 20pt --color-foreground strokeWidth={1.5}
- Section label 'This organization': 12sp uppercase letterSpacing={0.5} --color-muted-foreground paddingHorizontal:{16} paddingTop:{8} paddingBottom:{4}
- Host row: height={60}, paddingHorizontal:{16}, flexDirection:'row', alignItems:'center'; host icon (Monitor or Cloud) 20pt --color-foreground left with marginRight:{12}; name+meta column flex:1; online/offline badge right; Check icon 16pt --color-primary far right for selected state — only render Check when selected
- Online badge: 8pt circle backgroundColor --color-primary; offline badge: 8pt circle backgroundColor --color-muted-foreground — render as View(width:8 height:8 borderRadius:4)
- Tap host row: call onSelect(host.id) — NO navigation, NO state mutation; this component is props-driven; the screen/provider above handles host selection persistence
- Safe-area bottom: wrap BottomSheetFlatList footer with a View using paddingBottom from useSafeAreaInsets().bottom
- Empty-list state: when hosts array is empty, render inline message inside the sheet body (not a full-screen empty state) — 'No hosts available' centered at 14sp --color-muted-foreground
- Loading state: when isLoading prop is true, render a centered ActivityIndicator with color --color-primary

### Pattern
Folder-per-component, screens/ subtree (sibling of SessionsListScreen per route-vs-screen boundary in addendum Convention 4), forwardRef to expose imperative present/dismiss to the parent screen in Phase 2.

**Pattern source:** plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md + plans/chat-mobile-plan/12-component-organization-addendum.md Convention 4

### Anti-pattern
Embedding data hooks in the -UI variant; using a plain Modal instead of gorhom bottom sheet (loses snap-points + handle UX); placing the sheet under SessionsListScreen/components/ (violates sibling-screen organization).

---

## VERIFICATION GATES

### Files exist
- **Command:** `test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/index.ts'`
- **Expected:** Exit 0

### Unit tests
- **Command:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'`
- **Expected:** All assertions pass

### Purity check
- **Command:** `! grep -E '(lib/collections|useAccessibleHosts|useSelectedHost|host-service-client|expo-secure-store|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx'`
- **Expected:** Exit 0 (no matches)

### Phase boundary comment
- **Command:** `head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' | grep -q 'PHASE-1 VISUAL' && head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' | grep -q 'MOB-NAV-008-INT'`
- **Expected:** Exit 0

### Typecheck
- **Command:** `cd apps/mobile && bun run typecheck`
- **Expected:** Exit 0

### Lint
- **Command:** `cd apps/mobile && bun run lint`
- **Expected:** Exit 0, no warnings

### Stories render
- **Command:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator)`
- **Expected:** All four HostPickerSheet stories render across light + dark with auto-presented sheet


---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-001, MOB-INFRA-002
- **Blocks:** MOB-NAV-008-INT (Phase 2 — out of this sprint)

---

## CODING STANDARDS

- `AGENTS.md — Project Structure (folder-per-component + barrel index.ts)`
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md`
- `plans/chat-mobile-plan/12-component-organization-addendum.md (Convention 4 — route vs screen boundary)`

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
      "description": "GIVEN HostPickerSheet is a sibling of SessionsListScreen, WHEN I check filesystem, THEN HostPickerSheet.tsx/stories/test/index.ts all exist.",
      "verify": "test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/index.ts'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN populated story with onClose spy, WHEN mounted, THEN 'Switch host' Text visible AND Pressable[testID=host-picker-sheet-close] wraps Lucide X icon (24pt) AND pressing fires onClose once.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN any populated story, WHEN mounted, THEN 'THIS ORGANIZATION' Text rendered with text-muted-foreground class above the host list.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN three hosts with selectedHostId='h2', WHEN mounted, THEN only row h2 has Lucide Check (20pt text-primary) at testID host-row-check-h2; rows h1 and h3 have no Check.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN one online and one offline host, WHEN mounted, THEN online row Text 'online' has text-emerald-500; offline row Text 'offline' has text-muted-foreground.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN hosts 'macbook','desktop','cloud-1','production-srv', WHEN mounted, THEN regex /macbook|desktop|laptop/i picks Laptop icon for first two AND Cloud icon for the latter two.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN onSelect spy, WHEN fireEvent.press on row host-row-h3, THEN onSelect called exactly once with 'h3'.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "description": "GIVEN hosts=[] and selectedHostId=null, WHEN mounted, THEN zero host rows render AND inline Text contains 'No devices yet' (sheet-local copy, not SessionsEmptyState).",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-9",
      "type": "acceptance_criterion",
      "description": "GIVEN any populated story, WHEN inspecting row Pressables + close-button Pressable, THEN all have minHeight ≥ 44.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-10",
      "type": "acceptance_criterion",
      "description": "GIVEN component wrapped in React.forwardRef, WHEN parent creates ref + calls ref.current.present(), THEN underlying BottomSheetModal present method invoked; typeof ref.current.present === 'function'.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "AC-11",
      "type": "acceptance_criterion",
      "description": "GIVEN Phase 1 purity rule for -UI variant, WHEN I grep HostPickerSheet.tsx, THEN zero imports from lib/collections|useAccessibleHosts|useSelectedHost|host-service-client|expo-secure-store|@trpc/client|@tanstack/electric-db-collection.",
      "verify": "! grep -E '(lib/collections|useAccessibleHosts|useSelectedHost|host-service-client|expo-secure-store|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx'"
    },
    {
      "id": "AC-12",
      "type": "acceptance_criterion",
      "description": "GIVEN reviewers need scope boundary, WHEN reading first 10 lines of HostPickerSheet.tsx, THEN a comment containing 'PHASE-1 VISUAL' AND 'MOB-NAV-008-INT' is present.",
      "verify": "head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' | grep -q 'PHASE-1 VISUAL' && head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' | grep -q 'MOB-NAV-008-INT'"
    },
    {
      "id": "AC-13",
      "type": "acceptance_criterion",
      "description": "GIVEN all files in place, WHEN bun run typecheck && bun run lint runs in apps/mobile, THEN both exit 0 with no warnings.",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "AC-14",
      "type": "acceptance_criterion",
      "description": "GIVEN Storybook configured, WHEN dev runs bun run storybook on simulator and opens HostPickerSheet, THEN all four stories (DefaultThreeHosts/SingleHostSelected/EmptyHostList/LongHostName) render across light + dark with auto-presented sheet.",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "All four files exist at canonical HostPickerSheet path.",
      "maps_to_ac": "AC-1",
      "verify": "test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.stories.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx' && test -f 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/index.ts'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "Sheet header shows 'Switch host' + X close that fires onClose once.",
      "maps_to_ac": "AC-2",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Section header 'THIS ORGANIZATION' visible with text-muted-foreground.",
      "maps_to_ac": "AC-3",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Only the row matching selectedHostId shows Check.",
      "maps_to_ac": "AC-4",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Online badge uses text-emerald-500; offline uses text-muted-foreground.",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Icon heuristic picks Laptop for macbook/desktop/laptop; Cloud otherwise.",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Row press fires onSelect(host.id) once.",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Empty hosts=[] renders 'No devices yet' inline placeholder.",
      "maps_to_ac": "AC-8",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "Row + close button minHeight ≥ 44.",
      "maps_to_ac": "AC-9",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "forwardRef exposes typed .present()/.dismiss() methods.",
      "maps_to_ac": "AC-10",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.test.tsx'"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "HostPickerSheet.tsx has zero data-layer imports.",
      "maps_to_ac": "AC-11",
      "verify": "! grep -E '(lib/collections|useAccessibleHosts|useSelectedHost|host-service-client|expo-secure-store|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx'"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "PHASE-1 VISUAL + MOB-NAV-008-INT comment present at top.",
      "maps_to_ac": "AC-12",
      "verify": "head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' | grep -q 'PHASE-1 VISUAL' && head -n 10 'apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/HostPickerSheet.tsx' | grep -q 'MOB-NAV-008-INT'"
    },
    {
      "id": "TC-13",
      "type": "test_criterion",
      "description": "Typecheck + lint exit 0.",
      "maps_to_ac": "AC-13",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "TC-14",
      "type": "test_criterion",
      "description": "Stories render on simulator across light + dark (HUMAN).",
      "maps_to_ac": "AC-14",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    }
  ]
}
-->
