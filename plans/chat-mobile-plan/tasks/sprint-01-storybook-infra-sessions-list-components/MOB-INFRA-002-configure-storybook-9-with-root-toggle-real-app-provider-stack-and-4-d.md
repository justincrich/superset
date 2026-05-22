# TASK: MOB-INFRA-002 — Configure Storybook 9 with root toggle, real-app provider stack, and 4 design-system primitive stories

**TASK_TYPE:** INFRA
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** M
**ESTIMATE:** 240 min
**AGENT:** implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 115/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** Owns Expo/Metro bundler config, RN bootstrap, and on-device Storybook integration.

---

## OUTCOME

Running `cd apps/mobile && bun run storybook` boots the Expo dev server with Storybook owning the root viewport on simulator; the existing `bun start` (without env flag) continues to launch the real app unchanged; typecheck + lint pass; production export contains no @storybook code.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- Configure Storybook 9 via a `.rnstorybook/` directory at `apps/mobile/.rnstorybook/` per `13-testing-strategy.md` — NOT a nested route in `app/`.
- `main.ts` story globs MUST cover `./stories/**/*.stories.?(ts|tsx)`, `../components/chat/**/*.stories.?(ts|tsx)`, AND `../screens/(authenticated)/(chat)/**/*.stories.?(ts|tsx)` so co-located stories under screens/components are picked up.
- Gate Storybook behind `process.env.EXPO_PUBLIC_STORYBOOK === 'true'` in `app/_layout.tsx` using a conditional `require('../.rnstorybook').default` so Metro dead-code-eliminates the entire Storybook branch when the flag is unset.
- Wrap `metro.config.js` with `@storybook/react-native/metro/withStorybook` so HMR works for story files.
- Add `"storybook": "EXPO_PUBLIC_STORYBOOK=true expo start"` to `apps/mobile/package.json` scripts.
- `preview.tsx` MUST wrap every story in a decorator stack: theme provider (light/dark via the existing tokens in `apps/mobile/global.css`), `SafeAreaProvider` + `SafeAreaView`, and a default padding view.
- Confirm production-bundle parity: when `EXPO_PUBLIC_STORYBOOK` is unset, `expo export` output must not contain any chunk under `node_modules/@storybook/*` (validated via grep of the export bundle manifest).
- MUST mirror the real-app provider stack in `.rnstorybook/preview.tsx`: import `react-native-get-random-values` first → import `../global.css` → wrap stories in `GestureHandlerRootView` + `SafeAreaProvider` + `ThemeProvider(NAV_THEME[mode])` + `PortalHost`. Deliberately EXCLUDE `QueryClientProvider` and `PostHogProvider`.
- MUST ship 4 primitive design-system stories under `.rnstorybook/stories/design-system/`: `ColorSwatches.stories.tsx` (all 21 tokens × light/dark via real uniwind className), `Typography.stories.tsx` (size/weight matrix), `Spacing.stories.tsx` (padding/gap/radius scale), `Icons.stories.tsx` (Lucide icons at 4 size tiers per DESIGN-PLATF-003). These act as the smoke test that theme wiring is correct before component stories run.
- MUST synchronize `Uniwind.setTheme(mode)` AND `ThemeProvider(NAV_THEME[mode])` via the on-device theme toggle — they must switch together, not independently.

### NEVER
- NEVER load Storybook unconditionally or at module top-level in `app/_layout.tsx` — always behind the env flag so dead-code-elimination can prune it.
- NEVER add story globs that match production code paths outside the chat subtree (no `app/**`, no `lib/**`).
- NEVER commit a real device/simulator screenshot or binary as part of this task.
- NEVER mark this task complete without confirming Storybook actually boots on the iOS Simulator (human-verified).

### STRICTLY
- STRICTLY keep the production code path (when env flag is unset) byte-identical to today's bootstrap shape — no extra component wrappers or providers.
- STRICTLY conform `app/_layout.tsx` changes to the existing import order and Biome formatter rules.

---

## SPECIFICATION

**Objective:** Stand up Storybook 9 on-device for `apps/mobile` with a build-time-stripped root toggle, custom `.rnstorybook` config dir, Metro HMR wrap, and a `storybook` package script so component tasks can verify visuals on simulator.

**Success state:** Running `cd apps/mobile && bun run storybook` boots the Expo dev server with Storybook owning the root viewport on simulator; the existing `bun start` (without env flag) continues to launch the real app unchanged; typecheck + lint pass; production export contains no @storybook code.

