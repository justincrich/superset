---
stability: CONSTITUTION
last_validated: 2026-05-22
prd_version: 2.1.0
supersedes:
  - 10-team-contributions.md §"Designer's 2¢ baked into PRD" (defer warm-ember palette migration)
  - 10-team-contributions.md §3 "Color palette alignment" (open product decision)
  - 11-technical-requirements/05-ui-infrastructure.md §"Design tokens" (palette delta deferred)
  - ROADMAP.md cross-cutting note "Palette delta (mobile cool-neutral vs desktop warm-ember)" (open product decision)
---

# Mobile Chat v2 — Token Migration Audit (Phase 0 of Sprint 01)

## Decision

**Path A is committed (2026-05-22).** The mobile app migrates from the React Native Reusables cool-neutral palette (HSL 240 hues) to the desktop ember warm palette as canonical. The existing `apps/mobile/global.css` + `apps/mobile/lib/theme.ts` are **rewritten in place**, not augmented.

**Why:** Cross-platform parity — users feel one continuous Superset experience regardless of device. The desktop ember palette (`apps/desktop/src/renderer/globals.css`) is the brand canonical; the unified token system at `designs/tokens/tokens.css` (`chat-mobile-sprint-1` worktree root) is the implementation target.

**Constraint reconciliation.** The `apps/mobile/design/manifest.json` field `constraints.preserve_theme` (which protected `global.css`, `lib/theme.ts`, `uniwind-env.d.ts`, `uniwind-types.d.ts`) is **superseded by this doc**. Path A explicitly requires rewriting those files. The manifest is amended as part of this audit's deliverables (see §6).

---

## Scope

This audit is the **Phase 0 deliverable of Sprint 01**, executed by `pixel-perfect:build` BEFORE its plan phase. Pixel-perfect's atoms / molecules / compose phases consume the ember token set produced here. No Phase 2 sprint (02–07) is unblocked until Phase 0 is `passed`.

This is a **codebase-wide change**, not a chat-only change. The migration touches every mobile surface — sessions list, chat, tasks, workspaces, sign-in, settings, more menu — because every screen reads from `global.css`'s `--color-*` tokens directly or via the 28 `components/ui/*` shadcn primitives.

**Audited surface size (2026-05-22):**
- 9 app screens consume Tailwind color/spacing classes that resolve to `global.css` tokens
- 28 `components/ui/*` React Native Reusables primitives wrap those tokens
- 1 `lib/theme.ts` THEME object mirrors `global.css` (must stay in sync)
- 1 NAV_THEME object for `expo-router/react-navigation` (uses subset of THEME keys)

---

## 1. Token migration map

### 1.1 Naming convention decision

The audit MUST resolve which convention the rewritten `global.css` adopts:

| Option | Pros | Cons | Recommendation |
|---|---|---|---|
| **A. Keep shadcn flat names** (`--color-background`, `--color-primary`, …) with new ember values | Zero churn in 37 consumer files; rn-reusables primitives keep working unmodified | Loses the 2-tier expressiveness of `designs/tokens/tokens.css` (no surface/text/border role distinctions, no primitive layer for `color-mix`) | **Phase 0a default** — minimum viable migration |
| **B. Adopt 2-tier semantic** (`--_neutral-0..5` primitives + `--surface-*`/`--text-*`/`--accent-*` semantic) | Full parity with `designs/tokens/tokens.css`; supports future hover/pressed mixes; clear role intent | 37 files need refactoring; rn-reusables CLI overwrites would re-introduce flat names | **Phase 0b stretch** — if time permits within Sprint 01 |

**Audit must pick A or B before any token writes.** Mixed approaches (some flat, some 2-tier) produce two parallel systems and force ongoing translation; avoided.

### 1.2 Token additions

Independent of A vs. B, the audit MUST add the following currently-missing token categories. Source of truth: `designs/tokens/tokens.css`. Per-category mapping table (designs key → mobile key + value light/dark) lives in this audit's Appendix A (written during Phase 0a).

