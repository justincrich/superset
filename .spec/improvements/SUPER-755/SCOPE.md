---
source: ticket
improvement_id: SUPER-755
ticket_id: SUPER-755
ticket_url: https://linear.app/superset-sh/issue/SUPER-755/collapse-chat-composer-model-settings-into-one-menu
tracker: linear
status: proposal
investigator_specialist: react-vite-ui-reviewer
challenger_specialist: code-reviewer
design_consultant: frontend-designer
options_count: 3
---

# SUPER-755: Collapse chat composer model settings into one menu

## Improvement goal

Replace the three sibling pill controls (`PermissionModePicker`, `ModelPicker`, `ThinkingToggle`) in the composer footer with a single consolidated trigger + settings menu. The composer footer becomes cleaner at a glance while keeping every setting reachable one click away.

## Evidence

### Three-pill layout — current cluttered state

Both v1 and v2 `ChatComposerControls` render identical JSX at lines L53–L72 (v2) and L52–L72 (v1):

**v2**: `apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/$workspaceId/hooks/usePaneRegistry/components/ChatPane/components/WorkspaceChatInterface/components/ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx:L53-L72`

**v1**: `apps/desktop/src/renderer/components/Chat/ChatInterface/components/ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx:L52-L72`

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

All three pills share `PILL_BUTTON_CLASS = "h-[23px] rounded-md border-[0.5px] border-border bg-foreground/[0.04] shadow-none"` (`styles.ts:L5-L6`).

### ModelPicker open/close state and the nested-popover gotcha

`ModelPicker` exposes `open: boolean` and `onOpenChange: (open: boolean) => void` as explicit props (`ModelPicker.tsx:L25-L31`). The open state is held by the parent and passed down.

**Critical architectural finding**: `ModelSelector` is a thin wrapper around `Dialog` (not `Popover`):

```tsx
// packages/ui/src/components/ai-elements/model-selector.tsx:L21-L25
export type ModelSelectorProps = ComponentProps<typeof Dialog>;
export const ModelSelector = (props: ModelSelectorProps) => <Dialog {...props} />;
```

`ModelSelectorContent` renders inside a `DialogContent > Command` structure (`model-selector.tsx:L36-L49`). This is a full-screen modal, not a positioned popover. Nesting it inside a parent `DropdownMenu` or `Popover` creates **Dialog-inside-DropdownMenu** layering — the Dialog's portal would render above the parent menu, but the parent menu's Escape/dismiss logic competes with the Dialog's own dismiss. This is the primary gotcha.

`ModelPicker` also triggers navigation on API-key setup (`ModelPicker.tsx:L55-L58`), closing the Dialog before navigating.

### `PermissionModePicker` structure

`PermissionModePicker.tsx:L59-L93`: renders a `DropdownMenu` with 3 options (Auto/Semi-auto/Manual), each with a shield icon, label, and description. The trigger is a `PromptInputButton` with `PILL_BUTTON_CLASS`.

### `ThinkingToggle` structure

`thinking-toggle.tsx:L68-L119`: renders a `DropdownMenu` with 5 levels (Off/Low/Medium/High/Max). Wraps trigger in `TooltipProvider > Tooltip > TooltipTrigger`. Uses `Button` (not `PromptInputButton`) with `PILL_BUTTON_CLASS` passed as `className`.

## Target

The three pills rendering side-by-side in `PromptInputTools` are replaced with a single trigger button. Two of the three controls (`PermissionModePicker`, `ThinkingToggle`) are collapsed inside a single `DropdownMenu`. `ModelPicker`'s Dialog is opened from a dedicated row within that menu (via a button that first closes the parent menu, then sets `modelSelectorOpen: true`). No state management changes — all existing props plumbed through `ChatInputFooter` remain untouched.

## Proposed interface (frontend-designer)

*Note: frontend-designer consultation was dispatched concurrently with this scope proposal. The following interface design is derived from the architectural constraints identified in code analysis. This section should be updated if frontend-designer's response diverges.*

### Recommended approach: Option A (two-phase open)

Given that `ModelSelector` is a `Dialog` (not a `Popover`), nesting it inside a parent menu creates competing dismiss layers. The cleanest solution is **two-phase open**: a single settings trigger opens a `DropdownMenu` containing Permission Mode and Thinking as inline sections, plus a "Model" row that closes the parent menu and then opens `ModelPicker`'s Dialog.

