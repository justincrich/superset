# MOB-INFRA-003: Install Maestro + seed .maestro/ with login sub-flow

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 90 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

Sprint 02's gate requires end-to-end verification via Maestro flows (per `plans/chat-mobile-plan/13-testing-strategy.md`). The mobile app currently has zero Maestro infrastructure — no `.maestro/` directory, no installed Maestro binary, no sub-flows. Without this scaffolding, MOB-NAV-005-INT (sessions-list assembly) and MOB-PLATF-009 (multi-device sync verification) cannot prove their behavior against the running app.

The login flow is shared by every Sprint 02 E2E test (you must be signed in before tapping the Chat tab). Maestro best practice is to express shared preconditions as a reusable sub-flow (`subflows/login.yaml`) that other flows invoke via `runFlow:`. This task installs the Maestro binary, creates `.maestro/` with a working login sub-flow, and produces a smoke flow (`smoke.yaml`) that boots the app and runs login as a no-op verification.

Current state: zero Maestro infra. Desired state: Maestro CLI installed (documented), `apps/mobile/.maestro/` directory exists with `subflows/login.yaml` + `smoke.yaml`, a CI-runnable `smoke.yaml` proves the login sub-flow works end-to-end against a dev seed account on iOS Simulator AND Android Emulator.

---

## CRITICAL CONSTRAINTS

- MUST install Maestro per the official one-liner from `plans/chat-mobile-plan/13-testing-strategy.md` line 110-112 (`curl -Ls "https://get.maestro.mobile.dev" | bash`) — document the install in a README at `apps/mobile/.maestro/README.md`. Do NOT vendor the binary.
- MUST create `apps/mobile/.maestro/subflows/login.yaml` that accepts `MAESTRO_EMAIL` and `MAESTRO_PASSWORD` environment-variable inputs (per Maestro `env:` block convention) so credentials are not hardcoded.
- MUST create `apps/mobile/.maestro/smoke.yaml` that uses `runFlow: subflows/login.yaml` and asserts the post-login screen renders (assert visibility of the bottom tab bar testID — `Tasks` text or testID present after login).
- MUST verify the smoke flow passes on iOS Simulator AND Android Emulator (per Sprint 02 gate requiring both platforms).
- MUST document `MAESTRO_EMAIL` / `MAESTRO_PASSWORD` env var requirement in `apps/mobile/.maestro/README.md` along with a sample `.env.maestro` template (gitignored).
- NEVER commit credentials — env vars or local-only `.env.maestro` only.
- NEVER skip the verification step on either platform — "I tested iOS only" is incomplete. Both simulators required.
- NEVER add hardcoded `tapOn: "x=100, y=200"` coordinate selectors — use `text:` or `testID:` selectors only (Maestro best practice).
- STRICTLY use YAML — no Maestro JS, no Cucumber, no Detox helpers. The skill description is explicit: "YAML (no code)" per `13-testing-strategy.md` line 102.

---

## SPECIFICATION

**Objective:** Bootstrap Maestro E2E infrastructure for `apps/mobile` with an installed CLI, a `.maestro/` directory containing a reusable login sub-flow + smoke flow, and verified pass on iOS Simulator + Android Emulator.

**Success state:** `maestro --version` returns a valid version string; `apps/mobile/.maestro/subflows/login.yaml` and `apps/mobile/.maestro/smoke.yaml` exist; `cd apps/mobile && maestro test .maestro/smoke.yaml` exits 0 on both iOS Simulator and Android Emulator; `apps/mobile/.maestro/README.md` documents install + credential conventions.

---

## ACCEPTANCE CRITERIA

### AC-1: Maestro CLI installs and reports version

**GIVEN** Maestro is not yet installed on the developer's machine
**WHEN** the developer follows the README install instructions (`curl -Ls "https://get.maestro.mobile.dev" | bash`)
**THEN** `maestro --version` exits 0 and prints a non-empty version string.

**Verify:** `maestro --version` (manual; on macOS Sequoia)

### AC-2: Login sub-flow drives credentials from env vars

