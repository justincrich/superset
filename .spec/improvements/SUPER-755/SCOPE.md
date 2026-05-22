---
source: ticket
improvement_id: SUPER-755
ticket_id: SUPER-755
ticket_url: https://linear.app/superset-sh/issue/SUPER-755/collapse-chat-composer-model-settings-into-one-menu
tracker: linear
status: binding
chosen_option: moderate
loc_budget: 120
task_chunks: 1
investigator_specialist: react-vite-ui-reviewer
challenger_specialist: code-reviewer
design_consultant: frontend-designer
binding_decisions:
  permission_indicator_in_trigger: true
  brain_icon_mode: always-visible-dimmed-when-off
  composition_pattern: local-extract-per-composer-dir
  v1_v2_parity: same-PR
---

# SUPER-755: Collapse chat composer model settings into one menu

## Improvement goal

Replace the three sibling pill controls (`PermissionModePicker`, `ModelPicker`, `ThinkingToggle`) in BOTH the v1 and v2 chat composer footers with a single consolidated trigger + settings menu. The composer footer becomes cleaner at a glance while keeping every setting reachable one click away. Presentation-only refactor — no state plumbing changes.

## Evidence

### Three-pill layout — current cluttered state

Both v1 and v2 `ChatComposerControls` render structurally-identical JSX inside `<PromptInputTools>`:

- **v2**: `apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/ChatPane/components/WorkspaceChatInterface/components/ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx` — pills at L56–L71 (PromptInputTools opens L55, closes L72)
- **v1**: `apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx` — pills at L53–L68 (PromptInputTools opens L52, closes L69)

```tsx
<PromptInputTools className="gap-1.5">
  <PermissionModePicker
    selectedMode={permissionMode}
    onSelectMode={setPermissionMode}
  />
  <ModelPicker
    models={availableModels}
    selectedModel={selectedModel}
    onSelectModel={setSelectedModel}
    open={modelSelectorOpen}
    onOpenChange={setModelSelectorOpen}
  />
  <ThinkingToggle
    level={thinkingLevel}
    onLevelChange={setThinkingLevel}
    className={PILL_BUTTON_CLASS}
  />
</PromptInputTools>
```

All three pills share `PILL_BUTTON_CLASS = "h-[23px] rounded-md border-[0.5px] border-border bg-foreground/[0.04] shadow-none"` (`apps/desktop/src/renderer/components/Chat/ChatInterface/styles.ts:L5-L6`).

### Hard architectural constraint: ModelSelector is a Dialog, not a Popover

`packages/ui/src/components/ai-elements/model-selector.tsx:L21-L24`:

```tsx
export type ModelSelectorProps = ComponentProps<typeof Dialog>;
export const ModelSelector = (props: ModelSelectorProps) => <Dialog {...props} />;
```

`ModelPicker` exposes `open`/`onOpenChange` props (`ModelPicker.tsx:L28-L29`). Because this is a Dialog (not a Popover), nesting it inside the consolidated `DropdownMenu` would create competing dismiss layers. The binding design uses two-phase open (described in Target below).

### Type locations (correcting an SCOPE.md v1 imprecision)

- `ThinkingLevel` is defined in `packages/ui/src/components/ai-elements/thinking-toggle.tsx:L20` (already in `packages/ui`)
- `PermissionMode` is defined in `apps/desktop/src/renderer/components/Chat/ChatInterface/types.ts` (desktop-app-local)

Both types are consumed by the binding scope **as-is** — no migration in this PR.

## Target

The three pills rendering side-by-side in `PromptInputTools` are replaced by a single trigger button that opens a `DropdownMenu` containing all three settings. The `ModelPicker` Dialog is opened from a dedicated row in that menu via two-phase open: `DropdownMenu`'s `onSelect` auto-closes the menu, then the Dialog opens on the next tick. No state-management changes — all existing props plumbed through `ChatInputFooter` (v1 and v2) remain untouched.

## Binding scope (chosen: moderate)

### Acceptance criteria

#### Trigger button visual (binding decisions from human decision phase)

- [ ] **AC-1**: The single trigger button replaces the three pills in BOTH v1 and v2 `ChatComposerControls.tsx` (visible content: `[ShieldIcon for active permission mode][ProviderLogo][ModelName][BrainIcon — dimmed when thinkingLevel === 'off', full opacity otherwise]`)
- [ ] **AC-2**: Trigger height matches `PILL_BUTTON_CLASS` (`h-[23px]`); model name truncates with `max-w-[180px]`; NO ChevronDown (aria-expanded covers a11y)
- [ ] **AC-3**: ShieldIcon variant reflects active permission mode (Auto / Semi-auto / Manual) — match the icon set used inside `PermissionModePicker`
- [ ] **AC-4**: BrainIcon is ALWAYS rendered in the trigger; `opacity-40` when `thinkingLevel === 'off'`, `opacity-100` otherwise — no presence/absence layout shift
- [ ] **AC-5**: Trigger has `aria-label` describing the consolidated control (e.g., "Chat settings: model, permission, thinking") and standard keyboard activation

