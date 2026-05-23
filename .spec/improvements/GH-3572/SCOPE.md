---
source: ticket
improvement_id: GH-3572
ticket_id: GH-3572
ticket_url: https://github.com/superset-sh/superset/issues/3572
tracker: github
status: binding
chosen_option: option-α-upstream-bump-plus-fallback
loc_budget: 15
task_chunks: 1
investigator_specialist: electron-reviewer
challenger_specialist: code-reviewer
research_doc: .spec/improvements/GH-3572/RESEARCH.md
holocron_doc_id: js7eww2myv09kh74wqtjdgjqxs878p22
upstream_pr: https://github.com/xtermjs/xterm.js/pull/5883
---

# GH-3572 — Binding scope (option α: upstream bump + VSCode-style fallback)

## Decision summary (2026-05-23)

After deep research (`RESEARCH.md`), the upstream xterm.js team merged **PR #5883 "Fix webgl rendering corruption from atlas page merges"** on May 21, 2026 — directly addressing our exact symptom. Maintainer Tyriar's comment on that PR:

> *"This has been an issue for a long time, I think it's popped up more recently due to agentic CLIs using a much wider range of character styles."*

The fix shipped in `@xterm/xterm@6.1.0-beta.220` (we are on `beta.219`). The original three options (Mac→DOM Minimum, Minimum + onContextLoss Moderate, Drop-WebGL Strategic) were all SUPERSEDED because they regress Mac WebGL perf permanently for our majority-Mac user base. The new option **α**:

1. **Bump all `@xterm/*` deps** from beta.219 → beta.220 (and addon-webgl from beta.218 → beta.219, peer-dep aligned). Picks up upstream root-cause fix.
2. **Add `suggestedRendererType = "dom"` inside both `onContextLoss` handlers** in `terminal-addons.ts` and `helpers.ts` (VSCode pattern from `microsoft/vscode#120393`). Defense-in-depth for the rarer GPU-process-death class of failure that bypasses the atlas-merge fix.

## Binding acceptance criteria

- **AC-1**: All `@xterm/*` packages in `apps/desktop/package.json` are at `beta.220` (`addon-webgl` at `beta.219` — latest published; peer-deps on `^6.1.0-beta.220`).
- **AC-2**: `bun.lock` resolves all `@xterm/*` packages to the bumped versions with `@xterm/addon-webgl@0.20.0-beta.219` declaring `"@xterm/xterm": "^6.1.0-beta.220"` peer-dep.
- **AC-3**: `terminal-addons.ts:51-56` `onContextLoss` handler sets `suggestedRendererType = "dom"` after dispose.
- **AC-4**: `helpers.ts:138-143` `onContextLoss` handler sets `suggestedRendererType = "dom"` after dispose.
- **AC-5**: `bun run typecheck` exits 0 in `apps/desktop`.
- **AC-6**: `bun run lint` exits 0 at repo root (Biome treats warnings as errors per repo policy).
- **AC-7 (manual smoke test)**: User can run the desktop app, open ≥7 Claude Code terminal panes, exercise sustained streaming workloads (large `cat`, `tail -f`), and NOT observe glyph corruption on macOS over 15+ minutes. WebGL renderer remains active on Mac (verify via DevTools — `xterm` element should have webgl canvas, not DOM rows).

## Files in scope