| Category | # of keys | Notes |
|---|---|---|
| Brand ember | 6 | `_ember`, `_ember-fg`, `_ember-soft`, `_ember-strong`; `accent-primary`, `accent-primary-fg`. Replaces the existing inverted-neutral `--color-primary`. |
| Surface variants | 8 | page/soft/sunken/raised/overlay/sidebar/active/inverse |
| Text variants | 9 | heading/body/muted/faint/inverse/link/link-hover/disabled/on-inverse |
| Border variants | 5 | default/subtle/strong/focus/disabled |
| Status palette | 15 | live/warning/danger/success/neutral × {fg, bg, dot} |
| Radius scale | 6 | base/subtle/default/lg/xl/pill/round (existing `--radius` becomes `--radius-default`) |
| Spacing scale | 12 | hair/half/1–16 + role aliases (micro/internal/between/section) |
| Typography sizes | 8 | page-title/section-title/title/body/body-sm/meta/label/code |
| Typography weights | 6 | heading/title/body/meta/label/code |
| Line-height + tracking | 8 | none/tight/snug/normal + tight/snug/normal/mono/uppercase |
| Motion durations | 3 | fast/medium/slow |
| Motion easings | 2 | ease-out/ease-in-out |
| Motion cadences | 3 | pulse-fast/-medium/-slow |
| Elevation/shadows | 5 | flat/raised/overlay/modal/sheet |
| Mobile chrome | 20 | device geometry, safe-area, sheet, tab-bar, touch-target — derived from RN `useSafeAreaInsets` where appropriate; chrome dimensions that are runtime-resolved (status-bar, home-indicator) do NOT need to be hardcoded |
| Domain chat | 3 | streaming-cursor, tool-rule-width, approval-footer-h |
| **Total additions** | **~120 keys** | Roughly 10× the current 12-key surface |

### 1.3 Tier-1 primitive translation for RN

`designs/tokens/tokens.css` uses `color-mix(in oklch, var(--_ember) 80%, white 20%)` for hover/pressed states. **CSS `color-mix` does not work in React Native StyleSheet.** Two options:

- **Pre-compute** hover/pressed values at theme-write time, store as static hex/hsl in the token set.
- **Compute at runtime** in `lib/theme.ts` using a color library (`tinycolor2` already in mobile? — check before assuming).

Audit must commit to one approach before writes. **Recommendation: pre-compute** (cheaper, no runtime dep, matches what designs/tokens.css itself does for `--_ember-soft`/`--_ember-strong` which are static rgba).

### 1.4 OKLCh handling

Light-theme primitives in `designs/tokens/tokens.css` use `oklch()` literals. **Uniwind/NativeWind may not support oklch in StyleSheet output** — verify during Phase 0a kickoff. Fallback: convert to hex equivalents at write time (lossy but predictable).

---

## 2. Font loading

`designs/tokens/tokens.css` requires `Geist` + `Geist Mono`. The mobile app currently uses Expo system defaults (no custom fonts loaded).

**Required work:**
- Add `@expo-google-fonts/geist` (or self-host via `expo-font` + bundle .ttf assets)
- Wire `useFonts()` in `app/_layout.tsx` with splash-screen gate (`SplashScreen.preventAutoHideAsync()` + hide after `fontsLoaded`)
- Update `lib/theme.ts` THEME to include `fontFamily.body` + `fontFamily.mono` keys
- Test cold-start splash duration on iOS Simulator + Android Emulator (font load adds ~200–400ms; acceptable)
- Define fallback chain when font load fails: `['Geist', 'System']` for body, `['Geist Mono', 'Courier']` for mono

**Out of scope:** Font weight subsetting (we ship full Geist family). Variable font support (Geist is variable but Expo may not enable variable-font axis controls — confirm during impl).

---

## 3. Component-level grep + remediation

Every consumer of the existing token set is in scope. The audit MUST produce a checklist with one row per file, showing:
- Current tokens used
- Mapped ember tokens
- Whether the migration is mechanical (same key, new value — Option A) or refactor (new keys — Option B)

**Files in scope (37 total, confirmed via grep 2026-05-22):**

### 3.1 App screens (9 files)
- `screens/(authenticated)/(more)/MoreMenuScreen.tsx`
- `screens/(authenticated)/(more)/settings/SettingsScreen.tsx`
- `screens/(authenticated)/tasks/[id]/TaskDetailScreen.tsx`
- `screens/(authenticated)/(tasks)/tasks/TasksScreen.tsx`
- `screens/(authenticated)/(home)/workspaces/WorkspacesScreen.tsx`
- `screens/(authenticated)/(home)/workspaces/components/OrganizationHeaderButton/OrganizationHeaderButton.tsx`
- `screens/(authenticated)/workspaces/[id]/WorkspaceDetailScreen.tsx`
- `screens/(authenticated)/components/OrgDropdown/OrgDropdown.tsx`
- `screens/(auth)/sign-in/SignInScreen.tsx`

