---
ticket_id: SUPER-771
status: proposal
investigator_specialist: electron-reviewer
challenger_specialist: code-reviewer
created_at: 2026-05-20
---

# SUPER-771: Loud failures for automation runs

## Defect

Automation runs that fail with `dispatch_failed` or `skipped_offline` show only a tiny red dot in the run history; the error text is raw transport jargon (`dispatch: relay 503: {"error":"Host not connected"}`) surfaced only in a hover Tooltip capped at `max-w-xs`. Users are never proactively notified. Since these failures are intentionally not retried, the run is silently lost.

## Reproduction

Evidence: `.spec/improvements/SUPER-771/evidence/prong-a-previousrunslist.md`, `.spec/improvements/SUPER-771/evidence/prong-b-no-failure-notification.md`, `.spec/improvements/SUPER-771/evidence/grep-dispatch-failed-paths.txt`, `.spec/improvements/SUPER-771/evidence/grep-notification-paths.txt`

**Prong A**: `PreviousRunsList.tsx:80-89` wraps the error row in a `<Tooltip>` with `className="max-w-xs"`. The main row shows only a red dot + title + time-ago. No inline error affordance exists. The raw `run.error` string — e.g. `"dispatch: relay 503: {\"error\":\"Host not connected\"}"` — is tooltip-only, clipped at 256px, and lacks `select-text cursor-text` (required by `apps/desktop/AGENTS.md`).

**Prong B**: Full grep of `dispatch_failed` / `skipped_offline` in `apps/desktop/src/` (excluding tests) returns exactly two lines — both the `STATUS_DOT` color map in `PreviousRunsList.tsx`. No code path calls `electronTrpcClient.notifications.showNative.mutate(…)` or any other notification API on automation failure. The `showNative` mutation exists in `notifications.ts:96-122` and is called only for agent lifecycle events in `V2NotificationController/lib/lifecycleEvents.ts:158-173`.

## Root cause

**Prong A — two sub-causes:**

(i) **Renderer surface**: `PreviousRunsList.tsx:80-89` — error is tooltip-only with `max-w-xs`; no inline text, no `select-text cursor-text`, no human translation.

(ii) **Error string source**: `relay-client.ts:67-68` formats errors as `relay ${status}: ${rawBody.slice(0, 500)}`. For a relay 503, `rawBody` = `{"error":"Host not connected"}`. `dispatch.ts:364-365` wraps this with a `dispatch: ` prefix via `describeError`. The persisted error is `"dispatch: relay 503: {\"error\":\"Host not connected\"}"` — a transport artifact, not user copy.

The QStash path (`run-failed/route.ts:90`) uses different framing: `"delivery failed after retries (status N): ..."` — a separate write site, separate format.

**Prong B — absence:**

The renderer receives `automation_runs` rows via Electric SQL (`collections.ts:683-697`, `createPersistedElectricCollection`). No component subscribes to this collection for status transitions. The notification infrastructure (`notifications.ts` + `showNative` mutation) is in place but not wired to automation run events. Natural insertion point: a renderer-side provider/hook that observes the `automationRuns` collection for rows newly entering `dispatch_failed` / `skipped_offline` and calls `showNative`.

## Specialist consultation

None — scope is contained to Electron desktop renderer + one tRPC package helper. The `describeError` change (minimum option) is a one-line helper extraction in `packages/trpc`; no tRPC pattern implications. `apps/api/run-failed/route.ts` is NOT in any option (QStash copy parity is deferred to follow-ups). No schema changes proposed.

## Options

### Option: minimum

- **one_line**: Translate raw relay error to human copy at the `describeError` boundary, and show the error inline on the failed run row (not tooltip-only), with `select-text cursor-text`.
- **files_in_scope**:
  - `packages/trpc/src/router/automation/relay-client.ts`
  - `packages/trpc/src/router/automation/dispatch.ts`
  - `apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/PreviousRunsList/PreviousRunsList.tsx`
- **loc_budget**: 35
- **acceptance_criteria**:
  - AC-1: When `run.status` is `dispatch_failed` or `skipped_offline`, the failed run row displays the error text inline (below or beside the title), not exclusively on hover. Verify by opening an automation with a previously-failed run row.
  - AC-2: The inline error text carries `select-text cursor-text` CSS classes so users can copy it.
  - AC-3: A relay 503 "Host not connected" failure displays as human-readable copy (e.g., "Target machine was offline") rather than `dispatch: relay 503: {"error":"Host not connected"}`. Verify by inducing a 503 with the relay service offline.
  - AC-4: The `describeError` helper (or `relay-client.ts` message format) translates known relay status codes (503 → "Target machine was offline"; other codes → fallback human string) without breaking the existing `describeError` call signature.
- **out_of_scope**: Proactive desktop notification; QStash path (`run-failed/route.ts`) error copy; schema changes; retry UI.
- **risks**:
  - `packages/trpc/src/router/automation/relay-client.ts` and `packages/trpc/src/router/automation/dispatch.ts` are modified in the sibling worktree `super-771-loud-failures` (commits AUTO-LOUD-001 and AUTO-LOUD-003). High overlap risk — implementer must rebase or diff carefully.
  - `PreviousRunsList.tsx` is also modified in `super-771-loud-failures` (AUTO-LOUD-002). Direct conflict expected.
  - The human-readable string introduced here will also be stored in the DB `error` column, making it harder to machine-parse later. Acceptable tradeoff; noted in follow-ups.

### Option: moderate

