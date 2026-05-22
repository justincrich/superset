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

---

## Frontend-designer review (independent design pass)

*Independent design review authored by frontend-designer from direct code inspection. The investigator's `## Proposed interface (frontend-designer)` section above is preserved intact for comparison.*

---

### 1. Verdict on investigator's existing proposal

**confirmed-with-refinements**

The investigator's two-phase open approach is architecturally correct and the menu sections (Model / Permission / Thinking) are ordered sensibly. The refinements here focus on three areas the investigator left underspecified: (a) the trigger's visual hierarchy, (b) the interaction contract for the two-phase open sequence against Radix's actual behavior, and (c) stronger accessibility and hover/focus-state guidance that aligns with the existing `PILL_BUTTON_CLASS` token instead of adding custom widths.

---

### 2. Trigger button design

**Which setting is most important at-a-glance?**

The model name is the highest-signal datum at a glance — it changes more frequently than permission mode (which most users set once) and is more legible at small sizes than thinking level. Permission mode is secondary; surfacing it in the trigger would require a second icon that competes with the provider logo and makes the pill read as two controls in one. The thinking indicator can appear as a subtle accent on the `BrainIcon` (filled vs. outline) only when thinking is active, keeping the trigger quiet when off.

**Trigger anatomy**

```
┌──────────────────────────────────────────┐
│ [ProviderLogo] Model Name   [BrainIcon?] │
└──────────────────────────────────────────┘
```

- `[ProviderLogo]` — `size-3` img, same rendering as existing `ModelPicker` trigger (Anthropic uses `claudeIcon`, others use `ModelSelectorLogo`)
- `Model Name` — `text-xs`, `truncate`, `flex-1`, `min-w-0`; no `ChevronDown` (saves 12px; the icon+pill affordance already implies a menu)
- `[BrainIcon?]` — `BrainIcon` from lucide, `size-3.5`; shown only when `thinkingLevel !== "off"`, colored `text-foreground` (vs. `opacity-60` when off). This communicates "thinking is active" without a label. When `thinkingLevel === "off"`, omit the icon entirely rather than showing a dimmed brain — zero visual noise when the feature is inactive.

**No `ChevronDownIcon`**: The investigator includes it. In a 23px-tall pill, adding both a provider logo and a chevron adds clutter. The `DropdownMenuTrigger`'s `aria-expanded` state is sufficient for assistive technology; sighted users interpret the pill+icon group as interactive by convention. Removing the chevron recovers ~12px for the model name on narrow panes.

**Height and max-width**

- Height: `h-[23px]` — matches `PILL_BUTTON_CLASS` exactly, no override needed
- Max-width: do NOT set a hard `max-w-[180px]`; instead use `max-w-[160px]` on the model name span with `truncate`. The pill itself should be `w-auto` so it shrinks naturally in narrow pane layouts without overflowing.

**Classes for the trigger button**

```tsx
className={cn(
  PILL_BUTTON_CLASS,
  "px-2 gap-1.5 text-xs text-foreground",
  // no extra max-w override — let the name span truncate
)}
```

**Hover / focus states**

`PromptInputButton` (used by `ModelPicker` and `PermissionModePicker`) inherits from `InputGroupButton` which extends `Button` with `variant="ghost"`. Ghost variant already provides `hover:bg-accent hover:text-accent-foreground` and `focus-visible:ring-2 focus-visible:ring-ring`. No custom hover classes needed — consistent with all three existing pills.

**ASCII trigger sketch**

```
Normal (thinking off):
┌───────────────────────────────┐
│ ◉  Claude 3.5 Sonnet          │  h-[23px], text-xs
└───────────────────────────────┘

Active thinking:
┌───────────────────────────────┐
│ ◉  Claude 3.5 Sonnet  🧠     │  BrainIcon fills text-foreground
└───────────────────────────────┘

Narrow pane (name truncates):
┌─────────────────────┐
│ ◉  Claude 3.5 S…   │
└─────────────────────┘
```

**Accessibility**

- `aria-label`: Not needed on the trigger itself — the visible text (model name) is already the accessible label. Screen readers will announce "Claude 3.5 Sonnet, collapsed" from the `aria-expanded` + button role.
- `role`: Inherits `button` from `PromptInputButton`. The `DropdownMenuTrigger asChild` pattern passes through ARIA attributes correctly.
- Keyboard activation: `Enter` / `Space` opens the menu (standard Radix behavior).
- When thinking is active, the `BrainIcon` should carry `aria-label="Extended thinking active"` as a visually-hidden but screen-reader-visible label: `<BrainIcon aria-label="Extended thinking active" className="size-3.5" />`.

