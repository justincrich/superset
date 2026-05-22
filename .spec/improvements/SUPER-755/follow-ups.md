# SUPER-755: Deferred Follow-ups

These improvements were noticed during investigation but are intentionally excluded from all three scope options. They belong in separate tickets.

## 1. Abstract `<ComposerSettingsMenu>` into `packages/ui`

The minimum and moderate options keep the consolidated settings trigger as a `ChatComposerControls`-local component. A future improvement could extract it as a reusable `<ComposerSettingsMenu>` molecule in `packages/ui/src/components/ai-elements/` with a generalized slot API. This is only warranted once a second non-chat surface needs the same pattern.

## 2. `ThinkingToggle` Tooltip nesting

`ThinkingToggle` wraps its trigger in a `TooltipProvider > Tooltip > TooltipTrigger`. When the toggle is rendered as a section inside a parent `DropdownMenu`, this tooltip wrapper becomes non-functional (tooltip won't fire from within a menu item). A follow-up could refactor `ThinkingToggle` to accept an `asMenuSection` prop that omits the tooltip wrapper. This is cosmetic — the tooltip is supplementary, not required.

## 3. Redesign the entire composer footer layout

The ticket targets three pills. The full composer footer also contains `PlusMenu` and the submit button. A holistic composer footer redesign (visual grouping, icon-only mode for narrow panes, responsive collapse) is a larger undertaking separate from this ticket.

## 4. API-key auth modal flow from settings menu

`ModelPicker` navigates to `/settings/models` when no API key is configured. A future improvement could surface an inline "Add API key" prompt within the consolidated menu instead of navigating away, reducing friction.

## 5. Parity across `apps/web`

The v1 and v2 chat composers are in `apps/desktop`. If `apps/web` has a composer with similar controls, it is not in scope for SUPER-755 and would need its own ticket.