**GIVEN** `apps/mobile/.maestro/subflows/login.yaml` exists with `env:` block declaring `MAESTRO_EMAIL` and `MAESTRO_PASSWORD`
**WHEN** the developer exports both env vars to a dev seed account and runs `cd apps/mobile && maestro test .maestro/subflows/login.yaml` against the running app
**THEN** the flow exits 0 and the simulator/emulator shows the post-login authenticated tab bar (`Tasks` tab visible).

**Verify:** `cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/subflows/login.yaml`

### AC-3: Smoke flow composes login + asserts authenticated state

**GIVEN** `apps/mobile/.maestro/smoke.yaml` exists and uses `runFlow: subflows/login.yaml`
**WHEN** the developer runs `cd apps/mobile && maestro test .maestro/smoke.yaml` with credentials in env
**THEN** the flow exits 0 AND the final assertion confirms the bottom tab bar is visible (`Tasks` text or known testID present).

**Verify:** `cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/smoke.yaml`

### AC-4: Smoke flow passes on both iOS Simulator and Android Emulator

**GIVEN** the smoke flow passes on iOS Simulator (AC-3) and a freshly-booted Android Emulator is available
**WHEN** the developer launches the Android Emulator, runs the dev build, then runs `cd apps/mobile && maestro test .maestro/smoke.yaml`
**THEN** the Maestro CLI selects the Android device (or `--device` is passed) and the flow exits 0 on Android as well.

**Verify:** `cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/smoke.yaml --device <android-emulator>`

### AC-5: README documents install + credential conventions

**GIVEN** a new developer joins the team
**WHEN** they read `apps/mobile/.maestro/README.md`
**THEN** the README contains: (1) install one-liner, (2) `MAESTRO_EMAIL` / `MAESTRO_PASSWORD` env-var spec, (3) sample `.env.maestro` template, (4) `maestro test` invocation for each existing flow, (5) note that `.env.maestro` is gitignored.

**Verify:** Manual: read `apps/mobile/.maestro/README.md`.

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | maestro --version exits 0 after install | AC-1 | happy_path | `maestro --version` |
| TC-2 | subflows/login.yaml declares MAESTRO_EMAIL and MAESTRO_PASSWORD in its env block | AC-2 | edge | `grep -E "(MAESTRO_EMAIL\|MAESTRO_PASSWORD)" apps/mobile/.maestro/subflows/login.yaml` returns 2 matches |
| TC-3 | maestro test .maestro/subflows/login.yaml exits 0 against iOS Simulator with valid creds | AC-2 | happy_path | `cd apps/mobile && maestro test .maestro/subflows/login.yaml` |
| TC-4 | smoke.yaml composes login via `runFlow: subflows/login.yaml` | AC-3 | edge | `grep "runFlow: subflows/login.yaml" apps/mobile/.maestro/smoke.yaml` returns 1 match |
| TC-5 | smoke.yaml asserts authenticated bottom tab bar visibility after login | AC-3 | happy_path | `cd apps/mobile && maestro test .maestro/smoke.yaml` |
| TC-6 | smoke.yaml exits 0 against Android Emulator | AC-4 | edge | `cd apps/mobile && maestro test .maestro/smoke.yaml --device <android-id>` |
| TC-7 | README.md exists and references install one-liner | AC-5 | edge | `grep "get.maestro.mobile.dev" apps/mobile/.maestro/README.md` returns 1 match |
| TC-8 | .maestro/.env.maestro is listed in apps/mobile/.gitignore | AC-5 | edge | `grep ".env.maestro" apps/mobile/.gitignore` returns 1 match |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `plans/chat-mobile-plan/13-testing-strategy.md` | 96-120 | Maestro install + naming convention + YAML-only rule |
| `apps/mobile/screens/(auth)/sign-in/` | (browse) | Existing sign-in screen layout — identify text inputs + button to drive in login.yaml |
| `apps/mobile/screens/(authenticated)/components/AuthenticatedTabBar/AuthenticatedTabBar.tsx` | 9-13 | Tab bar uses `Tasks` text label — known anchor for post-login assertion |
| `apps/mobile/.gitignore` | all | Existing gitignore — need to add `.env.maestro` |
| `apps/mobile/package.json` | scripts | Confirm dev script is `bun dev` for the README's setup note |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/.maestro/subflows/login.yaml` (NEW)
- `apps/mobile/.maestro/smoke.yaml` (NEW)
- `apps/mobile/.maestro/README.md` (NEW)
- `apps/mobile/.maestro/.env.maestro.example` (NEW — template only, no real creds)
- `apps/mobile/.gitignore` (MODIFY — add `.maestro/.env.maestro`)

