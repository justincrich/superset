# SUPER-755-collapse-composer-model-menu: Collapse chat composer model settings into one menu

> Assignee: react-vite-ui-implementer
> Priority: P1
> Type: improvement (presentation-only refactor)
> Files: apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/ChatPane/components/WorkspaceChatInterface/components/ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx, apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/ChatPane/components/WorkspaceChatInterface/components/ChatInputFooter/components/ChatComposerControls/ComposerSettingsMenu/ComposerSettingsMenu.tsx, apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/ChatPane/components/WorkspaceChatInterface/components/ChatInputFooter/components/ChatComposerControls/ComposerSettingsMenu/index.ts, apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx, apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/ChatComposerControls/ComposerSettingsMenu/ComposerSettingsMenu.tsx, apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/ChatComposerControls/ComposerSettingsMenu/index.ts
> Patterns: minimum-diff-discipline, anti-stub, rule-of-2-duplication-justified
> Scope: .spec/improvements/SUPER-755/SCOPE.md
> Design: .spec/improvements/SUPER-755/SCOPE.md (sections `## Proposed interface (frontend-designer)` and `## Frontend-designer review (independent design pass)`)

## Context

The v2 chat composer footer currently renders three separate pill buttons in a row — `PermissionModePicker`, `ModelPicker`, and `ThinkingToggle`. It looks cluttered. This task replaces the three pills with a **single consolidated trigger** opening a `DropdownMenu` containing all three settings as grouped sections. The v1 composer is byte-for-byte identical in this region and gets the same treatment in the same PR. Pure presentation refactor — no state plumbing changes.

Root cause summary: three sibling controls of identical visual weight compete for attention in a 23-pixel-tall composer footer. Collapsing them under one trigger (with at-a-glance status icons for active state) restores visual hierarchy without removing reachability.

For full reproduction evidence, root-cause file:line refs, considered alternatives (including the rejected "Candidate C — partial 2-of-3 collapse"), challenger notes, and the post-binding scope amendment §1 (BrainIcon must use `text-muted-foreground` instead of `opacity-40` to avoid disabled-affordance reading), READ:

`.spec/improvements/SUPER-755/SCOPE.md`

That document is your binding contract. You may NOT touch files outside the `> Files:` list above. Specifically, do NOT modify `ModelPicker.tsx`, `PermissionModePicker.tsx`, `packages/ui/.../thinking-toggle.tsx`, `ChatInputFooter`, `PILL_BUTTON_CLASS` in `styles.ts`, or the v1/v2 trpc client imports.

### Hard architectural constraint
`ModelSelector` is a `Dialog` (not a `Popover`) — `packages/ui/src/components/ai-elements/model-selector.tsx:L21-L24`. The binding design uses **two-phase open**: `DropdownMenu`'s `onSelect` handler calls `setModelSelectorOpen(true)`; Radix auto-closes the parent menu; the Dialog mounts on the next tick. NO manual `setMenuOpen(false)` is needed.

