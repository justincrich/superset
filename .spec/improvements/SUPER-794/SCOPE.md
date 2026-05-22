---
source: ticket
improvement_id: SUPER-794
ticket_id: SUPER-794
ticket_url: https://linear.app/superset-sh/issue/SUPER-794/cmdw-in-a-browser-pane-closes-the-whole-window-instead-of-the-focused
tracker: linear
branch: improvement/SUPER-794-focus-aware-pane-hotkeys
status: binding
chosen_option: minimum
loc_budget: 95
task_chunks: 1
investigator_specialist: electron-reviewer
challenger_specialist: code-reviewer
attempt: v2
prior_pr: 4783
revert_pr: 4844
---

# SUPER-794 (v2): Focus-Aware Pane Hotkeys — Cmd+W and Cmd+R in Browser Panes

## Defect

Two behaviors are broken in the post-revert state (origin/main at `40a0a7c34`):

1. **Cmd+W in a browser pane closes the entire BrowserWindow** (original SUPER-794 regression, re-introduced by the full revert in PR #4844). When focus is in a `<webview>`, `meta+w` is captured by `apps/desktop/src/main/lib/menu.ts:31`'s `{ label: "Close Window", role: "close" }` implicit accelerator — the renderer-side hotkeys never fire.

2. **Cmd+R in a browser pane reloads the entire BrowserWindow instead of the focused webview** (new v2 requirement, not in the original Linear ticket). The View→Reload menu accelerator at `menu.ts:51` (`accelerator: reloadAccelerator = "CmdOrCtrl+R"`) calls `BrowserWindow.getFocusedWindow()?.reload()` regardless of which pane is focused. There is no interception on the guest webContents.

### Target behavior matrix

| Focus state | Cmd+W | Cmd+R |
|---|---|---|
| No webview focused (window / terminal / non-webview pane / title bar / no pane) | does NOTHING (File menu item still clickable; no accelerator) | reloads the entire BrowserWindow (View→Reload accelerator fires) |
| Webview focused (user clicked inside a browser pane) | closes only that browser pane | reloads only that webview |
| Cmd+Shift+W (any focus) | closes the whole tab (CLOSE_TAB; unchanged) | n/a |
| Cmd+Shift+R (any focus) | n/a | host BrowserWindow force-reload (`role: "forceReload"`; unchanged) |

## Evidence

- **v1 prior art (Cmd+W root cause + reproduction trace):** `.spec/improvements/SUPER-794/v1-prior-art-excerpt.md` (recovered from `gh pr diff 4783`). All 8 file:line references re-verified against post-revert code by both investigator and challenger.
- **v1 regression analysis (why PR #4783 was reverted):** PR #4844 body. Root cause: PR #4783 removed `reloadAccelerator = "CmdOrCtrl+R"` (line 11 of its menu.ts diff, `menu.ts:14`) AND removed `accelerator: reloadAccelerator` from View→Reload (line 29 of diff, `menu.ts:51`). With both gone, Cmd+R had zero handlers when no webview was focused.
- **Electron behavior verification (key behavioral assumption):** `https://www.electronjs.org/docs/latest/api/web-contents` documents that `event.preventDefault()` in a `before-input-event` handler "will prevent the page keydown/keyup events AND the menu shortcuts." Corroborated by Electron issue #19279. **Nuance:** docs describe the host webContents case; the guest-webContents case is empirically validated by v1's Cmd+W interception shipping and working (the revert was for Cmd+R, not because guest-side `preventDefault` failed). See Risks below for the implementer's must-verify item.
- **v1 bug to fix in v2 implementation:** The recovered `isReloadKey` guard at v1-prior-art-excerpt.md:86-95 is missing `input.type === "keyDown"`. The `isCloseKey` guard at line 75 includes it. Without the type guard, Cmd+R double-fires on keyUp. Implementer MUST add `input.type === "keyDown"` to the `isReloadKey` guard.

## Root cause / Target

The v1 PR correctly identified and fixed the Cmd+W root cause (`menu.ts:31`'s implicit `role: "close"` accelerator captures keystrokes from focused webviews via the host menu system). It also correctly identified that the same mechanism can intercept Cmd+R on the guest webContents via `before-input-event` + `preventDefault()`. The mistake was **also** stripping `CmdOrCtrl+R` from the View→Reload menu item — which was unnecessary because Electron's documented behavior is that `preventDefault()` on the guest's `before-input-event` already suppresses the host menu accelerator for the focused webContents. With the accelerator stripped, Cmd+R lost its window-reload handler entirely whenever no webview was focused → unrefreshable app.

**v2 target:** re-apply v1's surviving correct work (Cmd+W interception + tRPC subscription + renderer wiring + File→Close Window explicit click handler), ADD the symmetric Cmd+R interception (same mechanism), and **leave `CmdOrCtrl+R` on the View→Reload menu item untouched**. The menu accelerator continues to fire when no webview is focused; `preventDefault()` on the guest's `before-input-event` suppresses it when a webview IS focused.

## Specialist consultation summary

No cross-domain specialist dispatched. Scope is entirely inside `apps/desktop/**` — main process (`apps/desktop/src/main/`), tRPC router (`apps/desktop/src/lib/trpc/`), and renderer hooks (`apps/desktop/src/renderer/`). The investigator (`electron-reviewer`) covers all three sub-domains directly. The challenger (`code-reviewer`) confirmed file-overlap pre-flight and risk audit. No auth/secrets/tokens/RBAC touched; security-reviewer not required.

## Binding scope (chosen: minimum)

### Acceptance criteria

- **AC-1:** Cmd+W while focus is in a browser pane closes only that browser pane; the BrowserWindow remains open. Verified by: pane count decreases by 1; window stays.
- **AC-2:** Cmd+W while focus is in a terminal/other non-webview pane closes that pane (no regression; renderer hotkeys still fire via existing `CLOSE_PANE`/`CLOSE_TERMINAL` registry entries).
- **AC-3:** Cmd+Shift+W closes the whole tab regardless of focus (CLOSE_TAB behavior unchanged; not intercepted by `before-input-event` because the `!input.shift` guard is present in `setupBeforeInput`).
- **AC-4:** The File menu "Close Window" item remains visible and functional when clicked; it just has no keyboard accelerator.
- **AC-5:** Cmd+R while focus is in a browser pane reloads only that webview; the BrowserWindow and its renderer do not reload.
- **AC-6:** Cmd+R while focus is NOT in a browser pane reloads the BrowserWindow (the View→Reload menu accelerator at `menu.ts:51` still fires). **This is the non-negotiable that v1 broke.**
- **AC-7:** Cmd+Shift+R while focus is in a browser pane still triggers `role: "forceReload"` (host BrowserWindow force-reload); it is NOT intercepted by the `before-input-event` handler because the `!input.shift` guard prevents it.
- **AC-8:** Fix covers BOTH the v1 workspace code path (`apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/TabView/BrowserPane/hooks/usePersistentWebview/usePersistentWebview.ts`) and the v2 workspace code path (`apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/BrowserPane/hooks/usePersistentWebview/usePersistentWebview.ts`).
- **AC-9:** `before-input-event` listener is re-attached on `webContentsId` change (webview reparenting). Verified by: listener attachment lives inside `setupBeforeInput`, which is called from `register()`, which is called on every `webContentsId` change per the existing `BrowserManager` pattern.

### Files in scope

1. `apps/desktop/src/main/lib/menu.ts` — replace `role: "close"` on File→Close Window with an explicit `click` handler that calls `BrowserWindow.getFocusedWindow()?.close()`; set no `accelerator` on the item. **DO NOT TOUCH** `reloadAccelerator` (line 14) or the `accelerator: reloadAccelerator` binding on View→Reload (line 51) — these MUST remain to satisfy AC-6.
2. `apps/desktop/src/main/lib/browser/browser-manager.ts` — add `beforeInputListeners: Map<paneId, () => void>` member (parallel to existing `consoleListeners` / `contextMenuListeners` patterns). Add `setupBeforeInput(paneId, wc)` that registers a `webContents.on("before-input-event", handler)` listener intercepting `keyDown` events for Cmd/Ctrl+W (no shift) and Cmd/Ctrl+R (no shift) via `event.preventDefault()` + `this.emit("close-pane:${paneId}")` / `this.emit("reload-pane:${paneId}")`. Call `setupBeforeInput` from inside `register()`. Add `beforeInputListeners` to all three cleanup loops (`register` re-registration, `unregister`, `unregisterAll`).
3. `apps/desktop/src/lib/trpc/routers/browser/browser.ts` — add `onClosePane` and `onReloadPane` observable subscriptions following the existing `onNewWindow` / `onContextMenuAction` pattern.
4. `apps/desktop/src/renderer/screens/main/components/WorkspaceView/ContentView/TabsContent/TabView/BrowserPane/hooks/usePersistentWebview/usePersistentWebview.ts` (v1 variant) — subscribe to `onClosePane` (calls `requestPaneClose(paneId)`) and `onReloadPane` (calls `webview.reload()`). Unsubscribe on cleanup.
5. `apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/BrowserPane/hooks/usePersistentWebview/usePersistentWebview.ts` (v2 variant) — subscribe to `onClosePane` (calls `ctxRef.current.actions.close()`) and `onReloadPane` (calls `browserRuntimeRegistry.reload(paneId)`). Unsubscribe on cleanup.

### Out of scope (deliberately deferred)

- Removing the View→Reload menu item or changing its click handler.
- Changing `CmdOrCtrl+Shift+R` (forceReload) behavior.
- Changes to `apps/desktop/src/renderer/hotkeys/registry.ts` definitions.
- Auditing other implicit `role`-based menu accelerators for webview safety (broader sweep deferred to follow-up).
- Cross-platform Ctrl+W standardization on Windows/Linux.
- New `hotkey-router.ts` or focus-tracker abstraction (strategic option).
- Generic `FocusAwareShortcut` interface (moderate option; YAGNI per challenger).
- Skipping the renderer round-trip for Cmd+R (Option 4 / challenger-smaller; not chosen because the symmetric tRPC pattern preserves a hook point for a future "confirm-before-reload" dialog).
- Removing or cleaning up the stale `.claude/worktrees/SUPER-794-cmdw-browser-pane-closes-window` worktree (operational hygiene, not in scope).
- Adding integration tests for webview accelerator behavior (test infrastructure work; see follow-ups).

### Risks

- **Implementer must verify (R1):** Does `event.preventDefault()` on a GUEST webContents's `before-input-event` actually suppress the HOST BrowserWindow's menu accelerators? Electron docs confirm this for the host webContents case; the guest-specific case is not explicitly documented. v1 empirically demonstrated yes for Cmd+W. **Mitigation:** before shipping, manual verification with a focused webview pressing Cmd+R — confirm the host menu's View→Reload does NOT fire. If guest preventDefault does NOT suppress the host menu, this scope is invalid and must be redesigned (likely toward conditionally enabling/disabling the menu item based on focus state).
- **Implementer must add (R2):** `input.type === "keyDown"` guard on the `isReloadKey` check (v1 had it on `isCloseKey` but not on `isReloadKey`). Without it, Cmd+R double-fires (keyDown + keyUp). **Mitigation:** explicit code review of the `isReloadKey` condition; mirror the structure of `isCloseKey`.
- **Hung guest renderer (R3, acceptable):** If the guest page is hung, `before-input-event` does not fire on the guest wc. The host menu accelerator fires: Cmd+W closes the window, Cmd+R reloads the window. Identical to v1's behavior; acceptable as an edge case.
- **Stale worktree conflict (R4):** `.claude/worktrees/SUPER-794-cmdw-browser-pane-closes-window` (from the v1 attempt) touches all 5 files in this scope. **Mitigation:** implementer MUST work in `.claude/worktrees/SUPER-794-focus-aware-pane-hotkeys`. The stale worktree should be removed (out of scope; track as cleanup).
- **`unregisterAll` and re-registration cleanup (R5):** the new `beforeInputListeners` map MUST be added to the cleanup loop in `register()` (re-registration on `webContentsId` change), `unregister(paneId)`, and `unregisterAll()` — exactly mirroring the existing `consoleListeners` / `contextMenuListeners` pattern. Missing any one leaks listeners on webview reparenting / tab close. **Mitigation:** AC-9 covers re-registration; deferred follow-up #4 covers the broader cleanup-loop refactor.

## Considered alternatives

- **moderate** — minimum + extract a `FocusAwareShortcut` interface and `registerFocusAwareShortcut` method on `BrowserManager` so future webview-level shortcuts plug in declaratively. **Rejected:** both investigator and challenger flagged YAGNI — no second caller for the abstraction exists or is planned. Adopting moderate would add ~55 LOC for an abstraction with one caller.
- **strategic** — minimum + new `hotkey-router.ts` (declarative `{ keystroke, focus-context } → handler` registry) + `focus-tracker.ts` (host-vs-guest focus state). **Rejected:** sprint-sized architectural work (~400+ LOC, 2 chunks). Captured as deferred follow-up #1 (Central Accelerator Registry).
- **Option 4 — challenger-smaller / minimum-minus-onReloadPane** — same Cmd+W path; Cmd+R skips renderer round-trip and calls `wc.reload()` directly from the main process. ~62 LOC. **Rejected:** the renderer-side `onReloadPane` subscription preserves a hook point for a potential future "confirm-before-reload" dialog (e.g., for browser panes with unsaved form data). The user chose symmetric tRPC plumbing to keep that option open.
- **Even-smaller (Cmd+W only, defer Cmd+R)** — not viable. BRIEF §3 and §5 non-negotiable #1 explicitly require both Cmd+R behaviors (focus-aware) in the same change.

## Challenger notes

- Evidence (v1-prior-art-excerpt.md + Electron docs URL) was re-verified by the challenger; no fabrication detected.
- Electron `preventDefault()` behavior on **guest** webContents is empirically supported by v1 shipping but not explicitly documented; documented as R1 (must-verify).
- Minimum proves both non-negotiables across all 8 test cases (Cmd+W × 4 + Cmd+R × 4) modulo R1.
- Moderate's `FocusAwareShortcut` flagged as YAGNI — no AC requires it, no second caller exists.
- Strategic correctly labeled SEPARATE-SPRINT CANDIDATE — both new files (`hotkey-router.ts`, `focus-tracker.ts`) are architectural aspirations, not bug-fix ACs.
- Challenger noted the v1 `isReloadKey` was missing the `input.type === "keyDown"` guard — captured as R2.

## Security review

Not required — no auth, secrets, tokens, or RBAC touched. All changes are within `apps/desktop/**` keyboard-routing and pane-lifecycle code.

## Scope amendments

None.

## Deferred follow-ups

See `.spec/improvements/SUPER-794/follow-ups.md` for 6 items: central accelerator registry (v1 #1), webview accelerator testing infrastructure (v1 #2), Mac vs Win/Linux Cmd+W standardization (v1 #3), browser-manager listener cleanup refactor (v1 #4), plus two v2-specific items (manual-verification test for guest-wc `preventDefault` suppression of host menu; stale-worktree cleanup).
