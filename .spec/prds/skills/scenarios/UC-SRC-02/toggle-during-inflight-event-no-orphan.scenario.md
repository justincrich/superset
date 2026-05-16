---
service: skills
feature: UC-SRC-02
priority: P1
type: edge_case
---
# Toggle off during an in-flight watcher event leaves no orphan transaction

A watcher event for the `claude` source is being processed by the FilesystemImporter inside an open transaction (mid-upsert). The user toggles the source off in Settings before the transaction commits. The expected behavior: the in-flight transaction completes normally (the event was admitted to the p-queue before the toggle); the watcher subscription is cancelled after the queue drains; no further events for that source are processed. Critically, no half-applied row remains, no exception is thrown to the renderer, and the eventual `skills.list` shows the row but with the source disabled (so it does not resolve). After re-enabling, no duplicate import occurs.
