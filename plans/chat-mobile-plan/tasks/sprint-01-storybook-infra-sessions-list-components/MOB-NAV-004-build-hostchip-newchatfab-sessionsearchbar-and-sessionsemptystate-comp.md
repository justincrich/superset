# TASK: MOB-NAV-004 — Build HostChip, NewChatFab, SessionSearchBar, and SessionsEmptyState components with stories

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

**AGENT_RATIONALE:** RN/Expo UI specialist; owns chip/FAB/text-input/empty-state primitives with Lucide iconography and 44pt hit targets.

---

## OUTCOME

All four component folders exist with the four canonical files; tests cover variant rendering + callback wiring + 44pt hit targets; 11+ stories render correctly in Storybook on simulator across light + dark; typecheck + lint exit 0.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- All four components MUST be pure — no data hooks, no Electric/tRPC. Props supply all data; Storybook stories supply mock props.
- All four MUST live as siblings under `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/` per `05-ui-infrastructure.md`: HostChip/, NewChatFab/, SessionSearchBar/, SessionsEmptyState/.
- Each MUST co-locate `*.tsx`, `*.stories.tsx`, `*.test.tsx`, `index.ts` per `12-component-organization-addendum.md`.
- MUST use Lucide icons via `lucide-react-native`: HostChip uses `Laptop` (host icon, 16pt) + `ChevronDown` (12pt); NewChatFab uses `Plus` (24pt); SessionSearchBar uses `Search` (16pt) + `X` (16pt clear); SessionsEmptyState uses 48pt illustration icons (`HelpCircle` for no-hosts, `Folder` for no-workspaces, `MessageSquare` for no-sessions, `SearchX` for no-search-results).
- All interactive controls MUST hit 44pt minimum touch target per `05-ui-infrastructure.md`. NewChatFab MUST be 56pt × 56pt (Material FAB standard, exceeds 44pt).
- HostChip props EXACTLY: `{ hostName: string; isOnline: boolean; onPress(): void; testID?: string }`. Renders chip label `{Laptop icon} {hostName} {online dot} {ChevronDown}` with bg-secondary token; `isOnline=true` renders a 6pt green dot (text-emerald-500), `false` renders a 6pt gray dot (text-muted-foreground). testID: `host-chip`.
- NewChatFab props EXACTLY: `{ onPress(): void; emphasized?: boolean; testID?: string }`. Floating circular Pressable 56×56, anchored bottom-right via absolute positioning (right: 16, bottom: 16) when used directly; `emphasized=true` adds a subtle scale-up (1.1×) for UC-NAV-06.3 empty-state callout. testID: `new-chat-fab`.
- SessionSearchBar props EXACTLY: `{ value: string; onChangeText(next: string): void; onClear(): void; placeholder?: string; testID?: string }`. TextInput row with leading Search icon, trailing X clear button visible only when `value.length > 0`; rounded-md container with bg-input + text-foreground; min-height 44pt. testIDs: `session-search-bar-input`, `session-search-bar-clear`.
- SessionsEmptyState props EXACTLY: `{ variant: 'no_hosts' | 'no_workspaces' | 'no_sessions' | 'no_search_results'; query?: string; onPrimaryPress?(): void; testID?: string }`. Render copy per `09-uc-nav.md` §E + §A3: `no_hosts` → 'No devices yet' + 'Connect a device from the Workspaces tab' + button 'Go to Workspaces'; `no_workspaces` → 'No workspaces on this host' + 'Create one on desktop' (no button); `no_sessions` → 'Start your first chat' + 'Tap "+" below to pick a workspace' (no button); `no_search_results` → 'No matches' + dynamic 'No sessions match "{query}" on this host. Try a different query or clear the search to see all.' + button 'Clear search'.
- Use NativeWind/Tailwind tokens (no hex literals).
- Stories cover: HostChip (online + offline + long-name), NewChatFab (default + emphasized), SessionSearchBar (empty + populated + with-clear-pressed), SessionsEmptyState (all four variants — no_hosts/no_workspaces/no_sessions/no_search_results, plus variant for long query string).