---

## DONE WHEN

- [ ] [AC-1] Storybook config files exist with correct globs and addons
- [ ] [AC-2] Root layout gates Storybook behind EXPO_PUBLIC_STORYBOOK
- [ ] [AC-3] Metro config wraps with withStorybook
- [ ] [AC-4] `storybook` script present in apps/mobile/package.json
- [ ] [AC-5] Typecheck + lint pass with all new files
- [ ] [AC-6] Storybook boots on simulator with at least one story
- [ ] [AC-7] Production bundle excludes Storybook code
- [ ] [AC-8] Provider stack mirrors real app (Uniwind + NAV_THEME + Gesture + SafeArea + PortalHost)
- [ ] [AC-9] Theme toggle synchronizes Uniwind + NAV_THEME
- [ ] [AC-10] Bottom-sheet and popover primitives render without crashes
- [ ] [AC-11] ColorSwatches primitive story renders all 21 tokens
- [ ] [AC-12] Typography primitive story renders type scale
- [ ] [AC-13] Spacing primitive story renders spacing + radius scale
- [ ] [AC-14] Icons primitive story renders Lucide icons per DESIGN-PLATF-003
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — Storybook config files exist with correct globs and addons
**GIVEN** Storybook 9 packages are installed (per MOB-INFRA-001)
**WHEN** I read `apps/mobile/.rnstorybook/main.ts` and `apps/mobile/.rnstorybook/preview.tsx`
**THEN** `main.ts` exports a `StorybookConfig` whose `stories` array contains exactly the three globs (`./stories/**`, `../components/chat/**`, `../screens/(authenticated)/(chat)/**`) and whose `addons` array includes `@storybook/addon-ondevice-controls` and `@storybook/addon-ondevice-actions`; `preview.tsx` exports a `decorators` array applying a theme + SafeAreaProvider wrapper
**VERIFY:** `test -f apps/mobile/.rnstorybook/main.ts && test -f apps/mobile/.rnstorybook/preview.tsx && grep -q 'components/chat' apps/mobile/.rnstorybook/main.ts && grep -q 'screens/(authenticated)/(chat)' apps/mobile/.rnstorybook/main.ts && grep -q 'addon-ondevice-controls' apps/mobile/.rnstorybook/main.ts && grep -q 'addon-ondevice-actions' apps/mobile/.rnstorybook/main.ts`

### AC-2 — Root layout gates Storybook behind EXPO_PUBLIC_STORYBOOK
**GIVEN** `app/_layout.tsx` is the Expo Router root layout
**WHEN** I read `apps/mobile/app/_layout.tsx`
**THEN** The file conditionally renders the Storybook root only when `process.env.EXPO_PUBLIC_STORYBOOK === 'true'` via a top-level `require('../.rnstorybook').default` pattern, and falls through to the existing app layout otherwise
**VERIFY:** `grep -q "EXPO_PUBLIC_STORYBOOK" apps/mobile/app/_layout.tsx && grep -q "require('../.rnstorybook')" apps/mobile/app/_layout.tsx`

### AC-3 — Metro config wraps with withStorybook
**GIVEN** `metro.config.js` is Expo's default Metro config
**WHEN** I read `apps/mobile/metro.config.js`
**THEN** The exported config is wrapped with `require('@storybook/react-native/metro/withStorybook')(getDefaultConfig(__dirname))` so story HMR works
**VERIFY:** `grep -q "@storybook/react-native/metro/withStorybook" apps/mobile/metro.config.js`

### AC-4 — `storybook` script present in apps/mobile/package.json
**GIVEN** Developers will launch Storybook frequently
**WHEN** I read `apps/mobile/package.json`
**THEN** `scripts.storybook` equals `EXPO_PUBLIC_STORYBOOK=true expo start`
**VERIFY:** `cd apps/mobile && node -e "const s=require('./package.json').scripts; if(s.storybook!=='EXPO_PUBLIC_STORYBOOK=true expo start'){console.error('script wrong:',s.storybook);process.exit(1)}"`

### AC-5 — Typecheck + lint pass with all new files
**GIVEN** Storybook config, preview, and layout changes are in place
**WHEN** I run `cd apps/mobile && bun run typecheck && cd apps/mobile && bun run lint`
**THEN** Both exit 0 with no warnings
**VERIFY:** `cd apps/mobile && bun run typecheck && bun run lint`