- `apps/desktop/package.json` (version bumps only)
- `bun.lock` (auto-regenerated)
- `apps/desktop/src/renderer/lib/terminal/terminal-addons.ts` (one-line addition inside `onContextLoss` handler)
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/helpers.ts` (one-line addition inside `onContextLoss` handler)

**Total code delta**: 2 lines added (one per handler) + ~22 lines of package.json bumps + lockfile churn.

## Out of scope (deferred)

- ❌ Vendor-patch postinstall approach (Ouroboros recipe) — not needed; we are already on the beta train and dep bump is cleaner.
- ❌ Periodic `Terminal.clearTextureAtlas()` heal on tab-visibility-change — defer; PR #5883 fix should remove the need for this.
- ❌ Recovery-back-to-WebGL after fallback (Hermes Agent pattern) — defer; VSCode ships one-way-only fallback and it's been fine for them since 2021.
- ❌ Multi-stage frame-budget watchdog (50ms detection from VSCode #118064) — defer; not load-bearing for this fix.
- ❌ Removal of `addon-webgl` dependency (original Strategic option) — does not apply once upstream fix is adopted.
- ❌ Touching `setup.ts:90` Chromium WebGL context cap (256) — keep as existing mitigation.

## Risks

- **Beta-train risk** (LOW). We are already on `beta.219`; bumping to `beta.220` is the next sequential beta. PR #5883 is the dominant change in this delta. Secondary change: PR #5875 (kitty keyboard protocol shift+number — unrelated, low risk).
- **Bun minimum-release-age policy** (RESOLVED on this branch). Beta.220 is < 3 days old; install requires `--minimum-release-age=0` on this branch only. By the time PR review/merge cycle completes, beta.220 will be ≥ 3 days old and CI installs will succeed unmodified. `bunfig.toml` policy unchanged.
- **Catastrophic GPU-process-death class** (LOW residual risk). User's forced `loseContext()` experiment captured a class of failure that bypasses `onContextLoss` (Chromium GPU process dies before event fires). PR #5883 doesn't address this. The defense-in-depth `onContextLoss` → DOM change covers the gentler context-loss class; the GPU-process-death class is rare in real usage and Chromium auto-restarts the GPU process.
- **Parallel-worktree conflict**: stale `imp-xterm-webgl-macos-fallback-1779419095` worktree contains prior uncommitted code touching the same files. User to discard or reconcile post-merge.
- **CI / contributor install on day-of-merge**: If merged within 24h of beta.220 publish (May 21 + 3d = May 24), other devs may need the same `--minimum-release-age=0` override. Practical workaround if needed: defer merge until May 24+.

## Considered alternatives (rejected with reasons)

### Original Minimum (Mac → always-DOM)
- **Rejected** by owner 2026-05-23: permanent Mac WebGL perf regression unacceptable for majority-Mac user base.

### Original Moderate (Mac → always-DOM + onContextLoss → DOM globally)
- **Rejected** for same reason as Minimum (includes the Mac→DOM-always part).

### Original Strategic (drop WebGL on all platforms)
- **Rejected** for same Mac perf reason; punishes non-Mac users too.

### Option β (vendor PR #5883 diff via Ouroboros-style postinstall patcher)
- **Rejected** in favor of α. Same fix outcome but ~150 LOC of patching tooling vs. a dep bump. Only justified if beta.220 had a known regression — it doesn't.

### Option γ (bump + multi-detector + visibility-change recovery + clearTextureAtlas)
- **Deferred** as follow-up if α + PR #5883 don't fully resolve user reports after rollout. Currently overkill given the upstream root-cause fix.

## Challenger notes (from prior proposal phase)

Original challenger (code-reviewer) confirmed in commit `b43e70123`:
- All ground-truth claims verified.
- Could not find a smaller option than the original Minimum at the time (research had not yet surfaced the upstream PR).
- Flagged that `onContextLoss` was provably dead code on Mac under original Minimum.

**Re-evaluation under option α**: the `onContextLoss` change is no longer dead code on Mac because WebGL stays loaded on Mac. It's now active belt-and-suspenders for all platforms.

## Security review

Not applicable — no auth/secrets/tokens touched. Confirmed by file-overlap analysis.

## Scope amendments

_(none — populated post-merge if scope shifts)_

## Deferred follow-ups

See `.spec/improvements/GH-3572/follow-ups.md` for the original investigator-listed follow-ups. Additional items from research:

- Track xterm.js 7.0.0 GA — when it ships on the `latest` npm dist-tag, plan migration off the beta train.
- Monitor xtermjs/xterm.js#5816 (Safari macOS beta 26.5) for any non-#5883 corruption fixes we should also pick up.
- Watch Chromium bug 502262228 (Intel RPL-U dual-monitor + fractional-scale GL_INVALID_OPERATION) — driver-level issue, may need DOM-fallback if any affected users emerge.
- If PR #5883 + onContextLoss fallback don't fully resolve user reports after rollout, escalate to option γ (clearTextureAtlas on visibility-change + recovery-back-to-WebGL).


# GH-3572: xterm.js WebGL texture-atlas corruption causes garbled terminal glyphs on macOS

## Defect

Embedded terminals intermittently display wrong/garbled glyphs when many panes are open simultaneously, primarily on macOS. Symptom heals on window resize (forces re-render re-initializing the WebGL atlas). Underlying data is not corrupted — only the GPU-rendered output is wrong. The WebGL renderer is the root cause; DOM renderer does not exhibit this.

## Reproduction / Evidence

Evidence: `.spec/improvements/GH-3572/BRIEF.md` + verified code citations below.

- Forced `WEBGL_lose_context.loseContext()` on the affected xterm canvas crashed the entire Chromium GPU process ("Aw, Snap!"). This confirms the WebGL stack is genuinely wedged, not stale state. Critically: **a clean `onContextLoss` event did not fire before the GPU process died**. This directly undermines the `onContextLoss` handler as the primary fix for macOS — the process died before the event could fire.
- Visual: glyphs mangle into wrong characters; heal on resize.
- Repro pattern: ~7-8 Claude Code tabs simultaneously. CJK content is a red herring (confirmed without CJK by valentin-ib). macOS-dominant report cluster.
- PR #3924 (merged 2026-05-01) removed WebGL from v1 terminal path only; assumed v2's shorter lifecycle would not surface the issue. That assumption was wrong — both remaining paths still exhibit the corruption.

Verified file:line citations (read and confirmed by investigator):

- `apps/desktop/src/renderer/lib/terminal/terminal-addons.ts:17` — isolated `let suggestedRendererType: "webgl" | "dom" | undefined` (v2 runtime path via `terminal-runtime.ts:219`)
- `apps/desktop/src/renderer/lib/terminal/terminal-addons.ts:51-54` — `onContextLoss` handler: disposes addon + calls `terminal.refresh()`. Does NOT set `suggestedRendererType = "dom"`. (Gap confirmed.)
- `apps/desktop/src/renderer/lib/terminal/terminal-addons.ts:57-59` — catch-block on construction failure DOES set `suggestedRendererType = "dom"`, but this only covers upfront initialization failure, not post-initialization context loss.
- `apps/desktop/src/renderer/lib/terminal/terminal-addons.ts:46-47` — guard: `if (disposed || suggestedRendererType === "dom") return;`. No macOS check. (Gap confirmed.)
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/helpers.ts:61` — second isolated `let suggestedRendererType: "webgl" | "dom" | undefined` (v1-terminal-cache path). NOT shared with `terminal-addons.ts:17`.
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/helpers.ts:138-141` — identical `onContextLoss` gap: disposes + refresh, no `suggestedRendererType = "dom"`.
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/helpers.ts:144-146` — catch-block covers construction failure only.
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/helpers.ts:133-134` — guard: `if (disposed || suggestedRendererType === "dom") return;`. No macOS check.
- `apps/desktop/src/lib/electron-app/factories/app/setup.ts:90` — existing mitigation: `app.commandLine.appendSwitch("max-active-webgl-contexts", "256")`. Raises Chromium cap from 16 to 256. Does not prevent texture-atlas corruption.

Additional findings not in BRIEF:

1. The two `suggestedRendererType` variables are **module-isolated** — not shared. A failure detected in one path does not protect the other. Even the existing catch-block fallback is siloed.
2. `helpers.ts` serves the **v1-terminal-cache path** (per `helpers.ts:80`: "Used by v1-terminal-cache.ts"), not a second v2 path as the BRIEF implied. Both still need the fix regardless.
3. `suggestedRendererType` is entirely an application-level variable — not an xterm.js API. xterm.js `@xterm/xterm 6.1.0-beta.219` Terminal constructor has no such option.
4. Platform detection pattern `navigator.platform.toLowerCase().includes("mac")` is already used in this codebase (`apps/desktop/src/renderer/lib/clickPolicy/modifierLabel.ts:3-5`).

BRIEF accuracy: file paths CORRECT; `onContextLoss` gap CORRECT; path labeling for `helpers.ts` PARTIALLY INCORRECT (it is v1-cache, not v2); module isolation of `suggestedRendererType` NOT MENTIONED by user.

## Root cause

xterm.js WebGL texture-atlas corruption is a known upstream issue (xtermjs/xterm.js#5816). On macOS specifically, the Chromium GPU compositor can wedge the WebGL context in a corrupted state without first firing a clean `onContextLoss` event — the GPU process can die before the event propagates. The two remaining WebGL-using paths in the codebase both lack:

1. A macOS skip guard at startup: WebGL is attempted on every new terminal, so the corruption mode is possible on every pane open.
2. A `suggestedRendererType = "dom"` update in their `onContextLoss` handlers: even on platforms where context loss IS detected cleanly, subsequent terminals re-attempt WebGL.
3. A shared `suggestedRendererType` variable: the two module-level copies are isolated, so fixing one path's catch-block does not protect the other path.

## Specialist consultation summary

No cross-domain consultation needed. All files in scope are within `apps/desktop/src/renderer/` (Electron renderer process, TypeScript). No `packages/ui`, `packages/trpc`, `packages/db`, or `apps/web` involvement. Primary domain only.

## Option: minimum

**one_line:** Add a macOS guard that pre-sets `suggestedRendererType = "dom"` in both `terminal-addons.ts` and `helpers.ts`, bypassing WebGL on darwin via the existing guard mechanism.

**files_in_scope:**
- `apps/desktop/src/renderer/lib/terminal/terminal-addons.ts`
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/helpers.ts`