#### Menu structure

- [ ] **AC-6**: Clicking the trigger opens a `DropdownMenu` (`w-64`) with three sections in this order: **Model**, **Permission**, **Thinking**
- [ ] **AC-7**: Section headers use `DropdownMenuLabel` (no custom styling); 2 `DropdownMenuSeparator` between the 3 sections
- [ ] **AC-8**: Model section: ONE `DropdownMenuItem` row showing `[ProviderLogo][ModelName...truncate][ChevronRightIcon]`. `onSelect` calls `setModelSelectorOpen(true)` only — Radix auto-closes the parent menu, then the Dialog mounts (two-phase open). No manual `setMenuOpen(false)` needed.
- [ ] **AC-9**: Permission section: 3 inline `DropdownMenuItem` rows (Auto / Semi-auto / Manual), each with shield icon + label + description, matching existing `PermissionModePicker` content. Use `onSelect` (not `onClick`) calling `setPermissionMode`. Active item shown with `CheckIcon` or accent bg.
- [ ] **AC-10**: Thinking section: 5 inline `DropdownMenuItem` rows (Off / Low / Medium / High / Max), matching existing `ThinkingToggle` content. Use `onSelect` calling `setThinkingLevel`. Active item shown with `CheckIcon` or accent bg.

#### Composition pattern

- [ ] **AC-11**: A new `ComposerSettingsMenu/` directory is co-located beside each `ChatComposerControls/` dir (NOT inline in the parent file). One per composer surface: v1 `.../ChatInputFooter/components/ChatComposerControls/ComposerSettingsMenu/` and v2 `.../ChatInputFooter/components/ChatComposerControls/ComposerSettingsMenu/`. Each contains `ComposerSettingsMenu.tsx` + `index.ts`.
- [ ] **AC-12**: Both `ComposerSettingsMenu` files are byte-for-byte identical content (the v1 and v2 contexts pass identical-shape props). They are NOT extracted to a shared location in this PR.

#### Non-regression

- [ ] **AC-13**: `ChatComposerControls.tsx` props interface unchanged in both v1 and v2 (same inbound props from `ChatInputFooter`)
- [ ] **AC-14**: `ModelPicker.tsx`, `PermissionModePicker.tsx`, and `packages/ui/.../thinking-toggle.tsx` are NOT modified
- [ ] **AC-15**: `ChatInputFooter` is NOT modified in either v1 or v2 (same props plumbed through)
- [ ] **AC-16**: `apps/desktop/.../ChatInterface/styles.ts` (PILL_BUTTON_CLASS) is NOT modified
- [ ] **AC-17**: v1 `ModelPicker` keeps its `chatServiceTrpc` import; v2 keeps its `workspaceTrpc` import — divergence preserved (the consolidated menu never touches trpc directly)
- [ ] **AC-18**: `bun run typecheck` passes
- [ ] **AC-19**: `bun run lint` passes (warnings = errors per Biome CI policy)

### Files in scope

```
apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/
  $workspaceId/hooks/usePaneRegistry/components/ChatPane/components/
  WorkspaceChatInterface/components/ChatInputFooter/components/
  ChatComposerControls/ChatComposerControls.tsx                          ← MODIFY
  ChatComposerControls/ComposerSettingsMenu/ComposerSettingsMenu.tsx     ← NEW
  ChatComposerControls/ComposerSettingsMenu/index.ts                     ← NEW

apps/desktop/src/renderer/components/Chat/ChatInterface/components/
  ChatInputFooter/components/
  ChatComposerControls/ChatComposerControls.tsx                          ← MODIFY
  ChatComposerControls/ComposerSettingsMenu/ComposerSettingsMenu.tsx     ← NEW
  ChatComposerControls/ComposerSettingsMenu/index.ts                     ← NEW
```

6 files total: 2 modified, 4 new. New files are 2 byte-for-byte-identical `ComposerSettingsMenu.tsx` (one per composer surface) plus 2 `index.ts` barrels.

### LOC budget

~120 LOC net change (~60 per surface). Each `ChatComposerControls.tsx` loses ~20 lines (the three-pill block) and gains ~5 lines (single `<ComposerSettingsMenu>` consumer). Each `ComposerSettingsMenu.tsx` adds ~60 lines. Each `index.ts` adds ~1 line.

### Out of scope