### AC-6 — Storybook boots on simulator with at least one story
**GIVEN** All config is in place AND a sample story exists at `apps/mobile/.rnstorybook/stories/Welcome.stories.tsx` (created by this task as a smoke-test fixture)
**WHEN** A developer runs `cd apps/mobile && bun run storybook` and launches the iOS Simulator build
**THEN** Storybook renders its on-device UI with the Welcome story visible and the addon-ondevice-controls panel reachable
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator — confirm Welcome story renders + controls panel reachable)`

### AC-7 — Production bundle excludes Storybook code
**GIVEN** The env flag is unset (default for EAS production profiles)
**WHEN** I run `cd apps/mobile && bunx expo export --platform ios --output-dir /tmp/expo-export-noflag` and inspect the bundle assets
**THEN** No file under the export output contains references to `@storybook/react-native` runtime modules — confirming dead-code-elimination removed the branch
**VERIFY:** `cd apps/mobile && bunx expo export --platform ios --output-dir /tmp/expo-export-noflag && ! grep -rl '@storybook/react-native' /tmp/expo-export-noflag/_expo /tmp/expo-export-noflag/dist 2>/dev/null`

### AC-8 — Provider stack mirrors real app (Uniwind + NAV_THEME + Gesture + SafeArea + PortalHost)
**GIVEN** Storybook decorator wraps every story in the project's provider stack
**WHEN** Any story renders inside Storybook
**THEN** The decorator imports `react-native-get-random-values` first, imports `../global.css`, wraps in GestureHandlerRootView + SafeAreaProvider + ThemeProvider(NAV_THEME[mode]) + PortalHost; QueryClientProvider and PostHogProvider are deliberately EXCLUDED
**VERIFY:** `cd apps/mobile && bun run typecheck && bun run lint`

### AC-9 — Theme toggle synchronizes Uniwind + NAV_THEME
**GIVEN** Storybook on-device controls expose a 'theme' parameter with options ['light','dark']
**WHEN** Reviewer flips between light and dark on simulator
**THEN** Both Uniwind.setTheme(mode) AND ThemeProvider(NAV_THEME[mode]) switch synchronously with no half-themed flash; ColorSwatches story re-renders with correct token values
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)`

### AC-10 — Bottom-sheet and popover primitives render without crashes
**GIVEN** GestureHandlerRootView and PortalHost are mounted at the decorator root
**WHEN** A future story imports @gorhom/bottom-sheet or @rn-primitives/popover and renders
**THEN** The story does NOT crash with a missing-PortalHost or missing-GestureHandlerRootView error
**VERIFY:** `cd apps/mobile && bun test '.rnstorybook/decorator.test.tsx'`

### AC-11 — ColorSwatches primitive story renders all 21 tokens
**GIVEN** .rnstorybook/stories/design-system/ColorSwatches.stories.tsx exists
**WHEN** Story renders on simulator in light mode, then reviewer toggles to dark mode
**THEN** All 21 swatches (20 semantic tokens + radius) display the correct light-mode token value, then re-render with dark-mode values without remount; uses actual uniwind className (bg-background, etc.) — not hardcoded hex
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)`

### AC-12 — Typography primitive story renders type scale
**GIVEN** .rnstorybook/stories/design-system/Typography.stories.tsx exists
**WHEN** Story renders on simulator
**THEN** Every size (11/12/13/14/15/17/18/22sp) and weight (regular/medium/semibold) renders with the system font stack; includes a monospace variant for future code-block typography
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)`