**loc_budget:** ~3 lines added per file (guard block), 2 files. 0 new files.

Implementation sketch — after the `let suggestedRendererType` declaration in each file:
```ts
// Skip WebGL on macOS: Chromium GPU compositor can corrupt the texture atlas
// without firing onContextLoss first (GPU process dies; we observed this with
// WEBGL_lose_context.loseContext() → "Aw, Snap!"). DOM renderer is the safe default.
if (typeof navigator !== "undefined" && navigator.platform.toLowerCase().includes("mac")) {
  suggestedRendererType = "dom";
}
```
This reuses the existing guard (`if (disposed || suggestedRendererType === "dom") return;`) at `terminal-addons.ts:47` and `helpers.ts:134` without touching any other logic. The existing catch-block path (`suggestedRendererType = "dom"` on construction failure) is unchanged.

**acceptance_criteria:**
- [ ] AC-1 (code): After the change, `new WebglAddon()` is never reached on macOS. Confirm by reading `terminal-addons.ts` and `helpers.ts`: the macOS guard fires before the `requestAnimationFrame` block reaches the `WebglAddon` construction.
- [ ] AC-2 (manual): Open 8+ Claude Code terminal panes on macOS (darwin). After 10+ minutes of use with active terminal output, no glyph corruption observed.
- [ ] AC-3 (code): `terminal-addons.ts` and `helpers.ts` each contain an explicit macOS guard that pre-sets `suggestedRendererType = "dom"` at module init before any `requestAnimationFrame` call.
- [ ] AC-4 (code): `bun run typecheck` exits 0. `bun run lint` exits 0.

