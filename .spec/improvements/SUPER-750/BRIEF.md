---
source: ticket
improvement_id: SUPER-750
ticket_id: SUPER-750
ticket_url: https://linear.app/superset-sh/issue/SUPER-750/cli-auth-login-dont-open-a-browser-in-cross-device-ssh-cases-fall-back
tracker: linear
title: "CLI auth login: don't open a browser in cross-device / SSH cases — fall back cleanly to paste flow"
labels: []
priority: Medium
status: Todo
project: Justin
team: Superset
created_by: Satya Patel
created_at: 2026-05-16T17:04:07.784Z
updated_at: 2026-05-18T18:21:38.552Z
fetched_at: 2026-05-22T00:00:00Z
---

## Context

`superset auth login` supports two flows: a loopback flow (opens a local browser, browser pings a localhost callback port) and a paste flow (user opens a link and pastes a `code#state` back into the terminal). The loopback flow is right for local use but breaks for remote/SSH cases — the browser opens on a different machine than the one running the CLI, so it can never reach the loopback port. We want the CLI to reliably detect cross-device contexts and present the paste flow only, without spawning a doomed browser tab. Anthropic's CLIs handle this well; the goal is to match that behavior.

![Screenshot 2026-05-16 at 10.02.43 AM.png](https://uploads.linear.app/b0f36e38-dbb9-4fe9-b7d0-303dc3e0e252/aa854fd6-4a0b-4851-9531-79043f5ff0e5/691b9054-ba17-4dcf-9f7c-68926cbb0b86)

## References

| Source | Who | Link | Date |
| -- | -- | -- | -- |
| Slack #ext-inversionsemi thread | Daniel Vega (Inversion Semiconductor) | [link](https://superset-sh.slack.com/archives/C0AQRQVG15F/p1778626711608819) | 2026-05-12 |

Daniel hit this running Superset locally + Codex on an EC2 box: `superset auth login` "breaks" — it eagerly opened a browser tab, the generated link failed in Safari, and he had to fall back to `--api-key`. Satya spawned investigation workspaces (`auth-login-no-browser-ssh`, `auth-login-api-key`) off this thread.

## Implementation notes

### Files

* `packages/cli/src/lib/auth.ts:57-62` — `shouldOpenBrowser()` already gates on `SSH_CONNECTION` / `SSH_TTY` / `CI` / non-TTY. This is the detection seam.
* `packages/cli/src/lib/auth.ts:296-322` — `login()` binds a loopback server (`bindLoopbackServer`), builds both `browserAuthorizeUrl` (loopback redirect) and `pasteAuthorizeUrl`, surfaces the paste URL via `onAuthorizationUrl`, then conditionally opens the browser.
* `packages/cli/src/lib/auth.ts:336-403` — both loopback callback and paste prompt race concurrently; first to resolve wins.
* `packages/cli/src/commands/auth/login/command.ts:175-246` — Ink-based `LoginUI` vs `@clack/prompts` fallback; drives `promptForPastedCode`.
* `packages/cli/src/commands/auth/login/LoginUI.tsx` — terminal UI showing the URL + paste field.

### Approach

The plumbing is mostly correct already — loopback and paste run concurrently and paste always works. The remaining gaps: (1) `shouldOpenBrowser()` only checks `SSH_*`; it should also treat a Superset *remote workspace* as cross-device (the workspace runs on the host, the user's browser is elsewhere) — detect via the host-service / workspace env markers, and consider a missing `DISPLAY` on Linux. (2) When we know it's cross-device, skip `bindLoopbackServer()` entirely (binding a port nobody can reach is wasted) and present the paste flow as the primary path with clear copy, rather than implying a browser will open. (3) Add an explicit `--no-browser` flag as an override. Inspect Anthropic's CLI auth source for their cross-device heuristic before finalizing the detection list.

### Related code

`packages/cli/src/lib/resolve-auth.ts` consumes the stored tokens; the OAuth client config is the hand-managed `superset-cli` row (`CLIENT_ID = "superset-cli"`, `auth.ts:6`).

### Gotchas

* Daniel also saw the paste link fail in Safari (worked in Chrome) and once hit `[query.response_type] Invalid input: expected "code"`. Worth confirming the authorize URL is well-formed cross-browser; `auth.ts:176-198` always sets `response_type=code`, so the Safari failure may be a separate redirect/cookie issue — verify it isn't reintroduced.