### AC-13 — Spacing primitive story renders spacing + radius scale
**GIVEN** .rnstorybook/stories/design-system/Spacing.stories.tsx exists
**WHEN** Story renders on simulator
**THEN** Padding/gap at 4/8/12/16/24/32/48pt and radius from --radius token (0.5rem) render consistently; Tailwind→uniwind spacing classes resolve as expected
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)`

### AC-14 — Icons primitive story renders Lucide icons per DESIGN-PLATF-003
**GIVEN** .rnstorybook/stories/design-system/Icons.stories.tsx exists
**WHEN** Story renders on simulator
**THEN** Every icon from DESIGN-PLATF-003's mapping renders at all 4 size tiers (16/20/24/48pt) with strokeWidth={1.5}; color switches via tokens (foreground / primary / destructive / muted-foreground), never hardcoded; status icons (Crosshair / AlertTriangle / Circle filled / Circle outlined) render at 16pt for SessionRow preview
**VERIFY:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)`


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | .rnstorybook/main.ts and preview.tsx exist with required globs and addons | AC-1 | happy_path | `test -f apps/mobile/.rnstorybook/main.ts && test -f apps/mobile/.rnstorybook/preview.tsx && grep -q 'components/chat' apps/mobile/.rnstorybook/main.ts && grep -q 'screens/(authenticated)/(chat)' apps/mobile/.rnstorybook/main.ts && grep -q 'addon-ondevice-controls' apps/mobile/.rnstorybook/main.ts` |
| TC-2 | app/_layout.tsx contains EXPO_PUBLIC_STORYBOOK gate + require('../.rnstorybook') | AC-2 | happy_path | `grep -q 'EXPO_PUBLIC_STORYBOOK' apps/mobile/app/_layout.tsx && grep -q "require('../.rnstorybook')" apps/mobile/app/_layout.tsx` |
| TC-3 | metro.config.js applies withStorybook wrapper | AC-3 | happy_path | `grep -q '@storybook/react-native/metro/withStorybook' apps/mobile/metro.config.js` |
| TC-4 | package.json scripts.storybook = 'EXPO_PUBLIC_STORYBOOK=true expo start' | AC-4 | happy_path | `cd apps/mobile && node -e "if(require('./package.json').scripts.storybook!=='EXPO_PUBLIC_STORYBOOK=true expo start')process.exit(1)"` |
| TC-5 | Typecheck exits 0 after layout/metro/config edits | AC-5 | happy_path | `cd apps/mobile && bun run typecheck` |
| TC-6 | Lint exits 0 with no warnings on touched files | AC-5 | happy_path | `cd apps/mobile && bun run lint` |
| TC-7 | On-simulator boot renders Welcome story (HUMAN-VERIFIED) | AC-6 | happy_path | `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification: confirm Storybook root + Welcome story + controls panel)` |
| TC-8 | Production export contains no @storybook/react-native runtime references | AC-7 | edge_case | `cd apps/mobile && bunx expo export --platform ios --output-dir /tmp/expo-export-noflag && ! grep -rl '@storybook/react-native' /tmp/expo-export-noflag/_expo /tmp/expo-export-noflag/dist 2>/dev/null` |
| TC-9 | .rnstorybook/preview.tsx imports `react-native-get-random-values` and `../global.css` in that order | AC-8 | happy_path | `grep -n 'react-native-get-random-values' apps/mobile/.rnstorybook/preview.tsx && grep -n 'global.css' apps/mobile/.rnstorybook/preview.tsx` |
| TC-10 | .rnstorybook/preview.tsx wraps stories in GestureHandlerRootView + SafeAreaProvider + ThemeProvider + PortalHost in correct order | AC-8 | happy_path | `grep -c 'GestureHandlerRootView\\|SafeAreaProvider\\|ThemeProvider\\|PortalHost' apps/mobile/.rnstorybook/preview.tsx` |
| TC-11 | .rnstorybook/preview.tsx does NOT import QueryClientProvider or PostHogProvider | AC-8 | error_case | `! grep -E '(QueryClientProvider\|PostHogProvider)' apps/mobile/.rnstorybook/preview.tsx` |
| TC-12 | ColorSwatches.stories.tsx exists at .rnstorybook/stories/design-system/ | AC-11 | happy_path | `test -f apps/mobile/.rnstorybook/stories/design-system/ColorSwatches.stories.tsx` |
| TC-13 | Typography.stories.tsx exists at .rnstorybook/stories/design-system/ | AC-12 | happy_path | `test -f apps/mobile/.rnstorybook/stories/design-system/Typography.stories.tsx` |
| TC-14 | Spacing.stories.tsx exists at .rnstorybook/stories/design-system/ | AC-13 | happy_path | `test -f apps/mobile/.rnstorybook/stories/design-system/Spacing.stories.tsx` |
| TC-15 | Icons.stories.tsx exists at .rnstorybook/stories/design-system/ | AC-14 | happy_path | `test -f apps/mobile/.rnstorybook/stories/design-system/Icons.stories.tsx` |
| TC-16 | ColorSwatches uses uniwind className (bg-*), not hardcoded hex values | AC-11 | error_case | `grep -E 'bg-background\|bg-foreground\|bg-primary\|bg-secondary' apps/mobile/.rnstorybook/stories/design-system/ColorSwatches.stories.tsx && ! grep -E '#[0-9a-fA-F]{3,6}\|hsl\(' apps/mobile/.rnstorybook/stories/design-system/ColorSwatches.stories.tsx` |