---

### 3. Menu/popover internal structure

**Section ordering rationale**

Model first because it is the most-changed setting and the trigger already previews it — the user opening the menu is most likely doing so to switch models. Permission and Thinking follow in descending frequency of change.

**Full layout (w-64, same as existing `PermissionModePicker` content width)**

```
┌──────────────────────────────────────────────┐
│ Model                        [DropdownLabel] │  px-2 py-1 text-xs text-muted-foreground
├──────────────────────────────────────────────┤
│  ◉  Claude 3.5 Sonnet       [DropdownItem]  │  provider logo + name + ChevronRight
│     (click → close menu, open Dialog)        │
├──────────────────────────────────────────────┤  DropdownMenuSeparator
│ Permission                   [DropdownLabel] │
├──────────────────────────────────────────────┤
│  🛡  Auto                                    │  ✓ if active
│     Tools run without approval               │
│  🛡✓ Semi-auto                               │
│     Edits auto-approved, others need...      │
│  🛡  Manual                                  │
│     All tools require approval               │
├──────────────────────────────────────────────┤  DropdownMenuSeparator
│ Thinking                     [DropdownLabel] │
├──────────────────────────────────────────────┤
│  Off       No extended thinking              │  ✓ if active
│  Low       Minimal reasoning effort          │
│  Medium    Moderate reasoning effort         │
│  High      Thorough reasoning effort         │
│  Max       Maximum reasoning effort          │
└──────────────────────────────────────────────┘
```

**Section headers**: `DropdownMenuLabel` with default styling — `px-2 py-1.5 text-xs font-semibold text-muted-foreground`. No custom styling needed; this matches the Radix default and is consistent across the design system.

**Active selection indicator**: `CheckIcon` at the end of each item row, `size-4 shrink-0`, shown only when active. This matches the pattern in `PermissionModePicker` and `ThinkingToggle` exactly. Do NOT use background highlight as the sole indicator — the `CheckIcon` is screen-reader friendly and visually unambiguous.

**Model row specifics**: Rendered as a `DropdownMenuItem`. Because it opens a Dialog, it should carry a `ChevronRightIcon` at the far right (not a `CheckIcon`) to signal "this opens another layer." The provider logo and current model name match the trigger display. Width-constrained model name should use `truncate flex-1 min-w-0`.

```
│ [Logo] Claude 3.5 Sonnet    [ChevronRight] │
```

**Thinking section — no Button wrapper**: Render each thinking level as a raw `DropdownMenuItem` with `onSelect`. The `ThinkingToggle` component's internal `DropdownMenu` + `TooltipProvider` are NOT reused — we render the `THINKING_LEVELS` constant directly. The constants `THINKING_LEVELS` and `PERMISSION_MODES` should be imported from their source files or duplicated locally in `ChatComposerControls`. Given they are small, stable arrays, co-location duplication is acceptable for minimum/moderate options. If strategic (Option C) is chosen, they belong as exported constants in `composer-settings-menu.tsx`.

**ThinkingToggle's tooltip**: Moot in this context. The `ThinkingToggle` tooltip (`TooltipProvider > Tooltip > TooltipTrigger`) wraps its trigger button. Since we are rendering thinking levels as raw `DropdownMenuItem` rows — not composing `ThinkingToggle` as a child — there is no tooltip nesting issue. The tooltip from `ThinkingToggle` disappears by construction.

**Menu padding**: Default `p-1` from `DropdownMenuContent` class is correct. Do not increase — it would add visual weight to an already dense menu.

**Separators**: One `DropdownMenuSeparator` after the Model section and one after the Permission section. Three separators total would over-divide a compact menu; two is the right balance.

---

### 4. Interaction notes

**Two-phase open sequence — precise Radix behavior**

Radix `DropdownMenu` closes on `onSelect` by default. The exact event order is:

1. User clicks the Model row (`DropdownMenuItem` fires `onSelect`)
2. Radix fires the `onSelect` callback synchronously
3. Inside `onSelect`: call `setModelSelectorOpen(true)`
4. Radix then closes the `DropdownMenu` after `onSelect` returns (it calls `onOpenChange(false)` on the Root internally)
5. `DropdownMenu` unmounts its portal
6. On the next React render cycle: `modelSelectorOpen === true` → `ModelSelector` (Dialog) mounts its portal