**out_of_scope:**
- `onContextLoss` handler changes (defense-in-depth for non-macOS — deferred to moderate)
- Unifying the two isolated `suggestedRendererType` variables into a shared module (deferred to moderate)
- Removing `@xterm/addon-webgl` from package.json (deferred to strategic)
- Changes to `setup.ts:90` (`max-active-webgl-contexts` override — leave as-is)

**risks:**
- macOS detection via `navigator.platform` is deprecated in browser specs but remains available in Electron/Chromium and is already used in this codebase. Not a real risk.
- Windows and Linux users continue to use WebGL. If corruption surfaces on those platforms in future, the `onContextLoss` handler gap (moderate option) becomes load-bearing.
- Parallel worktree `imp-xterm-webgl-macos-fallback-1779419095` contains prior uncommitted WIP touching the same two files in scope, plus a new `webgl-policy.ts`. User will need to reconcile or discard that worktree post-binding. Do not force-remove it.

**task_chunks:** 1

---

## Option: moderate

**one_line:** Minimum macOS guard plus `suggestedRendererType = "dom"` in both `onContextLoss` handlers — exactly the VS Code pattern, cross-platform defense-in-depth.

**files_in_scope:**
- `apps/desktop/src/renderer/lib/terminal/terminal-addons.ts`
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/helpers.ts`

**loc_budget:** ~6 lines added per file (macOS guard + `onContextLoss` one-liner), 2 files. 0 new files.

Implementation sketch — add `suggestedRendererType = "dom"` as the first statement in both `onContextLoss` handlers:
```ts
webglAddon.onContextLoss(() => {
  suggestedRendererType = "dom"; // prevent re-attempt on next terminal
  webglAddon?.dispose();
  webglAddon = null;
  terminal.refresh(0, terminal.rows - 1);
});
```

**acceptance_criteria:**
- [ ] AC-1 through AC-4 from minimum option (all apply)
- [ ] AC-5 (code): Both `onContextLoss` handlers set `suggestedRendererType = "dom"` as their first statement.
- [ ] AC-6 (code): `bun run typecheck` exits 0. `bun run lint` exits 0.

**out_of_scope:**
- Extracting the two isolated `suggestedRendererType` variables into a shared module. The isolation is real but acceptable at this scope: the macOS guard makes `onContextLoss` unreachable on the primary failure platform; on Windows/Linux, context loss is rare and the separate guards are independent but both correct.
- Removing `@xterm/addon-webgl` from package.json.

**risks:**
- All risks from minimum option apply.
- The `onContextLoss` `suggestedRendererType = "dom"` fix has no effect on macOS (where the macOS guard skips WebGL entirely, so `onContextLoss` never fires). It is effective only on Windows/Linux. This is intentional.
- The two `suggestedRendererType` variables remain module-isolated: a context loss in one path does not protect the other. In practice both paths are macOS-skipped, so this only matters on Windows/Linux where cross-path isolation is a low-severity gap. Acceptable for moderate scope.

**task_chunks:** 1

---

## Option: strategic

**one_line:** Remove WebGL entirely from both remaining paths — no platform detection, no context-loss handling, DOM renderer everywhere (completing #3924 for all paths).

**files_in_scope:**
- `apps/desktop/src/renderer/lib/terminal/terminal-addons.ts`
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/Terminal/helpers.ts`
- `apps/desktop/package.json` (remove `@xterm/addon-webgl` if no other consumer after changes)