---

## READING LIST

- `plans/chat-mobile-plan/13-testing-strategy.md` (lines 26-95) — Custom root toggle, main.ts globs, withStorybook wrap, build-time stripping rationale
- `plans/chat-mobile-plan/11-technical-requirements/05-ui-infrastructure.md` (lines 1-100) — Component tree paths so story globs match co-location
- `apps/mobile/app/_layout.tsx` (lines 1-200) — Existing root layout shape and import order
- `apps/mobile/metro.config.js` (lines 1-50) — Existing Metro config to wrap, not replace
- `apps/mobile/screens/RootLayout/RootLayout.tsx` (lines 1-40) — Real-app provider stack to mirror in Storybook decorator (Uniwind / QueryClient / PostHog / ThemeProvider / PortalHost)
- `apps/mobile/lib/theme.ts` (lines 1-46) — THEME.light/dark + NAV_THEME.light/dark adapters to import in the decorator
- `apps/mobile/global.css` (lines 1-56) — 20 semantic tokens — ColorSwatches story renders all 21 (incl. radius)
- `apps/mobile/app.config.ts` (lines all) — Confirm userInterfaceStyle: 'dark' and no expo-font (system fonts only)

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/.rnstorybook/main.ts (NEW)
- apps/mobile/.rnstorybook/preview.tsx (NEW)
- apps/mobile/.rnstorybook/index.tsx (NEW — exports default Storybook UI root per @storybook/react-native 9 convention)
- apps/mobile/.rnstorybook/stories/Welcome.stories.tsx (NEW — smoke-test story)
- apps/mobile/app/_layout.tsx (MODIFY — add EXPO_PUBLIC_STORYBOOK gate, keep existing layout intact)
- apps/mobile/metro.config.js (MODIFY — wrap with withStorybook)
- apps/mobile/package.json (MODIFY — add `storybook` script only; do NOT add deps here, that was MOB-INFRA-001)
- apps/mobile/.rnstorybook/preview.tsx (NEW or MODIFY)
- apps/mobile/.rnstorybook/stories/design-system/ColorSwatches.stories.tsx (NEW)
- apps/mobile/.rnstorybook/stories/design-system/Typography.stories.tsx (NEW)
- apps/mobile/.rnstorybook/stories/design-system/Spacing.stories.tsx (NEW)
- apps/mobile/.rnstorybook/stories/design-system/Icons.stories.tsx (NEW)

