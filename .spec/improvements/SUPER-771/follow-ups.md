# SUPER-771 Deferred Follow-ups

Items observed during investigation that are NOT in any of the 3 scope options.

- **Failure-reason taxonomy / typed enum**: `automationRuns.error` is an unstructured `text()` column. A future sprint could add a `failure_reason` enum column (relay_offline, relay_timeout, relay_auth, qstash_exhausted) to power structured filtering and metrics — separate from human-readable copy.
- **QStash + dispatch path copy parity**: The `run-failed/route.ts:90` path produces `"delivery failed after retries (status N): ..."` while dispatch produces `"dispatch: relay 503: ..."`. Even after minimum-option normalization in `relay-client.ts`, the QStash path uses different framing. Unifying these is a separate sprint item — it requires touching `apps/api/src/app/api/automations/run-failed/route.ts` which is outside the desktop scope.
- **Retry-at-user-request**: Founders explicitly ruled out auto-retry, but a "retry now" CTA on the failed row was discussed and might resurface. Separate ticket.
- **Run-history virtualization**: `PreviousRunsList` renders up to 10 runs with no virtualization. For automations running every hour over months, this list could grow unwieldy. Separate sprint.
- **Dedicated failure-detail modal / sheet**: For multi-line stack traces or long QStash payloads, an expandable modal would be more appropriate than inline. Deferred — current fix is inline text.
- **Notification dedup across windows**: If two Electron windows are open, both would observe the Electric stream and fire duplicate notifications. The existing `activeNativeNotifications` map in `notifications.ts` deduplicates by key but the key scheme for automation failures needs to be defined. This is a follow-up if the moderate option is picked.