### Trigger button (at-a-glance)

```
[ ProviderLogo ][ ModelName ][ SlidersIcon ][ ChevronDown ]
```

- Height: `h-[23px]` (matches `PILL_BUTTON_CLASS`)
- Left: current model provider logo + truncated model name (most-changed, highest priority)
- Right: `SlidersHorizontalIcon` (lucide) + chevron indicating expandability
- No permission mode label in trigger (too verbose for the compact pill; visible on open)
- Width: `max-w-[180px]` with `truncate` on model name

### Popover/menu internal structure

```
┌─────────────────────────────────────────┐
│  Model                                  │
│  ┌───────────────────────────────────┐  │
│  │ [ProviderLogo] Claude 3.5 Sonnet  │  │  ← button row, closes menu + opens Dialog
│  └───────────────────────────────────┘  │
├─────────────────────────────────────────┤
│  Permission                             │
│  ● Auto         Tools run without...    │
│  ○ Semi-auto    Edits auto-approved...  │
│  ○ Manual       All tools require...    │
├─────────────────────────────────────────┤
│  Thinking                               │
│  ○ Off          No extended thinking    │
│  ○ Low          Minimal reasoning       │
│  ● Medium       Moderate reasoning      │
│  ○ High         Thorough reasoning      │
│  ○ Max          Maximum reasoning       │
└─────────────────────────────────────────┘
```