**WRITE-PROHIBITED:**
- `apps/mobile/.maestro/.env.maestro` — MUST NOT be committed (contains real credentials)
- `apps/mobile/src/**` — no app code changes; this is pure infra
- `apps/mobile/components/**` — no app code changes
- `apps/mobile/global.css` — no token changes
- `packages/db/drizzle/**` — Drizzle-managed migrations
- Any global `package.json` — Maestro is a system-level binary, not an npm dependency

---

## CODE PATTERN

**Reference:** Maestro YAML sub-flow pattern with env-var-driven credentials and `runFlow:` composition.

**Source:** `plans/chat-mobile-plan/13-testing-strategy.md` lines 96-160 — Maestro install + flow naming convention.

**Example (login sub-flow):**
```yaml
# apps/mobile/.maestro/subflows/login.yaml
appId: sh.superset.mobile
env:
  MAESTRO_EMAIL: ${MAESTRO_EMAIL}
  MAESTRO_PASSWORD: ${MAESTRO_PASSWORD}
---
- launchApp:
    clearState: false
- tapOn:
    id: "sign-in-email-input"
- inputText: ${MAESTRO_EMAIL}
- tapOn:
    id: "sign-in-password-input"
- inputText: ${MAESTRO_PASSWORD}
- tapOn:
    id: "sign-in-submit"
- assertVisible:
    text: "Tasks"
    timeout: 10000
```

**Example (smoke flow):**
```yaml
# apps/mobile/.maestro/smoke.yaml
appId: sh.superset.mobile
---
- runFlow: subflows/login.yaml
- assertVisible:
    text: "Tasks"
```

**Anti-pattern:** Inlining email/password as literal strings in the YAML (`inputText: "dev@example.com"`). Credentials leak via git history. ALWAYS use env-var substitution with `${VAR}` syntax. Also avoid `tapOn: { x: 100, y: 200 }` — coordinate selectors break on different screen sizes and form-factors.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/13-testing-strategy.md` §E2E Testing — Maestro
- Maestro official docs (https://maestro.mobile.dev/) — for `runFlow:`, `env:`, and `assertVisible:` syntax

**Interaction notes:**
- 44pt hit target rule applies to the app code under test (sign-in form fields), not Maestro selectors — Maestro just needs stable `testID` or `text:` anchors.
- iOS + Android dual verification — Maestro auto-selects the connected device when only one is running; use `--device <id>` explicitly when both are up.
- Sub-flow composition is the foundational pattern for the rest of Sprint 02's E2E flows — every Sprint 02 user-flow test will start with `runFlow: subflows/login.yaml`.

---

## AGENT INSTRUCTIONS (TDD per AC)

For each AC (AC-1 through AC-5):
1. Set up the artifact required for the AC (install Maestro for AC-1, write the YAML for AC-2/3, run on Android for AC-4, write README for AC-5).
2. Verify the AC by running the exact command in the Verify column.
3. Move to next AC.

Maestro flows are NOT TDD-style — they are E2E specifications. The "test" is the YAML itself; the verification is `maestro test ...` against the running app. Commit each YAML artifact + the README in one commit at the end.

Use commit message `chore(mobile/maestro): bootstrap E2E infra with login sub-flow (MOB-INFRA-003)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Maestro CLI Installed | `maestro --version` | Exit 0; version string printed |
| Login Flow Passes iOS | `cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/subflows/login.yaml` | Exit 0 |
| Smoke Flow Passes iOS | `cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/smoke.yaml` | Exit 0 |
| Smoke Flow Passes Android | `cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/smoke.yaml --device <android-id>` | Exit 0 |
| Format | `bun run format:check` | Exit 0 (YAML is unformatted by Biome; this gate just confirms repo-wide format stays clean) |
| Lint | `bun run lint` | Exit 0 |
| Gitignore Updated | `grep ".env.maestro" apps/mobile/.gitignore` | 1 match |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Maestro is the mobile E2E framework owned by the React Native UI implementer per `13-testing-strategy.md`. Sub-flow composition + simulator/emulator verification are core mobile concerns; node-implementer would not own this.

