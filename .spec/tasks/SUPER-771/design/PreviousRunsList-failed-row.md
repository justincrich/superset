---
surface: "PreviousRunsList failed-state row"
acs: [AC-1, AC-2, AC-3]
files: ["apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/PreviousRunsList/PreviousRunsList.tsx"]
---

# PreviousRunsList — failed-state row redesign

## Visual spec

The current row is a single `<button>` that renders: `[dot] [title] [time-ago]` on one line. When `run.error` is set today, the entire row is wrapped in a `<Tooltip>` — the error text is tooltip-only, max-w-xs, no inline affordance.

### New layout

A failed run row keeps the existing single `<button>` element (to preserve click-to-open-workspace behaviour) but extends its interior with a second line:

```
[red dot] [title — truncated]           [time-ago]
          [error summary — truncated, select-text]
```

The button becomes `flex-col items-start` instead of `items-center`. The first line (`flex-row`) contains the dot, title, and time-ago as before. The second line is a `<span>` rendered only when `run.error` is truthy, containing the error text with `truncate select-text cursor-text` classes.

The existing `<Tooltip>` wrapping is **retained** around the whole `<button>` for non-failed rows to keep hover-preview UX unchanged. For failed rows, the tooltip is also retained (full error text, `whitespace-pre-wrap max-w-xs`) but now acts as a "see full error" overflow affordance, since the inline span already shows a truncated summary.

### Row height

Non-failed rows: single line, unchanged (`py-1.5`).
Failed rows: two lines. The button padding stays `py-1.5`; the second line uses no extra vertical padding — the row height grows naturally via `flex-col gap-0.5`.

## States

| State | Condition | Visual |
|---|---|---|
| **idle** | `run.status` is `dispatched` or `dispatching` | Current single-line layout, no change |
| **failed-with-short-error** | `run.status` is `dispatch_failed` or `skipped_offline`, `run.error` is truthy, error fits in one line | Two-line layout; inline span shows full error truncated at container width |
| **failed-with-long-error** | Same as above; error is long enough that `truncate` clips it | Two-line layout; truncated inline summary visible; tooltip on hover reveals full error |
| **failed-no-error** | `run.status` is `dispatch_failed` or `skipped_offline`, `run.error` is falsy/null | Two-line layout; inline span shows fallback copy "Run failed" (see Copy section); tooltip omitted |