### NEVER
- NEVER fetch host or workspace data — props supply hostName/isOnline only.
- NEVER hardcode hex colors — use NativeWind token classes (text-emerald-500 is the one Tailwind palette exception allowed for the online dot since the design tokens don't include a semantic 'online' color).
- NEVER bundle mock data outside `*.stories.tsx`.
- NEVER place these components anywhere other than the four canonical sibling folders under SessionsListScreen/components/.

### STRICTLY
- STRICTLY render `SessionsEmptyState` with `_exhaustive: never` switch on variant — TypeScript-enforced exhaustiveness.
- STRICTLY enforce TextInput controlled-component pattern in SessionSearchBar — `value` + `onChangeText` props, no internal state.

---

## SPECIFICATION

**Objective:** Implement four pure presentational components (HostChip, NewChatFab, SessionSearchBar, SessionsEmptyState) that compose the SessionsListScreen header + footer + empty-state surfaces, each with co-located stories + tests, ready for the Phase 2 screen-assembly task to wire data in.

**Success state:** All four component folders exist with the four canonical files; tests cover variant rendering + callback wiring + 44pt hit targets; 11+ stories render correctly in Storybook on simulator across light + dark; typecheck + lint exit 0.

---

## DONE WHEN

- [ ] [AC-1] All four component folders exist with .tsx/.stories/.test/index.ts
- [ ] [AC-2] HostChip renders online dot + Laptop icon + name + ChevronDown
- [ ] [AC-3] HostChip offline renders muted-foreground dot
- [ ] [AC-4] NewChatFab is 56pt circular Pressable
- [ ] [AC-5] NewChatFab emphasized variant scales up
- [ ] [AC-6] SessionSearchBar shows clear button only when value non-empty
- [ ] [AC-7] SessionSearchBar TextInput is controlled
- [ ] [AC-8] SessionsEmptyState renders correct copy per variant
- [ ] [AC-9] SessionsEmptyState invokes onPrimaryPress only for actionable variants
- [ ] [AC-10] Hit-target 44pt enforced on all interactive controls
- [ ] [AC-11] All four components are pure — no data-layer imports
- [ ] [AC-12] Typecheck + lint clean
- [ ] [AC-13] Stories render on simulator across light + dark
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — All four component folders exist with .tsx/.stories/.test/index.ts
**GIVEN** Sprint 01 places each as a sibling under SessionsListScreen/components/
**WHEN** I check the filesystem
**THEN** Each of HostChip/, NewChatFab/, SessionSearchBar/, SessionsEmptyState/ contains .tsx, .stories.tsx, .test.tsx, index.ts
**VERIFY:** `for c in HostChip NewChatFab SessionSearchBar SessionsEmptyState; do for f in $c.tsx $c.stories.tsx $c.test.tsx index.ts; do test -f "apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/$c/$f" || exit 1; done; done`

### AC-2 — HostChip renders online dot + Laptop icon + name + ChevronDown
**GIVEN** Story `<HostChip hostName='macbook' isOnline={true} onPress={fn} />`
**WHEN** Mounted
**THEN** Renders a Laptop icon (16pt), Text containing 'macbook', a 6pt dot with class `text-emerald-500`, and a ChevronDown icon (12pt); root Pressable has testID `host-chip` and minHeight 44
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx'`

### AC-3 — HostChip offline renders muted-foreground dot
**GIVEN** Story `<HostChip hostName='desktop' isOnline={false} ... />`
**WHEN** Mounted
**THEN** The dot uses class `text-muted-foreground` (not emerald) and Laptop icon remains visible
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx'`

### AC-4 — NewChatFab is 56pt circular Pressable
**GIVEN** Story `<NewChatFab onPress={fn} />`
**WHEN** Mounted
**THEN** Root Pressable has width 56, height 56, borderRadius 28 (or `rounded-full`), bg-primary token; contains a Plus icon at 24pt with text-primary-foreground; testID `new-chat-fab`
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx'`

### AC-5 — NewChatFab emphasized variant scales up
**GIVEN** `<NewChatFab onPress={fn} emphasized={true} />`
**WHEN** Mounted
**THEN** The root Pressable applies an additional `transform: [{ scale: 1.1 }]` style for the UC-NAV-06.3 callout
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx'`

### AC-6 — SessionSearchBar shows clear button only when value non-empty
**GIVEN** Story `<SessionSearchBar value='' ... />` then re-render with `value='chat'`
**WHEN** Mounted
**THEN** With empty value, no element with testID `session-search-bar-clear` exists; with non-empty value, the X-icon clear button is present and tapping it invokes `onClear` once
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx'`

### AC-7 — SessionSearchBar TextInput is controlled
**GIVEN** `<SessionSearchBar value='foo' onChangeText={fn} ... />`
**WHEN** I simulate text change to 'foobar' via testing-library
**THEN** `fn` is invoked with the new string 'foobar' and the TextInput's `value` prop equals 'foo' (controlled — does not self-update)
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx'`

### AC-8 — SessionsEmptyState renders correct copy per variant
**GIVEN** Four stories one per variant
**WHEN** Mounted
**THEN** `no_hosts` Text contains 'No devices yet' + button 'Go to Workspaces'; `no_workspaces` contains 'No workspaces on this host' + 'Create one on desktop'; `no_sessions` contains 'Start your first chat'; `no_search_results` with `query='zzzz'` contains 'No matches' AND the literal substring 'zzzz' + button 'Clear search'
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'`

### AC-9 — SessionsEmptyState invokes onPrimaryPress only for actionable variants
**GIVEN** Stories `no_hosts` (with onPrimaryPress fn) and `no_workspaces` (without)
**WHEN** I press the primary action button (if present)
**THEN** `no_hosts` and `no_search_results` render a pressable button that invokes onPrimaryPress once; `no_workspaces` and `no_sessions` render no primary button (no element with testID `sessions-empty-state-primary-action`)
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'`

### AC-10 — Hit-target 44pt enforced on all interactive controls
**GIVEN** HostChip, NewChatFab (56pt), SessionSearchBar clear button, and SessionsEmptyState primary action are interactive
**WHEN** I inspect each root Pressable / clear-button / action-button minHeight or width+height
**THEN** All meet ≥44pt (NewChatFab specifically 56pt)
**VERIFY:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/'`

### AC-11 — All four components are pure — no data-layer imports
**GIVEN** Phase 1 purity rule
**WHEN** I grep all four .tsx files
**THEN** None contains imports from `lib/collections`, `useElectric`, `useSelectedHost`, `host-service-client`, `@trpc/client`, or `@tanstack/electric-db-collection`
**VERIFY:** `! grep -rE '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx'`

### AC-12 — Typecheck + lint clean
**GIVEN** All files in place
**WHEN** I run typecheck and lint
**THEN** Both exit 0 with no warnings
**VERIFY:** `cd apps/mobile && bun run typecheck && bun run lint`

### AC-13 — Stories render on simulator across light + dark
**GIVEN** Storybook is configured
**WHEN** Developer launches `bun run storybook` and navigates to each of the four components
**THEN** HostChip (3 stories), NewChatFab (2 stories), SessionSearchBar (3 stories), SessionsEmptyState (5 stories) all render visually against design tokens in light + dark mode
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator)`


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | All four folders contain .tsx/.stories/.test/index.ts | AC-1 | happy_path | `for c in HostChip NewChatFab SessionSearchBar SessionsEmptyState; do for f in $c.tsx $c.stories.tsx $c.test.tsx index.ts; do test -f "apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/$c/$f" \|\| exit 1; done; done` |
| TC-2 | HostChip online: Laptop + name + emerald dot + ChevronDown rendered, minHeight 44, testID host-chip | AC-2 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx'` |
| TC-3 | HostChip offline uses text-muted-foreground dot | AC-3 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx'` |
| TC-4 | NewChatFab is 56×56 rounded-full with Plus 24pt | AC-4 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx'` |
| TC-5 | NewChatFab emphasized applies scale 1.1 transform | AC-5 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx'` |
| TC-6 | SessionSearchBar clear button hidden when value=='' and visible+functional when populated | AC-6 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx'` |
| TC-7 | SessionSearchBar TextInput is controlled — onChangeText fires with new value but value prop unchanged | AC-7 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx'` |
| TC-8 | SessionsEmptyState renders correct copy for each of four variants (including query interpolation) | AC-8 | happy_path | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'` |
| TC-9 | SessionsEmptyState primary button present only for no_hosts + no_search_results; invokes onPrimaryPress once | AC-9 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'` |
| TC-10 | All interactive controls meet 44pt (FAB 56pt) | AC-10 | edge_case | `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/'` |
| TC-11 | All four .tsx have zero data-layer imports | AC-11 | error_case | `! grep -rE '(lib/collections\|useElectric\|useSelectedHost\|host-service-client\|@trpc/client\|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx'` |
| TC-12 | Typecheck + lint exit 0 | AC-12 | happy_path | `cd apps/mobile && bun run typecheck && bun run lint` |
| TC-13 | All stories render on simulator (HUMAN) | AC-13 | happy_path | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)` |

---

## READING LIST

- `plans/chat-mobile-plan/09-uc-nav.md` (lines 26-373) — Wireframes §A (HostChip + FAB + SearchBar layout), §A3 (search active + no-results), §E (empty states), UC-NAV-06 + UC-NAV-07 acceptance criteria
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 1-200) — Component paths under SessionsListScreen/components/; Tailwind translation; 44pt hit targets
- `plans/chat-mobile-plan/12-component-organization-addendum.md` (lines 1-100) — Folder-per-component + co-location rules

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.stories.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/index.ts (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.stories.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/index.ts (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.stories.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/index.ts (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.stories.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx (NEW)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/index.ts (NEW)

### WRITE PROHIBITED
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx (Phase 2 — screen assembly)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionRow/** (MOB-NAV-002)
- apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/WorkspaceSection/** (MOB-NAV-003)
- apps/mobile/screens/(authenticated)/(chat)/HostPickerSheet/** (MOB-NAV-008-UI)
- apps/mobile/lib/**, apps/mobile/hooks/** (no data wiring in Phase 1)
- apps/mobile/.rnstorybook/** (owned by MOB-INFRA-002)
- apps/desktop/**, apps/web/**, packages/** (mobile-only sprint)

---

## DESIGN

### References
- DESIGN-NAV-001 (sessions list sticker sheet)
- DESIGN-PLATF-003 (Lucide iconography spec)
- plans/chat-mobile-plan/09-uc-nav.md §A (chip + FAB + search) and §E (empty states)
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-003-newchat-empty-states-sticker-sheet.md
- apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md

### Interaction notes
- HostChip: row pressable with bg-secondary, rounded-full, gap-1 between icon+name+dot+chevron, minHeight 44pt.
- NewChatFab: 56×56 circular, bg-primary, elevation 6 (Android) / shadow-md (iOS), absolute bottom-4 right-4 when consumed by SessionsListScreen — but Phase 1 stories should NOT absolutely-position; render inline so the story canvas shows it cleanly. Document this in storybook decorator.
- SessionSearchBar: bg-input rounded-md row with leading Search icon at 16pt and trailing X clear button (44pt hit target wrapping the 16pt icon).
- SessionsEmptyState: vertically-centered Column with 48pt illustration icon at top, title (text-foreground, font-semibold), description (text-muted-foreground), optional primary button (bg-primary text-primary-foreground rounded-md, minHeight 44pt).
- HostChip: visual height 32pt, background --color-secondary, borderRadius 16pt (pill), paddingHorizontal={12}; tap target is 44pt — add paddingVertical={6} to the Pressable wrapper; label is hostname at 13sp medium --color-secondary-foreground; online indicator is 8pt dot in --color-primary (left of label) or --color-muted-foreground for offline; chevron-down 16pt --color-muted-foreground right of label
- NewChatFab: 56pt diameter circle, background --color-primary, elevation/shadow (Android: elevation={4}, iOS: shadowColor='#000' shadowOpacity={0.15} shadowRadius={8} shadowOffset={{width:0,height:2}}); Plus icon 24pt --color-primary-foreground strokeWidth={1.5}; anchored bottom-right with position='absolute' right={16} bottom={16}; in no-sessions empty state add a subtle Reanimated scale pulse (1.0→1.05→1.0 loop, 1500ms withRepeat withSequence withTiming)
- SessionSearchBar: container height 34pt, backgroundColor --color-input, borderRadius 8pt, horizontal padding 12pt; Search icon 16pt --color-muted-foreground on the left; TextInput flex:1 in the middle at 14sp --color-foreground placeholder --color-muted-foreground; X (Clear) icon 16pt --color-muted-foreground on the right — only render when query.length > 0; full row tap target is 44pt (paddingVertical={5} on outer container)
- SessionsEmptyState: props-driven with a 'variant' prop: 'no-hosts' | 'no-workspaces' | 'no-sessions' | 'no-search'; center-aligned column layout; icon 48pt at appropriate --color-muted; heading 18sp semibold --color-foreground; body 14sp --color-muted-foreground; CTA button (only no-hosts and no-search variants) at 44pt height
- no-search 'Clear search' CTA: Text-only button (no background), 14sp --color-primary, 44pt tap target via paddingVertical; onPress clears the searchQuery prop
- no-hosts 'Go to Workspaces' CTA: filled button 44pt height, --color-primary background, --color-primary-foreground text; onPress navigates to (home)/workspaces tab
- All icon size tiers and strokeWidth values MUST match DESIGN-PLATF-003 — do not invent local constants; import from a shared icons constants file or inline from the spec
- HostChip omitted in no-hosts variant — SessionsEmptyState should accept a prop hideHostChip or be composed at the screen level without the HostChip

### Pattern
Folder-per-component with barrel index.ts and co-located stories+tests per 12-component-organization-addendum.md.

**Pattern source:** plans/chat-mobile-plan/12-component-organization-addendum.md

### Anti-pattern
Mixing TextInput state internally; absolute-positioning the FAB inside the component (positioning is the parent screen's responsibility); using hex colors instead of tokens.

---

## VERIFICATION GATES

### Files exist (all 16)
- **Command:** `for c in HostChip NewChatFab SessionSearchBar SessionsEmptyState; do for f in $c.tsx $c.stories.tsx $c.test.tsx index.ts; do test -f "apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/$c/$f" || exit 1; done; done`
- **Expected:** Exit 0

### Unit tests
- **Command:** `cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx' && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx' && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx' && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'`
- **Expected:** All assertions pass

### Purity check
- **Command:** `! grep -rE '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx'`
- **Expected:** Exit 0 (no matches)

### Typecheck
- **Command:** `cd apps/mobile && bun run typecheck`
- **Expected:** Exit 0

### Lint
- **Command:** `cd apps/mobile && bun run lint`
- **Expected:** Exit 0, no warnings

### Stories render
- **Command:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator)`
- **Expected:** All 13+ stories render across light + dark themes