---

## CODING STANDARDS

- `AGENTS.md` (Maestro flows live under `apps/mobile/.maestro/`)
- `plans/chat-mobile-plan/13-testing-strategy.md` (canonical naming + YAML-only rule)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (not directly applicable but reinforces: don't touch global.css)

---

## DEPENDENCIES

- **Depends on:** None (no Sprint 02 task blocks this; the sign-in screen already exists in Sprint 01)
- **Blocks:** MOB-PLATF-009 (multi-device sync verification needs `subflows/login.yaml` to compose its sessions-list flow); also future Sprint 03+ Maestro flows

---

## NOTES

- The sign-in screen testIDs (`sign-in-email-input`, `sign-in-password-input`, `sign-in-submit`) may not exist yet on the existing sign-in screen. If they don't, ADD them in the same commit (they're tiny additions to the existing screen and are required for any Maestro flow to anchor to). Boy Scout rule: leave the codebase ready for E2E.
- The dev seed account credentials should be sourced from a 1Password vault or developer-local `.env.maestro` — do NOT hardcode.
- Future Sprint 02 Maestro flows (e.g., `sessions-list-real.yaml` in MOB-PLATF-009) will follow the same composition pattern: `runFlow: subflows/login.yaml` then perform sessions-list assertions.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN Maestro is not installed WHEN the developer follows the README install one-liner THEN maestro --version exits 0",
      "verify": "maestro --version"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN subflows/login.yaml exists with env block WHEN developer runs it against iOS Simulator with valid creds THEN the flow exits 0 and authenticated tab bar is visible",
      "verify": "cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/subflows/login.yaml"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN smoke.yaml uses runFlow: subflows/login.yaml WHEN developer runs it with creds THEN exits 0 and Tasks tab is visible",
      "verify": "cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/smoke.yaml"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN smoke flow passes iOS WHEN developer runs it against Android Emulator THEN exits 0 on Android",
      "verify": "cd apps/mobile && MAESTRO_EMAIL=$DEV_EMAIL MAESTRO_PASSWORD=$DEV_PASSWORD maestro test .maestro/smoke.yaml --device <android-id>"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN a new developer reads README.md WHEN they follow it THEN they find install one-liner, MAESTRO_EMAIL/PASSWORD spec, .env.maestro template, gitignore note",
      "verify": "Manual: read apps/mobile/.maestro/README.md"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "maestro --version exits 0 after install",
      "maps_to_ac": "AC-1",
      "verify": "maestro --version"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "subflows/login.yaml declares MAESTRO_EMAIL and MAESTRO_PASSWORD in env block",
      "maps_to_ac": "AC-2",
      "verify": "grep -E 'MAESTRO_EMAIL|MAESTRO_PASSWORD' apps/mobile/.maestro/subflows/login.yaml"
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "maestro test .maestro/subflows/login.yaml exits 0 against iOS Simulator with valid creds",
      "maps_to_ac": "AC-2",
      "verify": "cd apps/mobile && maestro test .maestro/subflows/login.yaml"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "smoke.yaml composes login via runFlow: subflows/login.yaml",
      "maps_to_ac": "AC-3",
      "verify": "grep 'runFlow: subflows/login.yaml' apps/mobile/.maestro/smoke.yaml"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "smoke.yaml asserts authenticated bottom tab bar visibility after login",
      "maps_to_ac": "AC-3",
      "verify": "cd apps/mobile && maestro test .maestro/smoke.yaml"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "smoke.yaml exits 0 against Android Emulator",
      "maps_to_ac": "AC-4",
      "verify": "cd apps/mobile && maestro test .maestro/smoke.yaml --device <android-id>"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "README.md exists and references install one-liner",
      "maps_to_ac": "AC-5",
      "verify": "grep 'get.maestro.mobile.dev' apps/mobile/.maestro/README.md"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": ".maestro/.env.maestro is listed in apps/mobile/.gitignore",
      "maps_to_ac": "AC-5",
      "verify": "grep '.env.maestro' apps/mobile/.gitignore"
    }
  ]
}
-->