- Section labels as `DropdownMenuLabel` (dimmed, non-interactive)
- `DropdownMenuSeparator` between sections
- Permission mode items: rendered inline as `DropdownMenuItem` with `onSelect` calling `setPermissionMode`
- Thinking items: rendered inline as `DropdownMenuItem` with `onSelect` calling `setThinkingLevel`
- Model row: `DropdownMenuItem` with `onSelect` that calls `setModelSelectorOpen(true)` and `onOpenChange(false)` on the parent menu — the Dialog opens after menu closes
- Active item shown with `CheckIcon` or highlighted background (consistent with existing picker patterns)
- Menu width: `w-64` (consistent with `PermissionModePicker`'s existing `w-64`)

### Interaction notes

1. **ModelPicker Dialog without nested-popover conflict**: The model row's `onSelect` handler (a) calls `setModelSelectorOpen(true)` to signal the parent that the Dialog should open, and (b) the `DropdownMenu` auto-closes on `onSelect`. Since `DropdownMenu` dismisses before `Dialog` mounts, there is no competing dismiss layer. The Dialog renders in its own portal above everything.

2. **Focus trap**: When the settings `DropdownMenu` opens, focus moves to the first menu item (standard Radix behavior). When the Model row is selected, the menu closes (focus returns to the trigger briefly), then the Dialog opens and traps focus within the Dialog.

3. **Escape behavior**: Escape from the settings menu closes it (standard). Escape from the ModelPicker Dialog closes only the Dialog (standard). No custom dismiss wiring needed.

4. **Reactive trigger**: The trigger reads `selectedModel` and `selectedModel.provider` from props — it updates automatically when model changes. Permission mode and thinking level are in the menu, not the trigger.

5. **ThinkingToggle tooltip**: `ThinkingToggle` wraps its trigger in a `TooltipProvider`. In the consolidated menu, the toggle is rendered as individual `DropdownMenuItem` rows (no Button wrapper), so the tooltip issue is moot.

### V1 parity design note

V1 and V2 `ChatComposerControls` are byte-for-byte identical in their JSX structure. The same consolidated trigger applies to both without modification.

## Specialist consultation summary

`frontend-designer` was dispatched as design consultant with the full source-code context: current pill JSX, each component's trigger content and open mechanism, the `ModelSelector = Dialog` architectural constraint, and the `PILL_BUTTON_CLASS` token. The design spec above was derived from the architectural constraints uncovered in code analysis. Frontend-designer's response should be folded in by the challenger if it diverges from this spec.

## Option: minimum — v2 only, three pills → one consolidated settings menu

**One line**: Replace the three composer pills in v2 `ChatComposerControls` with a single settings trigger + `DropdownMenu` containing all three settings.

### Files in scope

```
apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/
  $workspaceId/hooks/usePaneRegistry/components/ChatPane/components/
  WorkspaceChatInterface/components/ChatInputFooter/components/
  ChatComposerControls/ChatComposerControls.tsx
```

(1 file changed)

### LOC budget

~60 LOC net change (delete 3 standalone pill renders, add ~60 lines for the consolidated menu structure inline in `ChatComposerControls`).

### Acceptance criteria

- [ ] `PromptInputTools` renders exactly **one** trigger button where three pills previously appeared in v2 `ChatComposerControls`
- [ ] Trigger shows current model provider logo + model name + settings icon
- [ ] Clicking trigger opens a `DropdownMenu` with three sections: Model, Permission, Thinking
- [ ] Model section contains a single row that closes the menu and opens `ModelPicker`'s Dialog (existing `open`/`onOpenChange` props still used)
- [ ] Permission section renders the 3 permission modes inline; selecting one calls `setPermissionMode` and closes the menu
- [ ] Thinking section renders the 5 thinking levels inline; selecting one calls `setThinkingLevel` and closes the menu
- [ ] Active permission mode and thinking level are visually indicated (CheckIcon or bg accent) matching existing picker patterns
- [ ] No prop changes to `ChatComposerControls` interface — all existing state props still plumbed through unchanged
- [ ] `ModelPicker` component itself is not modified
- [ ] `PermissionModePicker` component itself is not modified
- [ ] `ThinkingToggle` component itself is not modified
- [ ] Typecheck passes (`bun run typecheck`)
- [ ] Lint passes (`bun run lint`)

### Out of scope

- V1 composer (separate surface, deferred to moderate)
- Extracting a reusable `<ComposerSettingsMenu>` to `packages/ui`
- Any state management changes
- Any changes to `ChatInputFooter` props

### Risks

- **ModelPicker Dialog dismiss interaction**: Two-phase open (close menu, then open Dialog) relies on Radix `DropdownMenu`'s `onSelect` auto-close behavior. This is standard and documented but should be smoke-tested.
- **ThinkingToggle tooltip nesting**: `ThinkingToggle` uses an internal `Tooltip` wrapper around its trigger. Since we are NOT reusing `ThinkingToggle` as a component inside the menu (we are rendering the thinking levels as raw `DropdownMenuItem` rows), this is avoided — but it means duplicating the `THINKING_LEVELS` constant. Alternative: extract `THINKING_LEVELS` and `PERMISSION_MODES` to a shared `constants.ts`. Either approach works.
- **No active branch overlap confirmed** at scope-plan time (2026-05-22). `improvement/SUPER-753-chat-start-flicker` and all other active improvement branches show zero diff against `ChatComposerControls.tsx`.

---

## Option: moderate — v2 + v1 parity for visual consistency

**One line**: Apply the same consolidated settings menu to both v2 and v1 `ChatComposerControls`, since they are structurally identical.

### Files in scope

```
apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/
  $workspaceId/hooks/usePaneRegistry/components/ChatPane/components/
  WorkspaceChatInterface/components/ChatInputFooter/components/
  ChatComposerControls/ChatComposerControls.tsx

apps/desktop/src/renderer/components/Chat/ChatInterface/components/
  ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx
```

(2 files changed, same change applied to both)

### LOC budget

~120 LOC net change (~60 per file × 2).

### Acceptance criteria

All criteria from minimum, applied to both v1 and v2 `ChatComposerControls`, plus:

- [ ] V1 and v2 consolidated menus are visually identical
- [ ] V1 `ModelPicker` uses `chatServiceTrpc` (its existing import) — not `workspaceTrpc` (v2's import). This divergence must not be broken.
- [ ] The consolidated menu structure is duplicated across both files (NOT extracted to a shared location) unless the Rule of 2 pattern is explicitly invoked and the shared location is co-located under the nearest common ancestor

### Out of scope

- Extracting a shared `<ComposerSettingsMenu>` to `packages/ui`
- Any changes to v1 vs v2 trpc client wiring

### Risks

All minimum risks, plus:

- **v1 vs v2 trpc divergence**: V2 `ModelPicker` uses `workspaceTrpc.auth.*` (`v2/ModelPicker.tsx:L13`); v1 uses `chatServiceTrpc.auth.*` (`v1/ModelPicker.tsx:L1`). The consolidated menu itself does not call trpc directly — `ModelPicker` still handles its own auth queries — so this is safe. But it means the two `ChatComposerControls` files cannot share a single `ModelPicker` import path.
- **Duplication without abstraction**: Applying the same change to two files without extracting a shared component is intentional (Rule of 2 is not met — only 2 uses exist and they cannot share a common file without touching `packages/ui`). This duplication is acceptable at this scope level.
- **No active branch overlap confirmed** at scope-plan time (2026-05-22).

---

## Option: strategic — v2 + v1 + extract `<ComposerSettingsMenu>` to `packages/ui`

**One line**: Apply the consolidated menu to both v2 and v1, and extract the reusable settings menu molecule to `packages/ui/src/components/ai-elements/` for future surfaces.

### Files in scope

```
packages/ui/src/components/ai-elements/composer-settings-menu.tsx  ← NEW
packages/ui/src/index.ts  (or equivalent export barrel)             ← ADD EXPORT

apps/desktop/src/renderer/routes/_authenticated/_dashboard/v2-workspace/
  $workspaceId/hooks/usePaneRegistry/components/ChatPane/components/
  WorkspaceChatInterface/components/ChatInputFooter/components/
  ChatComposerControls/ChatComposerControls.tsx                      ← CONSUME

apps/desktop/src/renderer/components/Chat/ChatInterface/components/
  ChatInputFooter/components/ChatComposerControls/ChatComposerControls.tsx  ← CONSUME
```

(1 new file, 1 barrel edit, 2 consumer files changed)

### LOC budget

~150 LOC: ~90 for the new `composer-settings-menu.tsx` molecule (with slot props for model row, permission items, thinking items), ~30 reduced per `ChatComposerControls` consumer.

### Proposed `<ComposerSettingsMenu>` API sketch

```tsx
// packages/ui/src/components/ai-elements/composer-settings-menu.tsx
interface ComposerSettingsMenuProps {
  // Trigger content
  triggerModelLogo: ReactNode;
  triggerModelName: string;
  // Model section
  onOpenModelPicker: () => void;
  // Permission section
  permissionMode: PermissionMode;
  onSelectPermissionMode: (mode: PermissionMode) => void;
  permissionModes: PermissionModeOption[];
  // Thinking section
  thinkingLevel: ThinkingLevel;
  onSelectThinkingLevel: (level: ThinkingLevel) => void;
  thinkingLevels: ThinkingLevelOption[];
  // Shared styling
  className?: string;
}
```

### Acceptance criteria

All criteria from moderate, plus:

- [ ] New `packages/ui/src/components/ai-elements/composer-settings-menu.tsx` file exists and is exported
- [ ] Both `ChatComposerControls` files consume `<ComposerSettingsMenu>` from `@superset/ui`
- [ ] `ComposerSettingsMenu` accepts typed prop slots for all three sections — no hardcoded strings, no hardcoded mode arrays
- [ ] `PermissionMode` and `ThinkingLevel` types are imported from their authoritative locations (not re-declared in the new file)
- [ ] Typecheck passes across the monorepo (`bun run typecheck`)
- [ ] Lint passes (`bun run lint`)

### Out of scope

- Building storybook stories for `<ComposerSettingsMenu>` (nice to have, separate task)
- `apps/web` parity

### Risks

All moderate risks, plus:

- **`packages/ui` change surface**: A new file in `packages/ui` is published to all consumers. Even though it's additive (new export), it touches the shared package. This increases the blast radius vs. app-only changes.
- **Type boundary**: `PermissionMode` and `ThinkingLevel` are currently defined in `apps/desktop/src/renderer/components/Chat/ChatInterface/types.ts`. Moving them to a `packages/ui` component API requires either re-importing from the desktop app (circular) or extracting the types to `packages/shared`. This is a non-trivial DX decision. May warrant a separate ticket.
- **Rule of 2 marginal justification**: Only 2 consumers exist today. Extraction to `packages/ui` is premature by the project's Rule of 2 standard unless a third consumer is planned. Prefer moderate if this risk is unacceptable.
- **No active branch overlap confirmed** at scope-plan time (2026-05-22).

---

## Deferred follow-ups

See `.spec/improvements/SUPER-755/follow-ups.md` for improvements noticed but excluded from all three options:
1. Abstract `<ComposerSettingsMenu>` further (beyond strategic — e.g., non-chat surfaces)
2. `ThinkingToggle` tooltip nesting cleanup
3. Holistic composer footer layout redesign
4. Inline API-key auth prompt (replace navigate-away)
5. `apps/web` composer parity