- Extracting `<ComposerSettingsMenu>` to `packages/ui` (deferred per follow-ups)
- Modifying `ModelPicker`, `PermissionModePicker`, or `ThinkingToggle` internals
- Modifying `ChatInputFooter` or its props
- Modifying `PILL_BUTTON_CLASS` (consumed by other surfaces)
- Tooltips on the consolidated trigger (the icons are self-evident; tooltips can be a follow-up)
- Storybook stories for `ComposerSettingsMenu` (separate task)
- `apps/web` or `apps/mobile` composer parity

### Risks

- **Two-phase open contract**: Relies on Radix `DropdownMenu`'s `onSelect` auto-close behavior. Standard and documented. Smoke-test: open menu → click Model row → menu closes → ModelPicker Dialog appears. Verify focus returns to trigger briefly before Dialog mounts.
- **Layout shift mitigation**: BrainIcon is always-rendered (binding decision); ShieldIcon is also always-rendered (just changes variant). Trigger width is stable.
- **`ThinkingLevel` and `PermissionMode` types consumed in-place**: `ComposerSettingsMenu` imports `ThinkingLevel` from `@superset/ui` and `PermissionMode` from the desktop renderer's `types.ts`. Cross-package import is fine; type-boundary refactor explicitly deferred.
- **v1 vs v2 trpc divergence**: Not affected — the consolidated menu does not touch trpc.
- **Duplicated `ComposerSettingsMenu.tsx`**: Two byte-identical files per the Rule of 2 (2 consumers; extraction to `packages/ui` deferred). When a 3rd consumer appears, promote per follow-up #6.
- **No active branch overlap confirmed** at scope-plan time (2026-05-22). Verified against all `improvement/*`, `super-*`, and `chat-*` branches: zero diffs on the in-scope files.

## Considered alternatives (rejected)

### minimum — v2 only

Rejected: would leave v1 visually inconsistent with v2. Since both composers are structurally identical, the same change cost only doubles file-count (not LOC complexity) for full parity. Visual inconsistency on a presentation-only refactor is not worth the deferred-work bookkeeping.

### strategic — extract to `packages/ui`

Rejected: Rule of 2 violation. Only 2 consumers exist today, both inside `apps/desktop`. Extracting to `packages/ui` requires resolving the `PermissionMode` type-boundary (move to `packages/shared`) — a non-trivial DX decision that warrants a separate ticket. Defer until a 3rd consumer (likely `apps/web` or `apps/mobile`) appears. Captured as follow-up #6.

### challenger Candidate C — partial 2-of-3 collapse (keep Model as own pill)

Rejected: ticket explicitly says "collapse these into a single consolidated menu." Partial collapse does not satisfy the stated intent. Documented in `## Challenge`.

## Challenger notes (preserved from adversarial review)

- All cited file:line references verified against actual code.
- No smaller-than-minimum option exists; 3 candidates evaluated and rejected.
- Minimum proves problem resolved: TRUE.
- moderate has NO hidden scope creep — genuinely 2 `ChatComposerControls.tsx` files only (no `ChatInputFooter`, no picker internals, no `styles.ts`).
- strategic LOC budget was plausible but the type-boundary risk was overstated in v1 (`ThinkingLevel` is already in `packages/ui`).
- frontend-designer's Option B (local extract) was folded into moderate as the binding implementation choice (AC-11/AC-12).

## Frontend-designer refinements (folded into binding ACs)

- ChevronDown removed from trigger → AC-2
- BrainIcon always-visible (dimmed when off) per human decision Q2 → AC-4 (overrides frontend-designer's "conditional" preference)
- ChevronRightIcon on Model row → AC-8
- `DropdownMenuLabel` section headers + 2 separators → AC-7
- `onSelect` throughout → AC-9, AC-10
- Local co-located extraction → AC-11, AC-12

## Open questions resolved (from frontend-designer §7)

- Q1 (permission in trigger) → **YES**, ShieldIcon added → AC-1, AC-3
- Q2 (BrainIcon threshold) → **always-visible-dimmed-when-off** → AC-4
- Q3 (ChevronDown) → removed → AC-2
- Q4 (model name truncation in menu) → `truncate` with no fixed `max-w`; implementer verifies in running UI
- Q5 (`onSelect` vs `onClick`) → `onSelect` throughout → AC-9, AC-10

## Scope amendments

(empty — populated during implementation if the contract genuinely needs to change)

## Deferred follow-ups

See `.spec/improvements/SUPER-755/follow-ups.md` for 7 captured deferrals, including the eventual `packages/ui` extraction (follow-up #6, triggered by a 3rd consumer), the tooltip nesting cleanup, holistic composer redesign, and `apps/web` parity.