- **one_line**: Minimum changes (human error copy + inline error row) PLUS a renderer-side provider that watches Electric-synced run rows for newly-failed status and fires a desktop notification — the behavior Kiet and Satya agreed on in the founders thread.
- **files_in_scope**:
  - `packages/trpc/src/router/automation/relay-client.ts`
  - `packages/trpc/src/router/automation/dispatch.ts`
  - `apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/PreviousRunsList/PreviousRunsList.tsx`
  - `apps/desktop/src/renderer/routes/_authenticated/providers/AutomationFailureNotifier/AutomationFailureNotifier.tsx` (new)
  - `apps/desktop/src/renderer/routes/_authenticated/providers/AutomationFailureNotifier/index.ts` (new)
  - `apps/desktop/src/renderer/routes/_authenticated/layout.tsx`
- **loc_budget**: 90
- **acceptance_criteria**:
  - AC-1 through AC-4: Same as minimum option.
  - AC-5: When an automation run row transitions to `dispatch_failed` or `skipped_offline` in the Electric-synced collection, a desktop notification appears: title = "Automation failed", body = human-readable error (not raw relay text). Verify by disabling the host service and triggering a scheduled run.
  - AC-6: The notification fires at most once per run ID (no re-notification on app reopen or Electric re-sync). Verify by restarting the app after a failure — no notification fires for the pre-existing failed row.
  - AC-7: The `AutomationFailureNotifier` mounts inside the authenticated layout and observes `collections.automationRuns`. It tracks already-seen failed run IDs in a ref (not persisted state) to satisfy AC-6 within the current session.
- **out_of_scope**: QStash path error copy; schema changes; retry UI; cross-window dedup (see follow-ups).
- **risks**:
  - All files from minimum option plus: `layout.tsx` and `AutomationFailureNotifier/` are new files not present in `super-771-loud-failures` worktree, BUT `layout.tsx` appears in the sibling worktree's diff — direct overlap risk.
  - Session-scoped dedup (ref) means first app launch after a failure WILL fire the notification, which is the desired behavior. But if the app reopens quickly after a failure and the run is already in `dispatch_failed`, the notification fires on mount. This is probably acceptable per the founders' intent ("proactively tell the user") but should be confirmed.
  - Two Electron windows open simultaneously would each fire a notification. The existing `activeNativeNotifications` map in `notifications.ts` deduplicates by key string if the notification `key` is the same (run ID works as a dedup key). This must be wired correctly.

### Option: strategic

- **one_line**: Moderate changes PLUS a typed failure-reason enum in `packages/db/schema` (relay_offline, relay_timeout, qstash_exhausted) and matched UI that renders structured failure copy without string-parsing the error column — plus parity fixes to QStash path. (Recommended for a separate sprint, NOT this bug PR.)
- **files_in_scope**:
  - All files in moderate option
  - `packages/db/src/schema/enums.ts` (new `automationRunFailureReason` enum)
  - `packages/db/src/schema/schema.ts` (new `failureReason` column on `automationRuns`)
  - `packages/trpc/src/router/automation/dispatch.ts` (write `failureReason`)
  - `apps/api/src/app/api/automations/run-failed/route.ts` (write `failureReason` on QStash exhaustion)
  - Drizzle migration (auto-generated)
- **loc_budget**: 200+
- **acceptance_criteria**:
  - All ACs from moderate option.
  - AC-8: A new `failureReason` column on `automationRuns` carries a typed enum value; the UI reads it directly instead of string-matching `error` text.
  - AC-9: The QStash exhaustion path (`run-failed/route.ts`) produces the same human-readable copy as the dispatch path for equivalent failure categories.
- **out_of_scope**: Retry UI; run-history virtualization.
- **risks**:
  - DB schema change requires a Drizzle migration and Neon branch — violates "surgical bug fix" mandate. This is why it is flagged as separate-sprint material.
  - High overlap with `super-771-loud-failures` worktree across almost all files.
  - Structural change to `automationRuns` table while the table is in production use.
  - Scope creep risk: this is a cleanup pass dressed as a bug fix. The reported symptom (truncated tooltip, no notification) is fully addressed by the moderate option without a schema change.

**Recommendation**: Pick `moderate`. The founders' explicit ask was "popup/notification" — that is prong (b), and it belongs in this PR, not in a follow-up. The moderate option is ~90 LOC and surgically isolated to the renderer layer + one tRPC helper. Strategic is deferred to a separate sprint.

## File-overlap pre-flight

Sibling worktree `/Users/justinrich/Projects/superset/.claude/worktrees/super-771-loud-failures/` has 3 substantive commits (AUTO-LOUD-001 through AUTO-LOUD-003) that touch the following files also in this scope proposal's `files_in_scope`:

| File | Overlap severity |
|---|---|
| `packages/trpc/src/router/automation/relay-client.ts` | HIGH — AUTO-LOUD-001 modifies error formatting here |
| `packages/trpc/src/router/automation/dispatch.ts` | HIGH — AUTO-LOUD-001 touches `describeError`; AUTO-LOUD-003 adds tRPC procedure |
| `apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/PreviousRunsList/PreviousRunsList.tsx` | HIGH — AUTO-LOUD-002 adds inline error row |
| `apps/desktop/src/renderer/routes/_authenticated/layout.tsx` | MEDIUM — AUTO-LOUD-003 mounts AutomationFailureNotifier here |
| `apps/desktop/src/lib/trpc/routers/notifications.ts` | MEDIUM — AUTO-LOUD-003 extends the notifications router |

The implementer picking up this scope MUST NOT copy design from `super-771-loud-failures`. They should treat it as a parallel attempt that will produce merge conflicts. The orchestrator must resolve the overlap (rebase, pick one attempt, or clean-merge) before integration.

No active `sprint/*` branches found: `git branch -a | grep -i sprint` returned empty.