**loc_budget:** ~25 lines removed per file (WebglAddon import + `let webglAddon` declaration + entire rAF try/catch block + webglAddon in dispose handler). Net: ~50 lines removed. Potentially 1 package removed from dependencies.

**acceptance_criteria:**
- [ ] AC-1 (code): `@xterm/addon-webgl` is not imported anywhere under `apps/desktop/src/renderer/`.
- [ ] AC-2 (code): `new WebglAddon()` does not appear anywhere under `apps/desktop/src/renderer/`.
- [ ] AC-3 (manual): Open 8+ Claude Code terminal panes on macOS, Windows, and Linux. No glyph corruption observed on any platform after sustained use.
- [ ] AC-4 (code): `bun run typecheck` exits 0. `bun run lint` exits 0.
- [ ] AC-5 (code): If `@xterm/addon-webgl` has no remaining consumers in the monorepo, it is removed from `apps/desktop/package.json` and the lockfile updated.

**out_of_scope:**
- Removing `setup.ts:90` `max-active-webgl-contexts` override (separate cleanup; leave for a follow-up once strategic option is confirmed stable).
- Any future opt-in re-enablement of WebGL via feature flag or settings toggle.

**risks:**
- DOM renderer is measurably slower than WebGL under sustained high-throughput streaming (e.g. `cat /dev/urandom | hexdump`). For agentic coding terminal workloads the delta is in practice invisible. PR #3924 applied this tradeoff for v1 without user complaints.
- Windows and Linux users lose WebGL permanently, not just as a macOS workaround. On those platforms WebGL is generally stable and the corruption is macOS-specific — this option is broader than needed for the observed failure mode.
- No escape hatch: re-enabling WebGL requires code changes. If a future use case benefits from WebGL (e.g. GPU-accelerated rendering for a specific workflow), it requires reopening this decision.
- Parallel worktree `imp-xterm-webgl-macos-fallback-1779419095` touches the same two files in scope. User will need to reconcile or discard that worktree post-binding.

