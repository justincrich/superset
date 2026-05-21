# Prong A — Truncated/raw error text in PreviousRunsList

## File
apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/PreviousRunsList/PreviousRunsList.tsx:80-89

## Evidence

Lines 80-89 of PreviousRunsList.tsx:
```tsx
{run.error ? (
  <Tooltip>
    <TooltipTrigger asChild>{row}</TooltipTrigger>
    <TooltipContent
      side="left"
      className="max-w-xs whitespace-pre-wrap"
    >
      {run.error}
    </TooltipContent>
  </Tooltip>
) : (
  row
)}
```

## Interpretation

When `run.error` is set, the row renders the raw `run.error` string exclusively inside a Tooltip (hover-only, `max-w-xs` ≈ 256px). There is no inline affordance on the row itself — no error badge, no icon, no expandable section. The main row content is: status dot + run.title + time-ago. The error is only accessible via hover, and `max-w-xs whitespace-pre-wrap` clips long strings.

For a relay 503 failure, `run.error` = `"dispatch: relay 503: {\"error\":\"Host not connected\"}"` — raw transport jargon with JSON blob. The tooltip clips it at 256px width. There is no human-readable translation ("Target machine was offline").

## Root cause of string

relay-client.ts:67-68:
```ts
throw new RelayDispatchError(
  `relay ${response.status}: ${rawBody.slice(0, 500)}`,
```

dispatch.ts:365:
```ts
if (err instanceof RelayDispatchError) return `${context}: ${err.message}`;
```

So error stored = `"dispatch: relay 503: {\"error\":\"Host not connected\"}"` — `context` = "dispatch", `err.message` = RelayDispatchError.message = `relay 503: {"error":"Host not connected"}`.

Also: `run.error` has no `select-text cursor-text` class requirement satisfied — it is inside Tooltip content, not a rendered text element with explicit selection classes. (AGENTS.md says rendered errors must carry `select-text cursor-text`; the Tooltip content has neither.)
