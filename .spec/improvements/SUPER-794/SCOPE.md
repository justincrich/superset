---
source: ticket
improvement_id: SUPER-794
ticket_id: SUPER-794
ticket_url: https://linear.app/superset-sh/issue/SUPER-794/cmdw-in-a-browser-pane-closes-the-whole-window-instead-of-the-focused
tracker: linear
branch: improvement/SUPER-794-focus-aware-pane-hotkeys
status: proposal
investigator_specialist: electron-reviewer
challenger_specialist: code-reviewer
attempt: v2
prior_pr: 4783
revert_pr: 4844
---

# SUPER-794 (v2): Focus-Aware Pane Hotkeys — Cmd+W and Cmd+R in Browser Panes

## Defect

Two behaviors are broken in the post-revert state:

1. **Cmd+W in a browser pane closes the entire BrowserWindow** (the original SUPER-794 regression, re-introduced by the full revert of PR #4844). When focus is in a `<webview>`, `meta+w` is captured by `menu.ts:31`'s `{ label: "Close Window", role: "close" }` implicit accelerator — the renderer hotkeys never fire.

2. **Cmd+R in a browser pane reloads the entire BrowserWindow instead of the focused webview** (the new v2 requirement). Currently `CmdOrCtrl+R` on View→Reload calls `BrowserWindow.getFocusedWindow()?.reload()` regardless of whether a webview is focused. There is no interception on the guest webContents.

Neither of these is a regression from v1's removal — both exist in the current post-revert `main`.

## Reproduction

**Cmd+W:**
1. Open the desktop app and create a browser pane (Cmd+Shift+B).
2. Click inside the browser pane to give the guest webContents keyboard focus.
3. Press Cmd+W.
4. Observed: entire BrowserWindow closes. Expected: only the browser pane closes.

**Cmd+R:**
1. Open the desktop app and create a browser pane navigated to any URL.
2. Click inside the browser pane to give the guest webContents keyboard focus.
3. Press Cmd+R.
4. Observed: the entire app reloads (BrowserWindow.reload()). Expected: only the webview reloads.

Evidence: `.spec/improvements/SUPER-794/v1-prior-art-excerpt.md` — static code-path analysis from v1 with all file:line references verified against post-revert code. Electron behavior verified at: https://www.electronjs.org/docs/latest/api/web-contents (raw: https://raw.githubusercontent.com/electron/electron/main/docs/api/web-contents.md) — canonical quote: "Calling `event.preventDefault` will prevent the page `keydown`/`keyup` events **and the menu shortcuts**."

## Root Cause / Target

**Cmd+W root cause:** `menu.ts:31` — `{ label: "Close Window", role: "close" }` carries an implicit `CmdOrCtrl+W` accelerator. Electron's `role: "close"` silently assigns it. The v1 trace stands; this reference is confirmed at line 31 post-revert.

**Cmd+R root cause:** `menu.ts:51` — `accelerator: reloadAccelerator` where `reloadAccelerator = "CmdOrCtrl+R"` (`menu.ts:14`). The menu accelerator fires `BrowserWindow.getFocusedWindow()?.reload()` unconditionally. No `before-input-event` listener exists on browser pane guest webContents to intercept and redirect it.

**Why v1 went wrong:** PR #4783 correctly intercepted Cmd+W via `before-input-event`. It also correctly intercepted Cmd+R via `before-input-event`. The mistake was removing `accelerator: reloadAccelerator` from the View→Reload menu item. `before-input-event` only fires on the focused webContents — when no webview is focused, there was no remaining Cmd+R handler anywhere. The Electron docs confirm `event.preventDefault()` in `before-input-event` DOES suppress menu accelerators for the focused webContents. Therefore the accelerator removal was unnecessary — Cmd+R would not have double-fired. V2 re-applies the same `before-input-event` interception but preserves `CmdOrCtrl+R` on the menu item.

## Specialist Consultation Summary

All proposed file changes are confined to `apps/desktop/`. The three changed subsystems are: (1) `apps/desktop/src/main/lib/` (main process — menu + browser-manager), (2) `apps/desktop/src/lib/trpc/routers/browser/` (tRPC router), and (3) `apps/desktop/src/renderer/...usePersistentWebview/` (renderer hooks). No packages outside `apps/desktop/` are touched. The renderer changes are minimal subscription additions following the existing `onNewWindow` / `onContextMenuAction` pattern already present in both v1 and v2 workspace variants. No specialist consultation dispatched; all changes are within electron-reviewer domain.

## Options

---

### minimum

**one_line:** Re-apply v1 Cmd+W fix + add Cmd+R webview interception; preserve CmdOrCtrl+R menu accelerator.

**files_in_scope:**
- `apps/desktop/src/main/lib/menu.ts` — replace `role: "close"` on File→Close Window with explicit `click` handler (no accelerator). Do NOT touch View→Reload's `accelerator: reloadAccelerator`.
- `apps/desktop/src/main/lib/browser/browser-manager.ts` — add `beforeInputListeners` map; add `setupBeforeInput(paneId, wc)` that intercepts `keyDown` Cmd/Ctrl+W (no shift) and Cmd/Ctrl+R (no shift) via `event.preventDefault()` + `this.emit(...)`. Include `beforeInputListeners` in all three cleanup loops (`register` re-registration, `unregister`, `unregisterAll` if present).
- `apps/desktop/src/lib/trpc/routers/browser/browser.ts` — add `onClosePane` and `onReloadPane` observable subscriptions following the `onNewWindow` / `onContextMenuAction` pattern.
- `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/TabView/BrowserPane/hooks/usePersistentWebview/usePersistentWebview.ts` (v1 workspace variant) — subscribe to `onClosePane` (calls `requestPaneClose(paneId)`) and `onReloadPane` (calls `webview.reload()`). Unsubscribe in cleanup.
- `apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/BrowserPane/hooks/usePersistentWebview/usePersistentWebview.ts` (v2 workspace variant) — subscribe to `onClosePane` (calls `ctxRef.current.actions.close()`) and `onReloadPane` (calls `browserRuntimeRegistry.reload(paneId)`). Unsubscribe in cleanup.

**loc_budget:** 95

**acceptance_criteria:**
- AC-1: Cmd+W while focus is in a browser pane closes only that browser pane; the BrowserWindow remains open. (Verified by: pane count decreases by 1; window stays.)
- AC-2: Cmd+W while focus is in a terminal/other non-webview pane closes that pane (no regression; renderer hotkeys still fire).
- AC-3: Cmd+Shift+W closes the whole tab regardless of focus (CLOSE_TAB behavior unchanged; not intercepted by `before-input-event` because `input.shift` guard is present).
- AC-4: The File menu "Close Window" item remains visible and functional when clicked; it just has no keyboard accelerator.
- AC-5: Cmd+R while focus is in a browser pane reloads only that webview; the BrowserWindow and its renderer do not reload.
- AC-6: Cmd+R while focus is NOT in a browser pane reloads the BrowserWindow (the View→Reload menu accelerator still fires). This is the non-negotiable from BRIEF §5.
- AC-7: Cmd+Shift+R while focus is in a browser pane still triggers `role: "forceReload"` (host BrowserWindow force-reload); it is NOT intercepted by the `before-input-event` handler because the `!input.shift` guard prevents it.
- AC-8: Fix covers v1 workspace code path (`usePersistentWebview` at `screens/main/.../usePersistentWebview.ts`) and v2 workspace code path (`usePersistentWebview` at `routes/_authenticated/_dashboard/v2-workspace/.../usePersistentWebview.ts`).
- AC-9: `before-input-event` listener is re-attached on webContentsId change (webview reparenting). Verified by: listener is added inside `setupBeforeInput` called from `register()`, which is called on every webContentsId change per existing browser-manager pattern.

**out_of_scope:**
- Removing the View→Reload menu item or changing its click handler.
- Changing `CmdOrCtrl+Shift+R` (forceReload) behavior.
- Changes to `registry.ts` hotkey definitions.
- Auditing other implicit `role`-based accelerators for webview safety.
- Cross-platform Ctrl+W standardization on Windows/Linux.
- New `hotkey-router.ts` abstraction or central accelerator registry.
- Removing or cleaning up the stale `SUPER-794-cmdw-browser-pane-closes-window` worktree.

**risks:**
- **Stale worktree conflict:** `.claude/worktrees/SUPER-794-cmdw-browser-pane-closes-window` touches all five files in scope. If an implementer accidentally works in that worktree, they will be working on reverted code on a diverged branch. Mitigation: implementer MUST work in `.claude/worktrees/SUPER-794-focus-aware-pane-hotkeys`. The stale worktree should be removed before or immediately after the v2 PR merges.
- **Guest vs host webContents distinction:** `before-input-event` on the guest webContents fires when the guest is focused. If `browserManager.register` is called with the host BrowserWindow's webContentsId (not the guest), the handler will intercept Cmd+W and Cmd+R for all keyboard input in the window, not just when a webview is focused. Mitigation: `register` is called from renderer via `electronTrpc.browser.register` with the webview's `webContentsId` — this is the guest webContents, not the host. Verify `src/lib/trpc/routers/browser/browser.ts`'s `register` mutation receives the correct ID.
- **`before-input-event` type guard:** The v1 handler checked `input.type === "keyDown"` only for Cmd+W but not for Cmd+R (the `isReloadKey` check was missing the `type` guard in the recovered diff). Implementer should add `input.type === "keyDown"` to the `isReloadKey` guard to avoid double-firing on keyUp. Mitigation: explicit code review of the `isReloadKey` condition.
- **Cmd+Shift+W (CLOSE_TAB):** The `before-input-event` handler must guard `!input.shift` to avoid intercepting Cmd+Shift+W. The v1 diff had this guard for Cmd+W. Confirm it is present. Mitigation: AC-3 covers this.

**task_chunks:** 1

---

### moderate

**one_line:** Minimum + extract focus-aware hotkey seam (`setupBeforeInput` → `FocusAwareShortcut` pattern) reusable for future webview-level shortcuts.

**files_in_scope:** All five files from minimum, plus:
- `apps/desktop/src/main/lib/browser/browser-manager.ts` — instead of hard-coding Cmd+W and Cmd+R key checks inside `setupBeforeInput`, extract a `FocusAwareShortcut` interface `{ key: string; modifiers: string[]; eventName: string }` and a `registerFocusAwareShortcut(paneId, wc, shortcut[])` method. `setupBeforeInput` becomes `registerFocusAwareShortcut(paneId, wc, BROWSER_PANE_SHORTCUTS)` where `BROWSER_PANE_SHORTCUTS` is a const array.

**loc_budget:** 150

**acceptance_criteria:** AC-1 through AC-9 from minimum, plus:
- AC-10: A second caller can register additional per-pane shortcuts through the same `registerFocusAwareShortcut` API without touching the `before-input-event` listener setup or cleanup boilerplate.

**out_of_scope:** Everything from minimum's out_of_scope, plus: no change to the tRPC router shape, no new IPC channels, no renderer-side registry.

**risks:** Same as minimum. Additional risk: the `FocusAwareShortcut` abstraction may be premature if no second caller exists now — YAGNI. Mitigation: only adopt moderate if the team has a second webview shortcut already planned (e.g., Cmd+L for address bar focus in browser panes).

**task_chunks:** 1

---

### strategic

**one_line:** Declarative accelerator registry — single table maps {keystroke, focus-context} → handler for menu, renderer, and webview shortcuts.

**one_line_flag:** SEPARATE-SPRINT CANDIDATE — not a single-PR recommendation.

**files_in_scope:**
- `apps/desktop/src/main/lib/menu.ts`
- `apps/desktop/src/main/lib/browser/browser-manager.ts`
- `apps/desktop/src/lib/trpc/routers/browser/browser.ts`
- Both `usePersistentWebview.ts` variants
- NEW: `apps/desktop/src/main/lib/hotkey-router.ts` — declarative registry
- NEW: `apps/desktop/src/main/lib/focus-tracker.ts` — tracks which webContents (host vs guest pane) currently has focus

**loc_budget:** 400+

**acceptance_criteria:** AC-1 through AC-9 from minimum, plus:
- AC-10: Adding a new focus-aware shortcut requires only adding a row to the declarative registry, with zero changes to listener setup/teardown/routing logic.
- AC-11: The registry is the single source of truth for which accelerators exist, their focus-context requirements, and their handlers.

**out_of_scope:** Nothing — this is the "ideal refactor" option.

**risks:**
- Multi-file architectural change; significantly higher review and testing surface.
- Focus-tracker introduces a new stateful singleton in main process — race conditions on rapid focus switches.
- Not appropriate for a bug fix sprint; should be a dedicated refactor sprint.

**why_strategic_is_deferred:** The minimum option fully satisfies all BRIEF §5 non-negotiables with ~95 LOC across 5 files. The strategic option is the long-term correct architecture (matching v1 Follow-up #1: Central Accelerator Registry) but is sprint-sized work. Flag as post-v2 follow-up.

**task_chunks:** 2 (chunk-1: hotkey-router + focus-tracker + menu/browser-manager; chunk-2: renderer migration to registry-driven subscriptions)

---

## Recommendation

**Minimum.** It is identical to v1 minus the one-line accelerator removal mistake. The Electron `before-input-event` behavior is verified: `event.preventDefault()` suppresses the menu accelerator for the focused webContents, so keeping `CmdOrCtrl+R` in the menu is safe — it will not double-fire when a webview is focused. All five BRIEF §5 non-negotiables are met. LOC budget is ~95. No new abstractions. The mistake was precisely identified; the fix is precisely scoped.

---

## Challenge

**Challenger:** code-reviewer (fresh-eyes adversarial review — no prior involvement in v1 or v2 investigation)
**Date:** 2026-05-22

### Task 1 — Evidence Re-verification

#### v1-prior-art-excerpt.md

**Status: CONFIRMED.** File exists. All 8 file:line references verified against live post-revert code. No fabrication detected. One v1 bug confirmed by the excerpt itself (already in minimum's risks): `isReloadKey` at v1-prior-art-excerpt.md:86-95 is missing `input.type === "keyDown"` — the v1 handler would have double-fired on keyUp. The `isCloseKey` guard includes it; `isReloadKey` does not. The v2 implementer MUST add `input.type === "keyDown"` to both guards.

| Reference | Verified |
|-----------|----------|
| `menu.ts:31` — `{ label: "Close Window", role: "close" }` | CONFIRMED (line 31) |
| `menu.ts:14` — `reloadAccelerator = "CmdOrCtrl+R"` | CONFIRMED (line 14) |
| `menu.ts:51` — `accelerator: reloadAccelerator` | CONFIRMED (line 51) |
| `menu.ts:72` — Window menu close role | CONFIRMED (line 72) |
| `registry.ts:341` — CLOSE_PANE | CONFIRMED (lines 341-350) |
| `registry.ts:419` — CLOSE_TERMINAL | CONFIRMED (lines 419-427) |
| `browser-manager.ts:32` — `register(paneId, webContentsId)` | CONFIRMED |
| `browser-manager.ts:36` — cleanup loop, no `beforeInputListeners` | CONFIRMED |

#### Electron docs URL and canonical quote

**Status: CONFIRMED with an unverified nuance.**

The canonical quote is real (https://www.electronjs.org/docs/latest/api/web-contents and corroborated by Electron issue #19279). However, Electron docs describe this behavior for the **host** BrowserWindow's webContents. The fix installs listeners on the **guest** webContents of a `<webview>` — a separate renderer process. Whether `event.preventDefault()` on a guest's `before-input-event` suppresses the **host** BrowserWindow's menu accelerators is not explicitly documented for the guest case. Electron issue #17794 documents anomalous webview behavior with `before-input-event`.

v1 PR #4783's Cmd+W interception shipped and worked (the revert was for unrelated Cmd+R accelerator removal), providing empirical support that guest-webContents `preventDefault` does suppress host menu accelerators.

**Assessment: NOT `investigation-incomplete`.** The quote is real. Empirical evidence supports the claim. The nuance is a required implementer verification task (added to unverified risks below), not a fabricated citation.

### Task 2 — Smaller Option Proposed

A credible smaller option exists.

#### Option 4 (challenger-proposed): minimum-minus-onReloadPane

**one_line:** Same Cmd+W fix as minimum (full tRPC path required); intercept Cmd+R in `setupBeforeInput` and call `wc.reload()` directly in the main process — eliminates `onReloadPane` tRPC subscription and all renderer-side reload subscribers.

**rationale:** `browserManager` already holds the guest `webContents`. `wc.reload()` called from `setupBeforeInput` produces identical results to the renderer calling `webview.reload()` — both trigger the same DOM events (`did-start-loading`, `did-stop-loading`, `did-navigate`) that the `browserRuntimeRegistry` (v2, `browserRuntimeRegistry.ts:237-260`) and the v1 usePersistentWebview event handlers already process. Renderer-side state tracking is event-driven; it does not depend on who initiated the reload.

Cmd+W cannot use this shortcut: the v2 `CLOSE_PANE` handler (`useWorkspaceHotkeys.ts:113-129`) runs `onBeforeClose` hooks before calling `state.closePane()`. Bypassing tRPC would skip `onBeforeClose` — a correctness regression. `onClosePane` tRPC subscription is required for Cmd+W.

**files_in_scope:** Same 5 files as minimum. Changes:
- `browser-manager.ts`: In `setupBeforeInput`, Cmd+R calls `wc.reload()` instead of `this.emit('reload-pane:${paneId}')`. All other changes identical to minimum.
- `browser.ts`: Add `onClosePane` only. No `onReloadPane`.
- Both `usePersistentWebview.ts` variants: Subscribe to `onClosePane` only. No `onReloadPane` subscriber.

**loc_budget:** ~62 (~33 LOC saved vs minimum's 95)

**acceptance_criteria:** AC-1 through AC-9 unchanged.

**risks:**
- If a "before-reload" hook is needed in the future (e.g., "Page has unsaved data — reload?"), the main-process-direct approach requires retrofitting. The minimum option's `onReloadPane` tRPC path provides that hook point. If a before-reload hook is anticipated within 2 sprints, prefer minimum.
- `wc` is confirmed non-null at the point `before-input-event` fires (the event fires on wc). Race window between event and `wc.reload()` call is negligible.

**out_of_scope:** Same as minimum.
**task_chunks:** 1

### Task 3 — Minimum Resolves Both Non-Negotiables

**Cmd+W verdict: PASS (all test cases)**

| Test case | Verdict | Reasoning |
|-----------|---------|-----------|
| Window focus / no pane focused → Cmd+W does nothing | PASS | File menu implicit accelerator removed; no guest wc focused; no handler fires |
| Terminal pane focused → Cmd+W closes terminal pane | PASS | xterm.js in renderer DOM; `react-hotkeys-hook` fires; no guest wc involved |
| Browser pane focused → Cmd+W closes browser pane | PASS (pending verification) | Guest wc `before-input-event` + `preventDefault` + tRPC `onClosePane` |
| Cmd+Shift+W → closes tab | PASS | `!input.shift` guard in `setupBeforeInput` skips interception |

**Cmd+R verdict: PASS (all test cases)**

| Test case | Verdict | Reasoning |
|-----------|---------|-----------|
| Window focus / no pane focused → Cmd+R reloads window | PASS | No guest wc focused; View→Reload menu accelerator fires normally |
| Terminal pane focused → Cmd+R reloads window (BRIEF §3) | PASS | Terminal = renderer DOM; no guest wc `before-input-event`; menu accelerator fires |
| Browser pane focused → Cmd+R reloads webview only | PASS (pending verification) | Guest wc `before-input-event` + `preventDefault` + tRPC `onReloadPane` |
| Cmd+Shift+R in browser pane → host force-reload | PASS | `!input.shift` guard prevents interception |

No gaps in minimum's design for either non-negotiable.

### Task 4 — Scope Creep Flags

| File | Option | Required by AC? | Flag |
|------|--------|-----------------|------|
| `browser-manager.ts` — `FocusAwareShortcut` interface + `registerFocusAwareShortcut` method | moderate | No — AC-10 is self-referential | YAGNI: no second caller exists or is planned |
| `apps/desktop/src/main/lib/hotkey-router.ts` (NEW) | strategic | No | Architectural aspiration; correctly deferred |
| `apps/desktop/src/main/lib/focus-tracker.ts` (NEW) | strategic | No | Architectural aspiration; correctly deferred |

All 5 files in the minimum option are required by ACs. No scope creep in minimum.

### Task 5 — Focus Detection Strategy Risks

**Unverified risks (implementer must confirm before shipping):**

1. **Guest-webContents `preventDefault` → host menu suppression:** Does `event.preventDefault()` on a guest webContents's `before-input-event` suppress the host BrowserWindow's menu accelerators? Electron docs confirm this for the host webContents case. v1 empirical evidence (Cmd+W worked) supports yes for the guest case. Electron issue #17794 documents anomalies. Implementer MUST confirm with a manual test: install `before-input-event` on a guest wc, call `preventDefault()`, press the accelerator, verify the host menu item does not fire.
2. **Hung guest renderer:** If the guest page JS is hung, the guest renderer process does not process `before-input-event`. The event never fires. The host menu accelerator fires: Cmd+W closes the window; Cmd+R reloads the window. Pre-existing limitation identical to v1. Acceptable as edge case; no mitigation needed for v2.

**Confirmed non-risks:** title-bar click (menu fires normally; correct behavior), keyboard vs hover focus (`before-input-event` requires keyboard focus), multiple browser panes (each listener keyed by paneId; no cross-contamination), `unregisterAll` (calls `unregister` per pane; cleanup map handles `beforeInputListeners`).

### Challenger Recommendation Override

Investigator recommends **minimum**. Challenger agrees minimum is correct and correctly scoped.

**However, Option 4 (challenger-proposed, ~62 LOC) is strictly smaller and equally correct** for all ACs. It eliminates the `onReloadPane` tRPC subscription by calling `wc.reload()` directly from the main process, since webview reload requires no renderer-side pre-close hooks (unlike pane close).

**Updated recommendation order:**
1. **Option 4** if no "before-reload" hook is anticipated within 2 sprints. Saves ~33 LOC, fewer moving parts.
2. **Minimum** if symmetric tRPC pattern (close + reload via subscription) is preferred, or a before-reload hook is anticipated.
3. **Do not adopt moderate** — `FocusAwareShortcut` has no second caller; YAGNI.
4. Strategic remains a separate-sprint candidate.