**task_chunks:** 1

---

## Challenge

### Re-verification

All ground-truth claims confirmed against source files read directly. One minor discrepancy noted; not material.

- `terminal-addons.ts:17` — `let suggestedRendererType: "webgl" | "dom" | undefined`: CONFIRMED
- `terminal-addons.ts:46-47` — rAF guard `if (disposed || suggestedRendererType === "dom") return;`: CONFIRMED
- `terminal-addons.ts:51-54` — `onContextLoss` handler body: CONFIRMED (actual span is lines 51-55, 5 lines; SCOPE says 51-54 — minor off-by-one, not material to the gap claim)
- `terminal-addons.ts:57-59` — catch-block sets `suggestedRendererType = "dom"`: CONFIRMED (actual lines 57-60)
- `helpers.ts:61` — second isolated `let suggestedRendererType`: CONFIRMED
- `helpers.ts:133-134` — rAF guard: CONFIRMED
- `helpers.ts:138-141` — `onContextLoss` gap: CONFIRMED
- `helpers.ts:144-146` — catch-block: CONFIRMED
- `setup.ts:90` — `max-active-webgl-contexts: 256` switch: CONFIRMED
- `modifierLabel.ts:3-5` — `navigator.platform.toLowerCase().includes("mac")` pattern: CONFIRMED
- `@xterm/xterm 6.1.0-beta.219` version: CONFIRMED (`apps/desktop/package.json:163`)
- `@xterm/addon-webgl` sole consumer in monorepo: CONFIRMED — only `apps/desktop/package.json:161` declares it across all 34 package.json files

### Smaller-option search

**(a) Single-file/shared module**

No shared module path exists. `terminal-addons.ts` and `helpers.ts` are entirely independent renderer modules with no shared import graph for `suggestedRendererType`. Introducing a `webgl-policy.ts` shared module still requires importing it in both files — same 2-file change surface. The stale worktree `imp-xterm-webgl-macos-fallback-1779419095` already attempted this approach. Not smaller.

**(b) `setup.ts`-level Electron flag**

`setup.ts:63` demonstrates `PLATFORM.IS_LINUX && app.disableHardwareAcceleration()`. Adding `PLATFORM.IS_MAC && app.disableHardwareAcceleration()` is nominally a 1-line change in 1 file. However `app.disableHardwareAcceleration()` disables GPU acceleration for the ENTIRE Electron renderer process — canvas elements, CSS compositing, video, all WebGL — not just xterm. `PLATFORM.IS_MAC` uses `process.platform` (main-process Node.js), not the renderer's `navigator.platform`. This is a worse tradeoff than a targeted renderer-layer switch and would regress unrelated rendering surfaces. Rejected: worse, not smaller.

**(c) Unconditional WebGL removal (strategic = smaller semantically?)**

Strategic removes ~50 net LOC vs minimum's +6 LOC added. In raw diff size, strategic is "smaller." However scope is not measured in LOC alone: strategic removes WebGL from Windows and Linux users who do not exhibit the corruption. The blast radius is ALL platforms vs minimum's macOS-only. The investigator's framing is correct: strategic is platform-broader. LOC-negative does not make it the minimum-bias winner when it permanently affects users outside the reported failure mode.