**Key implication**: Do NOT call `setOpen(false)` on the parent `DropdownMenu` manually inside `onSelect`. Radix handles menu dismissal automatically on any `onSelect` that does not call `e.preventDefault()`. Calling both `setOpen(false)` and `setModelSelectorOpen(true)` in the same handler is safe but the `setOpen(false)` is redundant. Only `setModelSelectorOpen(true)` is needed.

```tsx
// Correct handler for the Model row's onSelect
onSelect={() => {
  setModelSelectorOpen(true);
  // Radix auto-closes the DropdownMenu after onSelect returns
  // No e.preventDefault() — that would block auto-close
}}
```

**Focus management**

- Menu opens: Radix moves focus to first `DropdownMenuItem` (the Model row).
- User navigates with arrow keys: standard Radix behavior across all items.
- User selects Model row: menu closes (Radix returns focus to trigger), then Dialog mounts and traps focus. The brief focus-on-trigger is imperceptible.
- User selects Permission or Thinking item: menu closes, focus returns to trigger.
- Trigger remains focused after any selection — user can press Enter/Space to reopen immediately.

**Escape behavior**

- Escape from open menu: closes menu, focus returns to trigger. Standard Radix.
- Escape from ModelPicker Dialog: closes Dialog only. The parent menu is already closed. Standard Radix Dialog behavior. No custom wiring needed.
- Double-Escape (menu → Dialog in sequence): not possible since menu closes before Dialog opens (two-phase).

**Click-outside behavior**

- Click outside open menu: closes menu (Radix default). Note: `DropdownMenu` is initialized with `modal={false}` in this project's shadcn preset (`dropdown-menu.tsx:L10`). This means clicks outside do NOT block page interaction — correct for a composer context where the user might click elsewhere in the chat.
- Click outside ModelPicker Dialog: closes Dialog (standard `DialogContent` behavior — click on overlay fires `onOpenChange(false)`).

**Loading / disabled states**

- When `availableModels` is empty (still fetching): the Model row should show the trigger's current `selectedModel?.name ?? "Model"` with the same logo, but the `ChevronRightIcon` remains — opening an empty Dialog is acceptable (it already shows `ModelSelectorEmpty`).
- When `selectedModel === null`: show a `SlidersHorizontalIcon` fallback instead of a provider logo in the trigger. Keep the Model row functional — clicking it opens the Dialog to let the user pick a model.
- No `disabled` state on the consolidated trigger itself is needed — the existing behavior (all three pills always enabled) is preserved.

**Mobile/narrow-window**

The composer footer is desktop-only (`apps/desktop`). Mobile has its own chat surface (`apps/mobile`). Narrow-pane layouts (e.g., a 240px side pane) are addressed by the `truncate` class on the model name span — the pill shrinks gracefully without layout breaks.

---

### 5. V1 vs V2 parity recommendation

**Recommendation: same PR (moderate option)**

V1 and V2 `ChatComposerControls` are byte-for-byte identical in their JSX structure and props interface. Applying the change to both in the same PR costs ~60 LOC (duplicated change) and eliminates the risk of a user seeing the old three-pill layout in v1 after v2 has been updated. The `ModelPicker` import path differs between v1 and v2 (`workspaceTrpc` vs `chatServiceTrpc`) but this is inside `ModelPicker` itself — `ChatComposerControls` passes `open`/`onOpenChange` in both versions, so the consolidated menu code is identical.

**V1-specific divergence to note**: V1's `ModelPicker` is at `../../../ModelPicker` (relative) while v2 is at `../../../ModelPicker` from a different base. The consolidated menu code in each `ChatComposerControls` references `ModelPicker` from the same relative path as before — no import changes required. The difference is invisible to the menu implementation.

**Verdict**: Defer v1 only if the team has a specific risk reason (e.g., v1 is in a code-freeze path). Otherwise, same PR.

---

### 6. Component-composition pattern recommendation

**Recommendation: Option B — extract to a local `ComposerSettingsMenu/` co-located beside `ChatComposerControls` in each composer directory**

Rationale:

- **Against Option A (inline in both files)**: The consolidated menu is ~60 lines of JSX with 5 distinct sections, two constants (permission modes + thinking levels), and a two-phase open handler. Inlining this in each `ChatComposerControls` produces files that are difficult to scan. The DRY threshold here is quality, not just count: even one instance of a 60-line block warrants extraction if it improves readability.