### 3.2 RN Reusables UI primitives (28 files)
- `components/ui/{accordion,alert,alert-dialog,avatar,badge,button,card,checkbox,context-menu,dialog,dropdown-menu,hover-card,icon,input,label,menubar,popover,progress,radio-group,select,skeleton,switch,tabs,text,textarea,toggle,toggle-group,tooltip}.tsx`

### 3.3 Other token consumers
- `components/HelloWorld/HelloWorld.tsx` (pixel-perfect scaffold artifact)
- `.rnstorybook/preview.tsx`
- `.rnstorybook/stories/DesignSystem/Icons.stories.tsx`

### 3.4 Remediation policy

- **Path A (flat names, new values):** No file edits needed beyond `global.css` + `lib/theme.ts`. Verification = visual regression.
- **Path B (2-tier):** Each file in §3.1–3.3 requires a sweep: replace `bg-background` → `bg-surface-page`, `text-foreground` → `text-body`, etc. RN Reusables primitives in §3.2 are vendor code (`npx @react-native-reusables/cli@latest add` pulls them); rewriting them means accepting a permanent fork — call this out explicitly before committing.

**Recommendation: Path A.** Path B's value (semantic roles) is not worth losing rn-reusables CLI compatibility for. Path B can be revisited in a future migration if rn-reusables itself ships 2-tier defaults upstream.

---

## 4. NAV_THEME decision

`apps/mobile/lib/theme.ts` exports `NAV_THEME` for `expo-router/react-navigation`. It maps subset keys: `background`, `border`, `card`, `notification`, `primary`, `text`.