**Verdict: minimum is correct as proposed. No Option 4.**

### Minimum-resolves-problem proof

Walk-through on macOS after minimum change:

1. Module loads → `let suggestedRendererType` initializes as `undefined`
2. macOS guard fires immediately: `navigator.platform.includes("mac")` → `suggestedRendererType = "dom"` (independently in both `terminal-addons.ts` and `helpers.ts`)
3. Each new terminal's `requestAnimationFrame` callback hits `if (disposed || suggestedRendererType === "dom") return;` → returns immediately
4. `new WebglAddon()` is never reached on macOS → no WebGL atlas, no texture corruption possible
5. Both module-isolated variables are independently pre-set at module init — no cross-path dependency required

**YES — minimum provably resolves the reported macOS problem.** The GPU-process-death failure mode (forced loseContext → Aw Snap) is fully avoided because WebGL is never loaded on macOS.

Caveat: non-macOS users continue to use WebGL. There is no evidence in the issue or related cluster that Windows/Linux are materially affected. The Kitenite cluster reports are macOS-dominant. The `onContextLoss` handler gap remains open on Windows/Linux (covered by moderate if chosen).

### Scope-creep flags

- **moderate — `onContextLoss` handler change**: The `suggestedRendererType = "dom"` addition to both `onContextLoss` handlers is unreachable on macOS after the minimum guard (WebGL never loads, so `onContextLoss` never fires). It is effective only on Windows/Linux where context loss is rare and not the reported failure mode. Defense-in-depth only — not required by any documented AC.
- **strategic — dep removal (`@xterm/addon-webgl`)**: Dep removal is technically clean (confirmed sole consumer: `apps/desktop/package.json:161`). However it permanently forecloses WebGL on all platforms. If xtermjs/xterm.js#5883 lands and corruption is fixed upstream, re-enabling requires re-adding the dep and re-wiring both files. Flag as an irreversibility tradeoff, not a safety concern.

### Related-issue coverage

The Kitenite cluster (#3208, #3321, #2968, #1065, #3406, #3570) from follow-ups.md share the same reported root cause (WebGL texture-atlas corruption under context-cap pressure). The minimum option resolves the primary macOS failure mode for all of them. It does NOT cover:
- Any Windows/Linux manifestation (no evidence these exist in the cluster)
- The `onContextLoss` handler gap on Windows/Linux (covered by moderate)
- Any upstream xterm.js corruption bug unrelated to context cap (requires xtermjs/xterm.js#5883)

The parallel-worktree conflict risk (`imp-xterm-webgl-macos-fallback-1779419095`) is already present in both minimum and strategic `risks[]` sections of SCOPE.md.

---

## User pushback (2026-05-23)

Owner rejects all 3 options. Reason: **most users are on macOS; permanent DOM is unacceptable perf regression.** Owner wants a WebGL-first / DOM-fallback pattern modeled on VSCode (`microsoft/vscode#120393`), plus a way to *recover back* to WebGL transparently if possible.

This points to an Option 4 (VSCode-style) NOT currently in SCOPE.md, AND raises an open question about post-fallback recovery the investigator did not consider.

Triggering `/deep-research` to settle:
1. VSCode's *current* terminal renderer implementation (has it evolved beyond #120393?)
2. What `xtermjs/xterm.js#5883` actually does — does it fix the corruption upstream?
3. Alternative corruption-detection mechanisms beyond `onContextLoss` (atlas health probe, etc.)
4. Public failure-mode breakdown — how often does corruption fire `onContextLoss` vs not?
5. Whether other terminal apps (Warp, Hyper, Wave, Tabby, iTerm Web, Ghostty) have a more reliable pattern
6. Post-fallback recovery methodology — can the renderer upgrade back to WebGL without visible degradation? What does VSCode do?

Research findings will be saved to `.spec/improvements/GH-3572/RESEARCH.md`. Investigator will be re-dispatched with the new evidence to propose refined options.