The distinction between `dispatch_failed` and `skipped_offline` is **not** surfaced visually in the row beyond the red dot (already present in `STATUS_DOT`). Both statuses render identically in the inline error line. The human-readable copy difference, if any, is encoded in the persisted `run.error` string produced by `packages/trpc` (AC-4 — server-side normalization, out of this surface's scope). The renderer renders whatever `run.error` contains.

## Copy

### Inline error label

The renderer does **not** translate or reformat `run.error`. It renders the string as-is, relying on AC-4 (server-side normalization in `describeError`) to have produced human-readable copy before persistence.

| Scenario | Displayed text in inline span |
|---|---|
| `run.error` is a non-empty string | That string, `truncate`-clipped |
| `run.error` is null/undefined/empty string | `"Run failed"` (fallback) |

The fallback `"Run failed"` is a minimal safety net for rows where the error column is unexpectedly null. It should not occur in practice once AC-4 lands.

### AC-3 note (cross-reference)

AC-3 requires that a relay 503 "Host not connected" failure renders as "Target machine was offline". This copy transformation lives in `packages/trpc/src/router/automation/relay-client.ts` (AC-4, server-side). By the time `run.error` reaches this component, it already contains the translated string. The renderer has no translation table. Do NOT add a renderer-side translation map.

## Interactions

**Hover**: The existing `<Tooltip>` (side="left", max-w-xs, whitespace-pre-wrap) remains for failed rows so users can read the full error without relying on the truncated inline summary alone. Tooltip trigger is the entire `<button>`, same as today.

**Focus**: Tab focus lands on the `<button>`. No change to focus ring styling.

**Copy-text affordance**: The inline error `<span>` carries `select-text cursor-text` classes. Because `body` has `user-select: none` globally in the renderer (per `apps/desktop/AGENTS.md`), these classes are mandatory for users to be able to copy the error string into bug reports. The tooltip content does NOT need `select-text` because the user can copy from the inline span.

**Click**: Click behaviour on the row is unchanged — calls `handleOpenRun(run)` if `run.v2WorkspaceId` is set, otherwise no-op (disabled button). The presence of the error span does not affect click target — it is inside the button.

## Accessibility

**ARIA for error row**: Do **not** add `role="alert"`. The list is a history view; runs do not arrive live while the panel is open (the component renders a snapshot query result). `role="alert"` would re-announce on every re-render and create noise. The inline error text is sufficient as static labelling.

**`aria-label` on dot span**: Already present as `aria-label={run.status}`. No change required. The status values `dispatch_failed` and `skipped_offline` will be read by screen readers on the dot, which combined with the inline error text gives adequate context.

**Keyboard**: Focus order is `<button>` only — the inner `<span>` is non-interactive. No change from current.

**Color contrast**: `text-destructive` against the panel background must meet WCAG AA (4.5:1 for normal text). The project's design tokens define `--destructive` and `--background`; this is the same token pairing used in `StartView/index.tsx:201` (`text-sm text-destructive select-text cursor-text`), `WorkspaceInitializingView.tsx:226` (`text-xs text-destructive/80`), and `ChatInputFooter` (`text-destructive`). Use `text-destructive` (not `/80`) for the inline error on a failed row — the full-opacity token is used by the established error-text pattern in this codebase. Light mode: verified contrast-adequate by convention with the rest of the codebase; dark mode: same token, same guarantee.

## Implementation notes

### Sub-component extraction: not required

The failing row is a modified interior of the existing `row` const. Given the `loc_budget: 90` constraint and that this pattern appears only once (inside `PreviousRunsList`), inline modification of the `row` element is the correct choice. Do not extract a `FailedRunRow/` sub-component — it would be used exactly once and adds directory indirection without reuse benefit (Rule of 2 not met).

### Props shape

No new props on `PreviousRunsList`. The `runs: SelectAutomationRun[]` prop already carries `run.error` and `run.status`. The only new rendering logic is inside the existing `runs.map(...)` callback.

### Conditional structure inside the map

Current:
- `row` const is always the button element
- `li` wraps `row` in a `Tooltip` if `run.error`, otherwise bare

New:
- `isFailed` = `run.status === "dispatch_failed" || run.status === "skipped_offline"`
- The button's interior renders a second `<span>` only when `isFailed` is true
- The `<Tooltip>` condition remains `!!run.error` (tooltip still useful for non-failed rows that might have error text, and for failed rows as full-text overflow)

### Class changes on the `<button>` element

Current: `flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left`

When `isFailed`:
- Change `items-center` to `items-start`
- Add `flex-col`
- Keep all other classes

Use `cn()` with a conditional to swap: `cn("flex w-full rounded-md px-2 py-1.5 text-left", isFailed ? "flex-col items-start" : "items-center gap-2", clickable ? "cursor-pointer hover:bg-accent/40" : "cursor-default opacity-70")`

### First line (flex-row) inside the button when failed

Wrap dot + title + time-ago in a `<span className="flex w-full items-center gap-2">` so they remain horizontal on the first line.

### Second line (error) inside the button when failed

```
<span className="truncate text-xs text-destructive select-text cursor-text pl-4">
  {run.error || "Run failed"}
</span>
```

`pl-4` aligns the error text under the title (past the 2×8px dot width + gap). `text-xs` keeps the error subordinate to the title. `truncate` clips at the button width. `select-text cursor-text` satisfies AC-2.

### Translation — renderer does not own it

The renderer renders `run.error` verbatim. AC-4 (server-side) is responsible for the translation. This spec does not propose any renderer-side mapping of relay status codes. See cross-reference in Copy section above.

## Open questions

1. **`text-xs` vs `text-sm` for error text**: Using `text-xs` keeps visual hierarchy clear (title at `text-sm`, error subordinate). If design review prefers `text-sm` for readability on long error strings, this is a one-class swap with no structural impact.

2. **Tooltip retention for failed rows**: The spec retains the tooltip for failed rows as a "full error" overflow. If the tooltip becomes redundant once inline text is readable, it can be dropped for failed rows in a follow-up without any structural change.

3. **`pl-4` alignment of error line**: The value aligns approximately with the title start. Exact pixel alignment depends on rendered dot size (`size-2` = 8px) + gap (`gap-2` = 8px) = 16px = `pl-4`. If the design review finds this off, adjust to `pl-3` or `pl-5`.