### WRITE PROHIBITED
- apps/mobile/components/** (reserved for MOB-NAV-* component tasks)
- apps/mobile/screens/** (reserved for Phase 2 screen assembly)
- apps/mobile/global.css (token system is already correct per 05-ui-infrastructure.md)
- apps/desktop/**, apps/web/**, packages/** (mobile-only sprint)

---

## DESIGN

### References
- plans/chat-mobile-plan/13-testing-strategy.md §Component Testing — Storybook with Custom Toggle
- apps/mobile/screens/RootLayout/RootLayout.tsx (provider-stack reference)
- DESIGN-PLATF-003 (Lucide icon spec — Icons.stories.tsx feeds from this mapping)
- DESIGN-NAV-001 (token decisions inform ColorSwatches expected values)
- apps/mobile/docs/design/sprint-01/DESIGN-NAV-001-sessions-list-sticker-sheet.md
- apps/mobile/docs/design/sprint-01/DESIGN-PLATF-003-icon-spec.md

### Interaction notes
- Welcome smoke-story should render a single <Text> reading 'Storybook ready' inside the SafeArea decorator — no other UI.
- Preview decorator MUST wrap every story in: ThemeProvider (from apps/mobile/screens/RootLayout or equivalent) + SafeAreaProvider (react-native-safe-area-context) + a View with padding={8} — without this, status-icon colors and spacing will not reflect the actual token values
- On-device theme switcher: enable @storybook/addon-ondevice-controls for the 'colorScheme' parameter; stories should accept a 'theme' arg ('light'|'dark') and toggle the ThemeProvider; this allows reviewers to verify both themes without restarting Storybook
- Note: the orchestrator has sent more comprehensive steering to react-native-ui-planner for this task including 4 primitive design-system stories (ColorSwatches, Typography, Spacing, Icons) — this enrichment is additive to that steering, not a replacement
- ColorSwatches story: renders all 20 tokens from apps/mobile/global.css as labeled swatches — this story verifies the token system is wired correctly before any component stories are reviewed
- Icons story: renders the complete mapping table from DESIGN-PLATF-003 at all four size tiers — this story verifies lucide-react-native is installed and icon names match the spec before component stories depend on them
- Typography story: renders all type scales used in the session-list components (12sp, 13sp, 14sp, 15sp, 17sp, 18sp) with their font weights — verifies system font rendering on both iOS and Android
- The Storybook root toggle (EXPO_PUBLIC_STORYBOOK=true) must hot-reload stories without a full app restart — confirm @storybook/react-native/metro/withStorybook is in metro.config.js before running stories

### Pattern
Root-toggle Storybook pattern (full app swap behind env flag), per @storybook/react-native v9 docs.

**Pattern source:** plans/chat-mobile-plan/13-testing-strategy.md (canonical for this monorepo)

### Anti-pattern
Mounting Storybook as a nested route inside the real app (app chrome leaks through, env-gating is harder, DCE is unreliable)

---

## VERIFICATION GATES

### Typecheck
- **Command:** `cd apps/mobile && bun run typecheck`
- **Expected:** Exit 0

### Lint
- **Command:** `cd apps/mobile && bun run lint`
- **Expected:** Exit 0, no warnings

### Storybook boot
- **Command:** `cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator + Android Emulator)`
- **Expected:** Storybook root renders, Welcome story visible, on-device controls panel reachable

### Production DCE
- **Command:** `cd apps/mobile && bunx expo export --platform ios --output-dir /tmp/expo-export-noflag && ! grep -rl '@storybook/react-native' /tmp/expo-export-noflag/_expo /tmp/expo-export-noflag/dist 2>/dev/null`
- **Expected:** Exit 0 (no matches) — Storybook code stripped from production bundle


---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-001
- **Blocks:** MOB-NAV-002, MOB-NAV-003, MOB-NAV-004, MOB-NAV-008-UI

---

## CODING STANDARDS

- `AGENTS.md — Project Structure (folder-per-component for app code)`
- `AGENTS.md — Agent Rule #7 (no lint warnings)`
- `plans/chat-mobile-plan/13-testing-strategy.md (canonical Storybook setup)`

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
      "description": "GIVEN Storybook packages installed, WHEN I read .rnstorybook/{main,preview}, THEN main.ts has the three globs and on-device addons, and preview.tsx applies theme + SafeArea decorators.",
      "verify": "test -f apps/mobile/.rnstorybook/main.ts && test -f apps/mobile/.rnstorybook/preview.tsx && grep -q 'components/chat' apps/mobile/.rnstorybook/main.ts && grep -q 'screens/(authenticated)/(chat)' apps/mobile/.rnstorybook/main.ts && grep -q 'addon-ondevice-controls' apps/mobile/.rnstorybook/main.ts && grep -q 'addon-ondevice-actions' apps/mobile/.rnstorybook/main.ts"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN app/_layout.tsx is the root, WHEN I read it, THEN it conditionally requires ../.rnstorybook only when EXPO_PUBLIC_STORYBOOK==='true'.",
      "verify": "grep -q 'EXPO_PUBLIC_STORYBOOK' apps/mobile/app/_layout.tsx && grep -q \"require('../.rnstorybook')\" apps/mobile/app/_layout.tsx"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN metro.config.js is Expo default, WHEN I read it, THEN it is wrapped with @storybook/react-native/metro/withStorybook.",
      "verify": "grep -q '@storybook/react-native/metro/withStorybook' apps/mobile/metro.config.js"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN devs launch Storybook frequently, WHEN I read package.json, THEN scripts.storybook = 'EXPO_PUBLIC_STORYBOOK=true expo start'.",
      "verify": "cd apps/mobile && node -e \"if(require('./package.json').scripts.storybook!=='EXPO_PUBLIC_STORYBOOK=true expo start')process.exit(1)\""
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN Storybook config + layout changes land, WHEN bun run typecheck && lint runs, THEN both exit 0.",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN config + Welcome smoke-story exist, WHEN dev runs bun run storybook on simulator, THEN Storybook UI + Welcome story + on-device controls panel render.",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification on iOS Simulator)"
    },
    {
      "id": "AC-7",
      "type": "acceptance_criterion",
      "description": "GIVEN env flag unset, WHEN bunx expo export runs, THEN no @storybook/react-native references exist in the export output (DCE confirmed).",
      "verify": "cd apps/mobile && bunx expo export --platform ios --output-dir /tmp/expo-export-noflag && ! grep -rl '@storybook/react-native' /tmp/expo-export-noflag/_expo /tmp/expo-export-noflag/dist 2>/dev/null"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": ".rnstorybook/main.ts and preview.tsx exist with required globs and addons.",
      "maps_to_ac": "AC-1",
      "verify": "test -f apps/mobile/.rnstorybook/main.ts && test -f apps/mobile/.rnstorybook/preview.tsx && grep -q 'components/chat' apps/mobile/.rnstorybook/main.ts && grep -q 'screens/(authenticated)/(chat)' apps/mobile/.rnstorybook/main.ts && grep -q 'addon-ondevice-controls' apps/mobile/.rnstorybook/main.ts"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "app/_layout.tsx contains EXPO_PUBLIC_STORYBOOK gate + require('../.rnstorybook').",
      "maps_to_ac": "AC-2",
      "verify": "grep -q 'EXPO_PUBLIC_STORYBOOK' apps/mobile/app/_layout.tsx && grep -q \"require('../.rnstorybook')\" apps/mobile/app/_layout.tsx"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "metro.config.js applies withStorybook wrapper.",
      "maps_to_ac": "AC-3",
      "verify": "grep -q '@storybook/react-native/metro/withStorybook' apps/mobile/metro.config.js"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "package.json scripts.storybook = 'EXPO_PUBLIC_STORYBOOK=true expo start'.",
      "maps_to_ac": "AC-4",
      "verify": "cd apps/mobile && node -e \"if(require('./package.json').scripts.storybook!=='EXPO_PUBLIC_STORYBOOK=true expo start')process.exit(1)\""
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Typecheck exits 0 after layout/metro/config edits.",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && bun run typecheck"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Lint exits 0 with no warnings on touched files.",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && bun run lint"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "On-simulator boot renders Welcome story (HUMAN-VERIFIED).",
      "maps_to_ac": "AC-6",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "Production export contains no @storybook/react-native runtime references.",
      "maps_to_ac": "AC-7",
      "verify": "cd apps/mobile && bunx expo export --platform ios --output-dir /tmp/expo-export-noflag && ! grep -rl '@storybook/react-native' /tmp/expo-export-noflag/_expo /tmp/expo-export-noflag/dist 2>/dev/null"
    },
    {
      "id": "AC-8",
      "type": "acceptance_criterion",
      "description": "GIVEN Storybook decorator wraps every story in the project's provider stack WHEN Any story renders inside Storybook THEN The decorator imports `react-native-get-random-values` first, imports `../global.css`, wraps in GestureHandlerRootView + SafeAreaProvider + ThemeProvider(NAV_THEME[mode]) + PortalHost; QueryClientProvider and PostHogProvider are deliberately EXCLUDED",
      "verify": "cd apps/mobile && bun run typecheck && bun run lint"
    },
    {
      "id": "AC-9",
      "type": "acceptance_criterion",
      "description": "GIVEN Storybook on-device controls expose a 'theme' parameter with options ['light','dark'] WHEN Reviewer flips between light and dark on simulator THEN Both Uniwind.setTheme(mode) AND ThemeProvider(NAV_THEME[mode]) switch synchronously with no half-themed flash; ColorSwatches story re-renders with correct token values",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "AC-10",
      "type": "acceptance_criterion",
      "description": "GIVEN GestureHandlerRootView and PortalHost are mounted at the decorator root WHEN A future story imports @gorhom/bottom-sheet or @rn-primitives/popover and renders THEN The story does NOT crash with a missing-PortalHost or missing-GestureHandlerRootView error",
      "verify": "cd apps/mobile && bun test '.rnstorybook/decorator.test.tsx'"
    },
    {
      "id": "AC-11",
      "type": "acceptance_criterion",
      "description": "GIVEN .rnstorybook/stories/design-system/ColorSwatches.stories.tsx exists WHEN Story renders on simulator in light mode, then reviewer toggles to dark mode THEN All 21 swatches (20 semantic tokens + radius) display the correct light-mode token value, then re-render with dark-mode values without remount; uses actual uniwind className (bg-background, etc.) — not hardcoded hex",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "AC-12",
      "type": "acceptance_criterion",
      "description": "GIVEN .rnstorybook/stories/design-system/Typography.stories.tsx exists WHEN Story renders on simulator THEN Every size (11/12/13/14/15/17/18/22sp) and weight (regular/medium/semibold) renders with the system font stack; includes a monospace variant for future code-block typography",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "AC-13",
      "type": "acceptance_criterion",
      "description": "GIVEN .rnstorybook/stories/design-system/Spacing.stories.tsx exists WHEN Story renders on simulator THEN Padding/gap at 4/8/12/16/24/32/48pt and radius from --radius token (0.5rem) render consistently; Tailwind→uniwind spacing classes resolve as expected",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "AC-14",
      "type": "acceptance_criterion",
      "description": "GIVEN .rnstorybook/stories/design-system/Icons.stories.tsx exists WHEN Story renders on simulator THEN Every icon from DESIGN-PLATF-003's mapping renders at all 4 size tiers (16/20/24/48pt) with strokeWidth={1.5}; color switches via tokens (foreground / primary / destructive / muted-foreground), never hardcoded; status icons (Crosshair / AlertTriangle / Circle filled / Circle outlined) render at 16pt for SessionRow preview",
      "verify": "cd apps/mobile && EXPO_PUBLIC_STORYBOOK=true bun start (human visual verification)"
    },
    {
      "id": "TC-9",
      "type": "test_criterion",
      "description": ".rnstorybook/preview.tsx imports `react-native-get-random-values` and `../global.css` in that order",
      "maps_to_ac": "AC-8",
      "verify": "grep -n 'react-native-get-random-values' apps/mobile/.rnstorybook/preview.tsx && grep -n 'global.css' apps/mobile/.rnstorybook/preview.tsx"
    },
    {
      "id": "TC-10",
      "type": "test_criterion",
      "description": ".rnstorybook/preview.tsx wraps stories in GestureHandlerRootView + SafeAreaProvider + ThemeProvider + PortalHost in correct order",
      "maps_to_ac": "AC-8",
      "verify": "grep -c 'GestureHandlerRootView\\|SafeAreaProvider\\|ThemeProvider\\|PortalHost' apps/mobile/.rnstorybook/preview.tsx"
    },
    {
      "id": "TC-11",
      "type": "test_criterion",
      "description": ".rnstorybook/preview.tsx does NOT import QueryClientProvider or PostHogProvider",
      "maps_to_ac": "AC-8",
      "verify": "! grep -E '(QueryClientProvider|PostHogProvider)' apps/mobile/.rnstorybook/preview.tsx"
    },
    {
      "id": "TC-12",
      "type": "test_criterion",
      "description": "ColorSwatches.stories.tsx exists at .rnstorybook/stories/design-system/",
      "maps_to_ac": "AC-11",
      "verify": "test -f apps/mobile/.rnstorybook/stories/design-system/ColorSwatches.stories.tsx"
    },
    {
      "id": "TC-13",
      "type": "test_criterion",
      "description": "Typography.stories.tsx exists at .rnstorybook/stories/design-system/",
      "maps_to_ac": "AC-12",
      "verify": "test -f apps/mobile/.rnstorybook/stories/design-system/Typography.stories.tsx"
    },
    {
      "id": "TC-14",
      "type": "test_criterion",
      "description": "Spacing.stories.tsx exists at .rnstorybook/stories/design-system/",
      "maps_to_ac": "AC-13",
      "verify": "test -f apps/mobile/.rnstorybook/stories/design-system/Spacing.stories.tsx"
    },
    {
      "id": "TC-15",
      "type": "test_criterion",
      "description": "Icons.stories.tsx exists at .rnstorybook/stories/design-system/",
      "maps_to_ac": "AC-14",
      "verify": "test -f apps/mobile/.rnstorybook/stories/design-system/Icons.stories.tsx"
    },
    {
      "id": "TC-16",
      "type": "test_criterion",
      "description": "ColorSwatches uses uniwind className (bg-*), not hardcoded hex values",
      "maps_to_ac": "AC-11",
      "verify": "grep -E 'bg-background|bg-foreground|bg-primary|bg-secondary' apps/mobile/.rnstorybook/stories/design-system/ColorSwatches.stories.tsx && ! grep -E '#[0-9a-fA-F]{3,6}|hsl\\(' apps/mobile/.rnstorybook/stories/design-system/ColorSwatches.stories.tsx"
    }
  ]
}
-->