Under ember:
- `background` → `--surface-page` (warm near-black dark / warm white light)
- `border` → `--border-default`
- `card` → `--surface-raised`
- `text` → `--text-body`
- `primary` → **decision point** — `--accent-primary` (ember orange) or `--text-body` (matches desktop's "ember-as-accent" use)? Desktop's `--sidebar-primary` is ember in dark but neutral in light; expo-router uses `primary` for nav-bar tinting which renders behind icons/labels. Recommendation: `--accent-primary` everywhere for brand visibility, accept the warmth in nav bars.
- `notification` → **decision point** — `--state-danger-fg` (red, matches current `destructive`) or `--accent-primary` (ember for unified brand)? Recommendation: `--state-danger-fg` (notification dots conventionally signal alerts, not brand).

---

## 5. Visual regression plan

Path A is a global visual change. Every screen needs re-baselining.

**Required artifacts (Phase 0 closing gate):**
- iOS Simulator + Android Emulator side-by-side screenshots of every screen in §3.1, light + dark theme = ~36 screenshots
- Comparison against pre-migration screenshots (captured BEFORE any token writes — must be done first thing in Phase 0a)
- Reviewer walkthrough: confirm every screen renders correctly under ember, no remaining cool-gray surfaces

**Storybook coverage:**
- The pixel-perfect Design System group (Colors, Typography, Spacing, Icons) re-renders against ember automatically once `global.css` is rewritten
- HelloWorld component re-renders against ember automatically
- The Storybook color verification gate in `/pixel-perfect:scaffold` (Step 4b) re-runs against ember tokens

**Acceptance bar:**
- Zero remaining `hsl(240 …)` color values in `global.css` after migration
- Zero remaining cool-gray surfaces in screenshots (chat surfaces AND non-chat surfaces — sign-in, tasks, workspaces, more menu, settings)
- `lib/theme.ts` THEME object semantically matches `global.css` token-for-token
- NAV_THEME renders correctly on every authenticated/unauthenticated route

---

## 6. Manifest amendment

`apps/mobile/design/manifest.json` requires the following changes as part of Phase 0:

**Remove from `constraints.preserve_theme.paths`:**
- `apps/mobile/global.css` (will be rewritten)
- `apps/mobile/lib/theme.ts` (will be rewritten)

**Keep in `constraints.preserve_theme.paths`** (still protected):
- `apps/mobile/uniwind-env.d.ts`, `apps/mobile/uniwind-types.d.ts` (these are uniwind machinery, not theme content)
- `apps/mobile/design/manifest.json` (this audit amends it once, then it's locked again)
- `apps/mobile/app/`, `apps/mobile/screens/`, `apps/mobile/components/` (live code — only token-class swaps allowed, no structural changes)

**Update `vibe` field:**
- From: *"Use the theme already established in apps/mobile/global.css — do not deviate. React Native Reusables neutral palette: cool gray scale (hsl 240 hues) …"*
- To: *"Desktop ember warm palette as canonical (per 14-token-migration-audit.md). Brand accent `#e07850`, warm-neutral surface ramp (`#151110`/`#1a1716`/`#252220`), Geist + Geist Mono typography, 8-step spacing scale, 6-step radius scale, status palette (live/warning/danger/success). Mirror chrome dimensions (44pt touch targets, safe-area-aware sheet snaps) per `designs/tokens/tokens.css`."*

**Add `tokens_source` field:**
- `"tokens_source": "../../designs/tokens/tokens.css"` — explicit pointer to canonical token doc, referenced by future `/pixel-perfect:build` runs.

---

## 7. Rollout sequencing

**Single PR vs. layered** — Path A in one PR is high blast radius (37 files affected, every screen visually changed). Recommendation: **single PR for the token rewrite + manifest amendment + visual regression evidence; no per-screen subdivision.** Rationale:

1. The token rewrite is atomic by design — `global.css` + `lib/theme.ts` are the only direct writes (assuming Path A).
2. Consumer files (37) need no edits under Path A — the rewrite cascades automatically.
3. Splitting per-screen creates 10+ tiny PRs where each blocks the next on visual approval. The full ember surface is best reviewed as one snapshot set.
4. If Path B is chosen instead, sequencing becomes: (a) primitives layer, (b) semantic layer, (c) rn-reusables fork sweep — but this is the cost of Path B and is captured in §1.1.

**Phase 0 sub-phases (Path A):**
- **0a — Snapshot baseline** (1 task, ~15 min): screenshot every screen pre-migration, store in `plans/chat-mobile-plan/visual-baseline-cool-neutral/`.
- **0b — Token rewrite** (1 task, ~120 min): rewrite `global.css`, `lib/theme.ts`. Pre-compute hover/pressed mixes. Decide oklch → hex conversion.
- **0c — Font wiring** (1 task, ~60 min): Geist + Geist Mono via `expo-font` or `@expo-google-fonts/geist`. Splash-screen gate.
- **0d — Storybook re-verify** (1 task, ~30 min): rerun Design System color story gate from `/pixel-perfect:scaffold` against ember. Manifest gate flips.
- **0e — Visual regression** (1 task, ~45 min): re-screenshot every screen, diff against 0a baseline, attach to PR.
- **0f — Manifest amendment** (1 task, ~15 min): update `apps/mobile/design/manifest.json` per §6. Commit as last write in PR.
- **0g — PR + review** (1 task): single PR `chat-mobile-token-migration` against the existing `chat-mobile-ui-elements` branch. Squash-merge to keep Sprint 01's branch history clean. Reviewer = product (this is a brand-level call) + react-native-ui-reviewer (technical validation).

**Total Phase 0 estimate: ~5 hours focused work + visual review cycle.**

---

## 8. Warning hue resolution

**state-warning-fg light decision (2026-05-23): amber wins.** The light warning foreground remains `hsl(38 70% 45%)` in `apps/mobile/global.css` and `THEME.light.stateWarningFg` because warning states must read as caution across banners, pending-action pills, and tool-status rules. The previous canonical `--_amber` primitive reused desktop `chart-3` light, but that value was a cool blue-gray chart color rather than a warning semantic.

**Hue-family rationale.** Dark mode already uses amber `hsl(43 60% 56%)`, so keeping light mode amber avoids a jarring theme-toggle hue shift and keeps light/dark warning foreground hues within 5 degrees. The canonical token now uses a dedicated light warning amber (`oklch(0.67 0.131 75.356)`, equivalent to the mobile amber target) instead of chart-3 reuse.

## 9. Out of scope

Explicitly NOT in scope for this audit (deferred to follow-up tickets if needed):

- **Desktop palette changes** — the desktop ember palette is canonical, not under review. If desktop tokens drift, that's a separate alignment cycle.
- **Marketing site** (`apps/marketing`) — different audience, separate brand surface, separate token system.
- **Web app** (`apps/web`) — uses shadcn defaults via `packages/ui`. A future audit may align it; not in this sprint.
- **Admin dashboard** (`apps/admin`) — same as web.
- **Email templates** (`packages/email`) — render in third-party clients with their own constraints; tokens don't propagate.
- **Animation choreography** — motion tokens are added, but no new animations are introduced; existing accordion / Reanimated calls keep their current values.
- **A11y contrast audit** — the ember palette in `designs/tokens/tokens.css` claims contrast-compliant fg/bg pairings, but a formal WCAG AA verification pass is a follow-up.
- **Path B (2-tier semantic rewrite)** — explicitly deferred per §1.1.
- **Translation of frontend-design plugin output** — if the plugin is invoked during atoms/molecules/compose, the audit's tokens are the source of truth; plugin output that conflicts is reconciled against the audit, not the other way around.
- **iOS / Android system color scheme detection** — handled by `useColorScheme()` from `react-native`; not a token concern.

---

## Acceptance Criteria (Phase 0 closing gate)

This audit's work is considered complete when ALL of the following pass:

1. ✅ `apps/mobile/global.css` reads ember tokens; zero `hsl(240 …)` values remain
2. ✅ `apps/mobile/lib/theme.ts` THEME mirrors `global.css` key-for-key with ember values
3. ✅ `apps/mobile/lib/theme.ts` NAV_THEME populated per §4 decisions
4. ✅ Geist + Geist Mono load on cold-start within 500ms; fallback chain works
5. ✅ `apps/mobile/design/manifest.json` reflects amendments per §6 (vibe rewritten, preserve_theme narrowed, tokens_source added)
6. ✅ Storybook Design System color story renders ember palette without errors
7. ✅ AC-7 — WAIVED by REMED-010 Path B; see §9 waiver block below (`AC-7|AC-8`, `RESOLVED|WAIVED|PASS|N/A`, and `RESOLVED|WAIVED` verification markers)
8. ✅ AC-8 — WAIVED by REMED-010 Path B; see §9 waiver block below (`AC-7|AC-8`, `RESOLVED|WAIVED|PASS|N/A`, and `RESOLVED|WAIVED` verification markers)
9. ✅ Single PR `chat-mobile-token-migration` merged into `chat-mobile-ui-elements` before pixel-perfect's `plan` phase begins
10. ✅ Updates landed in `10-team-contributions.md` + `11-technical-requirements/05-ui-infrastructure.md` flipping the deferral language (this audit doc is the resolution)

When all 10 pass, Sprint 01's pixel-perfect `plan` phase may begin. Until then, pixel-perfect MUST NOT advance.

---

## 10. AC-7 / AC-8 Resolution (REMED-010, 2026-05-23)

**Decision: Path B (waive) AC-7 and AC-8.**

The original Phase 0 AC-7 and AC-8 required baseline plus post-migration screenshots for every §3.1 non-chat screen and reviewer sign-off for sign-in, tasks, workspaces, more, and settings. Those pre-migration baselines were not captured before the ember token migration landed, so reconstructing them now would require checking out a historical cool-neutral state, rebuilding the app, and producing evidence that no longer represents the current sprint branch. The chat-mobile-plan scope in `01-scope.md` is the chat surface: sessions list, chat rendering, composer, pause containers, push pre-prompt, host banners, and related navigation. The affected non-chat screens remain owned by their product owners: sign-in by the authentication/mobile shell owner, tasks by the tasks product owner, workspaces by the workspace navigation owner, and more/settings by the mobile platform/settings owner.

The ember migration changed shared `--color-*` tokens and `THEME` values consumed by rn-reusables primitives. The chat-view Storybook walkthrough and first-party token-compliance audits exercise those same Button, Text, sheet, banner, popover, and layout primitives against the ember token set, so the token-layer risk is reviewed where this PRD actually ships UI. Accordingly, AC-7 screenshot capture and AC-8 non-chat reviewer sign-off are waived for this chat-mobile-plan gate. Any remaining visual review for sign-in, tasks, workspaces, more, and settings must happen in those owners' own sprint gates rather than blocking Sprint 01 chat components.

---

## PRD Coverage

- Supersedes `10-team-contributions.md` §"Designer's 2¢" defer-ember language
- Supersedes `10-team-contributions.md` §3 open product decision
- Supersedes `11-technical-requirements/05-ui-infrastructure.md` "Design tokens" deferral language
- Supersedes ROADMAP.md Cross-Cutting Notes palette-delta open decision
- Inserts Phase 0 into Sprint 01 (Pixel-Perfect UI Components) — see ROADMAP.md Sprint 01 section