---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-001, MOB-INFRA-002
- **Blocks:** None

---

## CODING STANDARDS

- `AGENTS.md — Project Structure (folder-per-component + barrel index.ts)`
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md`
- `plans/chat-mobile-plan/12-component-organization-addendum.md`

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
      "description": "All four components exist with the canonical four-file set under SessionsListScreen/components/.",
      "verify": "for c in HostChip NewChatFab SessionSearchBar SessionsEmptyState; do for f in $c.tsx $c.stories.tsx $c.test.tsx index.ts; do test -f \"apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/$c/$f\" || exit 1; done; done"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "HostChip online: Laptop + name + emerald dot + ChevronDown, minHeight 44, testID host-chip.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx'"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "HostChip offline uses text-muted-foreground dot.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx'"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "NewChatFab is 56×56 rounded-full with Plus 24pt.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx'"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "NewChatFab emphasized applies scale 1.1 transform.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx'"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "Clear button hidden when value=='' and visible+functional when populated.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx'"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "SessionSearchBar TextInput is controlled — onChangeText fires with new value, value prop unchanged.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx'"
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "description": "SessionsEmptyState renders correct copy for each of four variants incl. query interpolation.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'"
    },
    {
      "id": "AC-9",
      "type": "acceptance_criterion",
      "description": "Primary action button present only for no_hosts + no_search_results; invokes onPrimaryPress once.",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'"
    },
    {
      "id": "AC-10",
      "type": "acceptance_criterion",
      "description": "All interactive controls meet 44pt (FAB 56pt).",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/'"
    },
    {
      "id": "AC-11",
      "type": "acceptance_criterion",
      "description": "All four .tsx have zero data-layer imports.",
      "verify": "! grep -rE '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx'"
    },
    {
      "id": "AC-12",
      "type": "acceptance_criterion",
      "description": "Typecheck + lint exit 0.",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "AC-13",
      "type": "acceptance_criterion",
      "description": "All stories render on simulator across light + dark (HUMAN).",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "All four folders contain .tsx/.stories/.test/index.ts.",
      "maps_to_ac": "AC-1",
      "verify": "for c in HostChip NewChatFab SessionSearchBar SessionsEmptyState; do for f in $c.tsx $c.stories.tsx $c.test.tsx index.ts; do test -f \"apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/$c/$f\" || exit 1; done; done"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "HostChip online assertions pass.",
      "maps_to_ac": "AC-2",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx'"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "HostChip offline dot uses text-muted-foreground.",
      "maps_to_ac": "AC-3",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.test.tsx'"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "NewChatFab 56×56 + Plus 24pt.",
      "maps_to_ac": "AC-4",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx'"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "NewChatFab emphasized scale 1.1.",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.test.tsx'"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "SearchBar clear button conditional visibility + functional.",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx'"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "SearchBar is controlled.",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.test.tsx'"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "EmptyState copy correct per variant.",
      "maps_to_ac": "AC-8",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": "EmptyState primary action variant logic correct.",
      "maps_to_ac": "AC-9",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.test.tsx'"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": "All interactive controls hit 44pt (FAB 56pt).",
      "maps_to_ac": "AC-10",
      "verify": "cd apps/mobile && bun test 'screens/(authenticated)/(chat)/SessionsListScreen/components/'"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": "Purity grep clean across all four .tsx.",
      "maps_to_ac": "AC-11",
      "verify": "! grep -rE '(lib/collections|useElectric|useSelectedHost|host-service-client|@trpc/client|@tanstack/electric-db-collection)' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/HostChip/HostChip.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/NewChatFab/NewChatFab.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionSearchBar/SessionSearchBar.tsx' 'apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/components/SessionsEmptyState/SessionsEmptyState.tsx'"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "Typecheck + lint exit 0.",
      "maps_to_ac": "AC-12",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "TC-13",
      "type": "test_criterion",
      "description": "All stories render on simulator (HUMAN).",
      "maps_to_ac": "AC-13",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    }
  ]
}
-->