### Composition pattern (binding)
A new `ComposerSettingsMenu/` directory is co-located beside EACH `ChatComposerControls/` (one for v1, one for v2). The two `ComposerSettingsMenu.tsx` files are **byte-for-byte identical**. They are NOT extracted to `packages/ui` in this PR (deferred to follow-up #6).

## Acceptance Criteria

### Trigger button visual

- [ ] AC-1: The single trigger button replaces the three pills in BOTH v1 and v2 `ChatComposerControls.tsx`. Visible content: `[ShieldIcon for active permission mode][ProviderLogo][ModelName][BrainIcon]`.
- [ ] AC-2: Trigger height matches `PILL_BUTTON_CLASS` (`h-[23px]`); model name truncates with `max-w-[180px]`; NO ChevronDown (aria-expanded covers a11y).
- [ ] AC-3: ShieldIcon variant reflects active permission mode (Auto / Semi-auto / Manual) — match the icon set used inside `PermissionModePicker`. Always at `text-foreground` (no dimming — permission mode is never "off"). Manual mode MAY use a safety-signal accent (e.g., `text-amber-500`) at implementer's discretion based on visual review.
- [ ] AC-4: BrainIcon is ALWAYS rendered in the trigger. State communicated via **semantic color, NOT opacity**: `text-muted-foreground` when `thinkingLevel === 'off'`, `text-foreground` otherwise. Same size, same icon weight — only color changes. No layout shift.
- [ ] AC-5: Trigger has a dynamic `aria-label` (e.g., "Chat settings: model Claude 3.5 Sonnet, permission Auto, thinking Off") and standard keyboard activation. `cursor-pointer` always; NEVER `cursor-not-allowed`.
- [ ] AC-20: Trigger has a `Tooltip` (existing `packages/ui` primitive) surfacing the full current configuration on hover (e.g., "Model: Claude 3.5 Sonnet · Permission: Auto · Thinking: Off"). Uses the existing `Tooltip`/`TooltipProvider` primitives — do NOT introduce a custom tooltip.

### Menu structure

- [ ] AC-6: Clicking the trigger opens a `DropdownMenu` (`w-64`) with three sections in this order: **Model**, **Permission**, **Thinking**.
- [ ] AC-7: Section headers use `DropdownMenuLabel` (no custom styling); 2 `DropdownMenuSeparator` between the 3 sections.
- [ ] AC-8: Model section: ONE `DropdownMenuItem` row showing `[ProviderLogo][ModelName...truncate][ChevronRightIcon]`. `onSelect` calls `setModelSelectorOpen(true)` only — Radix auto-closes the parent menu, then the Dialog mounts (two-phase open). No manual `setMenuOpen(false)`.
- [ ] AC-9: Permission section: 3 inline `DropdownMenuItem` rows (Auto / Semi-auto / Manual), each with shield icon + label + description, matching existing `PermissionModePicker` content. Use `onSelect` (not `onClick`) calling `setPermissionMode`. Active item shown with `CheckIcon` or accent bg.
- [ ] AC-10: Thinking section: 5 inline `DropdownMenuItem` rows (Off / Low / Medium / High / Max), matching existing `ThinkingToggle` content. Use `onSelect` calling `setThinkingLevel`. Active item shown with `CheckIcon` or accent bg.

### Composition pattern

- [ ] AC-11: A new `ComposerSettingsMenu/` directory is co-located beside EACH `ChatComposerControls/` directory. Each contains `ComposerSettingsMenu.tsx` + `index.ts`.
- [ ] AC-12: Both `ComposerSettingsMenu.tsx` files are **byte-for-byte identical content**. They are NOT extracted to a shared location in this PR.

### Non-regression

- [ ] AC-13: `ChatComposerControls.tsx` props interface unchanged in both v1 and v2 (same inbound props from `ChatInputFooter`).
- [ ] AC-14: `ModelPicker.tsx`, `PermissionModePicker.tsx`, and `packages/ui/.../thinking-toggle.tsx` are NOT modified.
- [ ] AC-15: `ChatInputFooter` is NOT modified in either v1 or v2 (same props plumbed through).
- [ ] AC-16: `apps/desktop/.../ChatInterface/styles.ts` (PILL_BUTTON_CLASS) is NOT modified.
- [ ] AC-17: v1 `ModelPicker` keeps its `chatServiceTrpc` import; v2 keeps its `workspaceTrpc` import — divergence preserved (the consolidated menu never touches trpc directly).
- [ ] AC-18: `bun run typecheck` passes.
- [ ] AC-19: `bun run lint` passes (warnings = errors per Biome CI policy).

## Test Criteria

| # | Boolean Statement | Maps To AC | Verify | Status |
|---|-------------------|------------|--------|--------|
| TC-1 | The trigger button shows `[ShieldIcon][ProviderLogo][ModelName][BrainIcon]` content in BOTH v1 and v2 composer footers | AC-1 | manual: `bun dev` then open chat composer, visually verify trigger content matches in v1 and v2 surfaces | [ ] TRUE [ ] FALSE |
| TC-2 | Trigger height is exactly 23px, model name truncates at 180px, no ChevronDown is rendered | AC-2 | manual: DevTools inspect the trigger; computed height = 23px; model name has `max-w-[180px] truncate`; no `ChevronDown` SVG in DOM | [ ] TRUE [ ] FALSE |
| TC-3 | ShieldIcon variant changes between Auto/Semi-auto/Manual and stays at `text-foreground` (never opacity-dimmed) | AC-3 | manual: cycle permission mode in the consolidated menu, verify shield icon variant changes in trigger, verify Tailwind class is `text-foreground` in DevTools (or amber for Manual if accent applied) | [ ] TRUE [ ] FALSE |
| TC-4 | BrainIcon is rendered in every state; color is `text-muted-foreground` when thinking is Off, `text-foreground` otherwise; trigger width does not shift | AC-4 | manual: toggle thinking Off → Low → Off; DevTools confirm BrainIcon present in both states with the documented Tailwind classes; trigger bounding box width unchanged | [ ] TRUE [ ] FALSE |
| TC-5 | Trigger has dynamic aria-label and `cursor-pointer`; never `cursor-not-allowed` even when thinking is Off | AC-5 | manual: DevTools inspect trigger when thinking=Off; aria-label string includes current model/permission/thinking; computed cursor is `pointer` | [ ] TRUE [ ] FALSE |
| TC-6 | Hovering the trigger reveals a Tooltip with the full current configuration; tooltip uses `packages/ui` `Tooltip` primitive | AC-20 | manual: hover trigger, tooltip appears with "Model: X · Permission: Y · Thinking: Z"; grep ComposerSettingsMenu.tsx for `Tooltip` import from `@superset/ui` (or local re-export) | [ ] TRUE [ ] FALSE |
| TC-7 | Clicking the trigger opens a DropdownMenu with width w-64 showing Model, Permission, Thinking sections in that order | AC-6 | manual: click trigger, verify menu width, verify section order | [ ] TRUE [ ] FALSE |
| TC-8 | Section headers are `DropdownMenuLabel`; exactly 2 `DropdownMenuSeparator` instances exist between the 3 sections | AC-7 | manual: open menu, DevTools inspect; grep ComposerSettingsMenu.tsx for `DropdownMenuLabel` (3) + `DropdownMenuSeparator` (2) | [ ] TRUE [ ] FALSE |
| TC-9 | The Model row has ChevronRightIcon and opens the existing ModelPicker Dialog via two-phase open (menu auto-closes on onSelect, then Dialog mounts) | AC-8 | manual: open menu, click Model row, observe menu disappears followed by Dialog appearing; verify in ComposerSettingsMenu.tsx that onSelect calls only `setModelSelectorOpen(true)` (no `setMenuOpen(false)`) | [ ] TRUE [ ] FALSE |
| TC-10 | Permission section renders 3 inline items matching PermissionModePicker content; selecting one updates state via `onSelect` calling `setPermissionMode` and closes the menu | AC-9 | manual: open menu, click each permission option, verify selection updates and menu closes; grep ComposerSettingsMenu.tsx for `onSelect` (not `onClick`) on permission items | [ ] TRUE [ ] FALSE |
| TC-11 | Thinking section renders 5 inline items (Off/Low/Medium/High/Max) matching ThinkingToggle content; selecting one updates state via `onSelect` calling `setThinkingLevel` and closes the menu | AC-10 | manual: open menu, click each thinking level, verify selection updates trigger BrainIcon color and menu closes; grep for `onSelect` on thinking items | [ ] TRUE [ ] FALSE |
| TC-12 | A `ComposerSettingsMenu/` directory exists beside each `ChatComposerControls/` (v1 and v2); each contains `ComposerSettingsMenu.tsx` + `index.ts` | AC-11 | `ls .../v1/.../ChatComposerControls/ComposerSettingsMenu/ && ls .../v2/.../ChatComposerControls/ComposerSettingsMenu/` — both list `ComposerSettingsMenu.tsx` and `index.ts` | [ ] TRUE [ ] FALSE |
| TC-13 | The two `ComposerSettingsMenu.tsx` files are byte-for-byte identical | AC-12 | `diff -q apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/ChatComposerControls/ComposerSettingsMenu/ComposerSettingsMenu.tsx apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/\$workspaceId/hooks/usePaneRegistry/components/ChatPane/components/WorkspaceChatInterface/components/ChatInputFooter/components/ChatComposerControls/ComposerSettingsMenu/ComposerSettingsMenu.tsx` — exits 0 (no difference) | [ ] TRUE [ ] FALSE |
| TC-14 | `ChatComposerControls.tsx` props interface is unchanged in both v1 and v2 vs. main | AC-13 | `git diff main -- '*/ChatComposerControls.tsx'` — props on the exported component are unchanged in both files | [ ] TRUE [ ] FALSE |
| TC-15 | `ModelPicker.tsx`, `PermissionModePicker.tsx`, and `thinking-toggle.tsx` show zero diff vs. main | AC-14 | `git diff main -- '*/ModelPicker.tsx' '*/PermissionModePicker.tsx' 'packages/ui/src/components/ai-elements/thinking-toggle.tsx'` — empty output | [ ] TRUE [ ] FALSE |
| TC-16 | `ChatInputFooter` shows zero diff vs. main in both v1 and v2 | AC-15 | `git diff main -- '*/ChatInputFooter.tsx' '*/ChatInputFooter/index.ts'` — empty output | [ ] TRUE [ ] FALSE |
| TC-17 | `apps/desktop/src/renderer/components/Chat/ChatInterface/styles.ts` shows zero diff vs. main | AC-16 | `git diff main -- apps/desktop/src/renderer/components/Chat/ChatInterface/styles.ts` — empty output | [ ] TRUE [ ] FALSE |
| TC-18 | v1 `ModelPicker.tsx` import line for `chatServiceTrpc` and v2 `ModelPicker.tsx` import line for `workspaceTrpc` both unchanged | AC-17 | `grep -n 'chatServiceTrpc' apps/desktop/src/renderer/components/Chat/ChatInterface/components/ModelPicker/ModelPicker.tsx` (still present) and `grep -n 'workspaceTrpc' apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/\$workspaceId/hooks/usePaneRegistry/components/ChatPane/components/WorkspaceChatInterface/components/ModelPicker/ModelPicker.tsx` (still present) | [ ] TRUE [ ] FALSE |
| TC-19 | Project typecheck passes | AC-18 | `bun run typecheck` exits 0 | [ ] TRUE [ ] FALSE |
| TC-20 | Project lint passes with zero warnings | AC-19 | `bun run lint` exits 0 | [ ] TRUE [ ] FALSE |

<!-- REQUIREMENT-CONTRACT v1
AC-1: Single trigger replaces three pills in v1 + v2 with [ShieldIcon][ProviderLogo][ModelName][BrainIcon]
  verify: manual visual via `bun dev`
AC-2: Trigger h-[23px], model name max-w-[180px] truncate, no ChevronDown
  verify: manual DevTools inspect
AC-3: ShieldIcon variant per permission mode; always text-foreground; optional amber accent for Manual
  verify: manual cycle permission mode + DevTools
AC-4: BrainIcon always rendered; text-muted-foreground when off, text-foreground when on; no layout shift
  verify: manual toggle thinking + DevTools width check
AC-5: Dynamic aria-label; cursor-pointer always; never cursor-not-allowed
  verify: manual DevTools inspect
AC-6: DropdownMenu w-64 with Model / Permission / Thinking sections in that order
  verify: manual click trigger
AC-7: DropdownMenuLabel section headers (3); DropdownMenuSeparator between sections (2)
  verify: manual + grep
AC-8: Model row with ChevronRightIcon; onSelect calls setModelSelectorOpen(true) only; two-phase open
  verify: manual click Model row + grep ComposerSettingsMenu.tsx for onSelect
AC-9: Permission section: 3 inline DropdownMenuItem rows using onSelect calling setPermissionMode
  verify: manual click each + grep
AC-10: Thinking section: 5 inline DropdownMenuItem rows using onSelect calling setThinkingLevel
  verify: manual click each + grep
AC-11: ComposerSettingsMenu/ dir beside each ChatComposerControls/ with .tsx + index.ts
  verify: ls both directories
AC-12: Both ComposerSettingsMenu.tsx files byte-for-byte identical
  verify: diff -q exits 0
AC-13: ChatComposerControls.tsx props interface unchanged in v1 and v2
  verify: git diff main -- '*/ChatComposerControls.tsx'
AC-14: ModelPicker.tsx, PermissionModePicker.tsx, thinking-toggle.tsx zero diff vs main
  verify: git diff main on those paths is empty
AC-15: ChatInputFooter unchanged in v1 and v2
  verify: git diff main on ChatInputFooter files is empty
AC-16: styles.ts unchanged
  verify: git diff main on styles.ts is empty
AC-17: v1 chatServiceTrpc import + v2 workspaceTrpc import both preserved in ModelPicker
  verify: grep on each file
AC-18: bun run typecheck passes
  verify: `bun run typecheck` exits 0
AC-19: bun run lint passes
  verify: `bun run lint` exits 0
AC-20: Trigger Tooltip with full configuration on hover; uses existing packages/ui Tooltip
  verify: manual hover + grep ComposerSettingsMenu.tsx for Tooltip import

TC-1: Maps to AC-1
TC-2: Maps to AC-2
TC-3: Maps to AC-3
TC-4: Maps to AC-4
TC-5: Maps to AC-5
TC-6: Maps to AC-20
TC-7: Maps to AC-6
TC-8: Maps to AC-7
TC-9: Maps to AC-8
TC-10: Maps to AC-9
TC-11: Maps to AC-10
TC-12: Maps to AC-11
TC-13: Maps to AC-12
TC-14: Maps to AC-13
TC-15: Maps to AC-14
TC-16: Maps to AC-15
TC-17: Maps to AC-16
TC-18: Maps to AC-17
TC-19: Maps to AC-18
TC-20: Maps to AC-19
-->

## Out of scope

(verbatim from SCOPE.md)

- Extracting `<ComposerSettingsMenu>` to `packages/ui` (deferred per follow-ups)
- Modifying `ModelPicker`, `PermissionModePicker`, or `ThinkingToggle` internals
- Modifying `ChatInputFooter` or its props
- Modifying `PILL_BUTTON_CLASS` (consumed by other surfaces)
- Storybook stories for `ComposerSettingsMenu` (separate task)
- `apps/web` or `apps/mobile` composer parity

## Risks

(verbatim from SCOPE.md)

- **Two-phase open contract**: Relies on Radix `DropdownMenu`'s `onSelect` auto-close behavior. Standard and documented. Smoke-test: open menu → click Model row → menu closes → ModelPicker Dialog appears. Verify focus returns to trigger briefly before Dialog mounts.
- **Layout shift mitigation**: BrainIcon is always-rendered (binding decision); ShieldIcon is also always-rendered (just changes variant). Trigger width is stable.
- **`ThinkingLevel` and `PermissionMode` types consumed in-place**: `ComposerSettingsMenu` imports `ThinkingLevel` from `@superset/ui` and `PermissionMode` from the desktop renderer's `types.ts`. Cross-package import is fine; type-boundary refactor explicitly deferred.
- **v1 vs v2 trpc divergence**: Not affected — the consolidated menu does not touch trpc.
- **Duplicated `ComposerSettingsMenu.tsx`**: Two byte-identical files per the Rule of 2. When a 3rd consumer appears, promote per follow-up #6.

## Verification posture

Per `~/.claude/CLAUDE.md` Supreme Rule: this task is complete only when each AC is verified against REAL services / a REAL running app.

- Visual + interaction ACs (AC-1 through AC-12, AC-20): launch the Electron desktop app from the worktree (`bun dev` at the repo root or the project's standard dev command), open a chat workspace, exercise the consolidated menu, and observe the behavior matches each AC. Take a screenshot for the completion package.
- Non-regression ACs (AC-13 through AC-17): `git diff main` against the named files MUST show zero output (or only expected changes documented in the AC).
- Command ACs (AC-18, AC-19): `bun run typecheck` and `bun run lint` MUST exit 0 from the worktree.

Stubbed tests (mocked Tooltip, mocked DropdownMenu, "it would work" assertions) are an UNFORGIVABLE SIN per the Supreme Rule. Either verify against the real app or mark the task blocked with concrete evidence.

If a design constraint conflicts with implementation reality (e.g., the Tooltip primitive doesn't compose cleanly with DropdownMenuTrigger inside a Radix tree), document the conflict and propose a scope amendment in SCOPE.md — DO NOT silently deviate.