- **Against Option C (extract to `packages/ui`)**: Only two consumers exist today. The `packages/ui` extraction creates a type-boundary problem — `PermissionMode` and `ThinkingLevel` live in `apps/desktop` types. Resolving that requires either re-declaring types in `packages/ui` (duplication) or extracting them to `packages/shared` (scope expansion). Neither is warranted now. Follow-up #1 in `follow-ups.md` already captures the future extraction path.

- **For Option B**: Co-locate a `ComposerSettingsMenu/` folder beside each `ChatComposerControls/` directory. Each `ComposerSettingsMenu.tsx` is identical in content (the two files are in parallel directory trees for v1 and v2). This is acceptable Rule-of-2 duplication at the app level — both files are internal to `apps/desktop`, have the same author, and will change together. A comment noting "v1 and v2 are intentionally identical; extract to packages/ui when a third surface appears" prevents future confusion.

**Folder placement**

```
v2: .../ChatInputFooter/components/
      ChatComposerControls/
        ChatComposerControls.tsx
        index.ts
      ComposerSettingsMenu/              ← NEW
        ComposerSettingsMenu.tsx
        index.ts

v1: .../ChatInputFooter/components/
      ChatComposerControls/
        ChatComposerControls.tsx
        index.ts
      ComposerSettingsMenu/              ← NEW (identical content)
        ComposerSettingsMenu.tsx
        index.ts
```

**`ComposerSettingsMenu` props interface** (app-local, not exported to `packages/ui`)

```tsx
interface ComposerSettingsMenuProps {
  // Trigger
  selectedModel: ModelOption | null;
  // Model section
  onOpenModelPicker: () => void;
  // Permission section
  permissionMode: PermissionMode;
  onSelectPermissionMode: (mode: PermissionMode) => void;
  // Thinking section
  thinkingLevel: ThinkingLevel;
  onSelectThinkingLevel: (level: ThinkingLevel) => void;
  // Passthrough
  className?: string;
}
```

`ChatComposerControls` becomes:

```tsx
<PromptInputTools className="gap-1.5">
  <ComposerSettingsMenu
    selectedModel={selectedModel}
    onOpenModelPicker={() => setModelSelectorOpen(true)}
    permissionMode={permissionMode}
    onSelectPermissionMode={setPermissionMode}
    thinkingLevel={thinkingLevel}
    onSelectThinkingLevel={setThinkingLevel}
  />
</PromptInputTools>
```

The `ModelPicker` (Dialog) stays rendered outside the `PromptInputTools` div, wired the same way as today (`open={modelSelectorOpen}` / `onOpenChange={setModelSelectorOpen}`), so the Dialog portal has no `PromptInputTools` ancestor context.

---

### 7. Open questions for the human

1. **Permission mode in the trigger?** The investigator omits the active permission mode from the trigger. This means a user glancing at the composer cannot tell if they are in Auto vs. Manual mode. For safety-conscious users (Manual mode = intentional), this may be a meaningful signal to surface. One option: show the `ActiveIcon` (shield icon variant) in the trigger alongside the model logo — e.g., `[ShieldOffIcon] [ClaudeLogo] Claude 3.5 Sonnet`. This adds one icon at `size-3`. Is this worth the additional trigger density?

2. **`BrainIcon` as thinking indicator in trigger — threshold?** The design above shows `BrainIcon` only when `thinkingLevel !== "off"`. An alternative: show it always (dimmed `opacity-40` when off, full `opacity-100` when on) to make the control more discoverable. Which behavior is preferred?

3. **`ChevronDown` on trigger?** The investigator includes `ChevronDownIcon`; this review removes it to reduce width. User preference? On narrow panes (e.g., 240px side-pane split), the difference matters.

4. **Model row text truncation in the menu?** The current `ModelPicker` trigger truncates the model name. Inside the menu (w-64, more space), is it acceptable to show the full model name? Or should it still truncate at, say, `max-w-[160px]` to leave room for the `ChevronRightIcon`?

5. **`onSelect` vs `onClick` for Permission/Thinking items?** `PermissionModePicker` uses `onClick` on `DropdownMenuItem`; `ThinkingToggle` uses `onSelect`. For the consolidated menu's inlined items, `onSelect` is semantically correct (it fires before menu close, allowing the menu to close on selection). Is there any reason to use `onClick` instead for consistency with the existing pickers?
