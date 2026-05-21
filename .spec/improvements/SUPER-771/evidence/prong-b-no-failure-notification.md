# Prong B — No proactive notification on dispatch_failed / skipped_offline

## Evidence

### Grep: dispatch_failed / skipped_offline in desktop src (excluding tests)

Command:
```
grep -rn "dispatch_failed|skipped_offline" apps/desktop/src/ (excl. .test. files)
```

Result (full):
```
apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/PreviousRunsList/PreviousRunsList.tsx:11: skipped_offline: "bg-red-500",
apps/desktop/src/renderer/routes/_authenticated/_dashboard/automations/$automationId/components/PreviousRunsList/PreviousRunsList.tsx:12: dispatch_failed: "bg-red-500",
```

The status values appear **only** in the color-mapping object for the red dot. There is no code path that:
- inspects an incoming Electric snapshot for status ∈ {dispatch_failed, skipped_offline}
- calls `electronTrpcClient.notifications.showNative.mutate(…)` or any native notification API
- triggers an in-app toast or popup on automation failure

### Notification infrastructure

`apps/desktop/src/lib/trpc/routers/notifications.ts` provides a `showNative` mutation that wraps `new Notification(…)` from Electron. It is called from renderer code in exactly one location:

`apps/desktop/src/renderer/routes/_authenticated/components/V2NotificationController/lib/lifecycleEvents.ts:158-173` — fires only on agent lifecycle events (Stop / PermissionRequest) from workspace sessions, NOT on automation run status changes.

### Electric stream as insertion point

Automation runs are delivered to the renderer via Electric SQL:
`apps/desktop/src/renderer/routes/_authenticated/providers/CollectionsProvider/collections.ts:683-697` — `automationRuns` is a `createPersistedElectricCollection` synced by organization.

No subscriber in the renderer observes this collection for status transitions. The `useLiveQuery` at `$automationId/page.tsx:53-63` only reads current state for render; it does not react to newly-failed runs to fire notifications.

## Interpretation

The renderer has the infrastructure to fire Electron native notifications (via tRPC `notifications.showNative`), and it has a live stream of automation_runs rows via Electric. The missing piece is a reactor component that watches Electric-synced run rows for newly-entered `dispatch_failed` / `skipped_offline` states and calls `showNative`.
