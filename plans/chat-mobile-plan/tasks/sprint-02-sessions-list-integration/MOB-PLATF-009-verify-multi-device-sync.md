# MOB-PLATF-009: Verify multi-device sync via existing chat_sessions Electric shape

**Sprint:** [Sprint 02: Sessions List Integration](./SPRINT.md)
**Agent:** react-native-ui-implementer
**Estimate:** 90 min
**Type:** INFRA
**Status:** Backlog
**Priority:** P0
**Effort:** M

---

## BACKGROUND

UC-PLATF-05 (multi-device session sync) is the Sprint 02 gate requirement: "a session created from desktop appears in the mobile list within three seconds" (gate step 8). The underlying Electric `chat_sessions` shape at `apps/electric-proxy/src/where.ts:136-137` is already org-scoped and stable — Sprint 02 does NOT modify the shape (per `11-technical-requirements/02-api-design.md:60`).

This task verifies the contract end-to-end with REAL services (no mocks per the supreme rule — "watch it work for real"):

1. **Unit test:** A controlled bun:test that simulates the Electric shape contract — sessions inserted into the `chat_sessions` collection appear in `useSessionsForProject()` within a tolerance window. (This re-validates MOB-INFRA-005-V2 + MOB-INFRA-007-V2 + MOB-NAV-005-INT integration.)
2. **Maestro flow:** A two-step E2E flow that runs against a real running mobile build and a real cloud, asserting that a programmatically-injected session (via cloud tRPC `chat.createSession` from a small helper script) appears in the mobile list within ~3 seconds.
3. **Manual cross-device test:** With both desktop and mobile signed in to the same account, create a session on desktop, observe it appear on mobile.

Current state: zero multi-device verification exists. Desired state: a passing Maestro `.maestro/multi-device-sync.yaml` flow PLUS a documented manual cross-device test that proves the 3-second contract holds.

---

## CRITICAL CONSTRAINTS

- MUST write the Maestro flow at `apps/mobile/.maestro/multi-device-sync.yaml`.
- MUST inject the test session via REAL cloud tRPC `chat.createSession` mutation — NOT via direct database insert, NOT via mock. Use a small helper script at `apps/mobile/.maestro/scripts/inject-test-session.ts` that uses the cloud tRPC client with a test JWT (sourced from env).
- MUST verify the session appears in the mobile list within 3 seconds of injection — use Maestro's `assertVisible` with `timeout: 3000` per the spec.
- MUST clean up after the test — the helper script writes a session with a recognizable title (e.g., `"[E2E test ${timestamp}]"`) and the test deletes it via `chat.deleteSession` at the end of the flow.
- MUST verify the flow on BOTH iOS Simulator and Android Emulator.
- MUST document the manual cross-device test procedure in `apps/mobile/.maestro/README.md` (extending the README MOB-INFRA-003 created).
- MUST NOT stub the Electric layer, mock the cloud, or use a fake transport. Real services per the supreme rule.
- MUST gate the helper script's destructive operations behind an env var (`SUPERSET_E2E_TEST=true`) so it can't accidentally run in production.
- MUST NOT modify production tRPC routes or the Electric proxy — sync verification consumes the existing wire format unchanged.
- STRICTLY adhere to the 3-second tolerance window — slower than that fails the sprint gate.

---

## SPECIFICATION

**Objective:** Provide an automated Maestro E2E flow + helper script that prove the multi-device sync contract: a session created via cloud tRPC appears in the mobile sessions list within 3 seconds via the unchanged Electric `chat_sessions` shape. Document the manual cross-device sanity check.

**Success state:** `apps/mobile/.maestro/multi-device-sync.yaml` exists and exits 0 on both iOS + Android within the 3s window; helper script `apps/mobile/.maestro/scripts/inject-test-session.ts` creates and cleans up test sessions reliably; README documents the manual procedure; the human-test deliverable (gate step 8) is verifiable in <2 minutes by a reviewer.

---

## ACCEPTANCE CRITERIA

### AC-1: inject-test-session.ts creates a real cloud session

**GIVEN** `SUPERSET_E2E_TEST=true` is set, `SUPERSET_E2E_JWT` is set to a valid test-account JWT, and `SUPERSET_E2E_WORKSPACE_ID` is set
**WHEN** `bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create --title="[E2E test $timestamp]"` is invoked
**THEN** the script invokes cloud tRPC `chat.createSession({ sessionId, v2WorkspaceId })` with a generated UUID, prints `Session created: ${sessionId}` to stdout, AND exits 0.

**Verify:** `SUPERSET_E2E_TEST=true SUPERSET_E2E_JWT=$TEST_JWT SUPERSET_E2E_WORKSPACE_ID=$WID bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create --title='[E2E test smoke]'`

### AC-2: inject-test-session.ts deletes a session by id

**GIVEN** a real test session with id `${sessionId}` exists (created via AC-1)
**WHEN** `bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=delete --sessionId=$sessionId` is invoked
**THEN** the script invokes cloud tRPC `chat.deleteSession({ sessionId })`, prints `Session deleted: ${sessionId}`, AND exits 0. The session no longer appears in subsequent `chat.listSessions` calls.

**Verify:** `bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=delete --sessionId=$sessionId`

### AC-3: Helper script refuses to run without SUPERSET_E2E_TEST=true

**GIVEN** `SUPERSET_E2E_TEST` is unset OR not equal to `"true"`
**WHEN** the script is invoked with any arguments
**THEN** the script exits with non-zero code AND prints an error to stderr explaining the env-var requirement.

**Verify:** `unset SUPERSET_E2E_TEST && bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create` (should exit non-zero)

### AC-4: Maestro multi-device-sync.yaml: injected session appears within 3 seconds on iOS

**GIVEN** the iOS Simulator is running the dev build, the test account is signed in, and the helper script is callable
**WHEN** `.maestro/multi-device-sync.yaml` runs (login → Chat tab → spawn helper to create session with title `"[E2E sync test ${ts}]"` → assertVisible text matching the title with timeout 3000ms → spawn helper to delete)
**THEN** the flow exits 0 within the 3-second tolerance window AND no orphan test session is left behind in the cloud.

**Verify:** `cd apps/mobile && SUPERSET_E2E_TEST=true ... maestro test .maestro/multi-device-sync.yaml`

### AC-5: Maestro multi-device-sync.yaml passes on Android Emulator

**GIVEN** the Android Emulator is running the dev build with the same test account
**WHEN** the same Maestro flow runs
**THEN** it exits 0 on Android within the same 3s window.

**Verify:** `cd apps/mobile && SUPERSET_E2E_TEST=true ... maestro test .maestro/multi-device-sync.yaml --device <android>`

### AC-6: README documents the manual cross-device procedure

**GIVEN** a reviewer wants to manually verify the sprint gate step 8
**WHEN** they read `apps/mobile/.maestro/README.md`
**THEN** the README contains a clearly-titled section "Multi-Device Sync (UC-PLATF-05)" with: (1) setup (sign in same account on desktop + mobile), (2) action (create a session on desktop), (3) expected observation (session appears on mobile within 3s, no manual refresh), (4) reference to the automated Maestro flow.

**Verify:** Manual: read `apps/mobile/.maestro/README.md`.

---

## TEST CRITERIA

| ID | Statement (boolean — no should/could/might) | Maps to | Type | Verify |
|----|---------------------------------------------|---------|------|--------|
| TC-1 | inject-test-session.ts create-action invokes chat.createSession against real cloud and prints session id | AC-1 | happy_path | `SUPERSET_E2E_TEST=true ... bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create ...` |
| TC-2 | inject-test-session.ts delete-action invokes chat.deleteSession and the session disappears | AC-2 | happy_path | `bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=delete ...` |
| TC-3 | Helper script exits non-zero when SUPERSET_E2E_TEST is unset | AC-3 | error | `unset SUPERSET_E2E_TEST && bun run apps/mobile/.maestro/scripts/inject-test-session.ts ...` |
| TC-4 | Helper script exits non-zero when SUPERSET_E2E_TEST is set to a non-'true' value | AC-3 | error | `SUPERSET_E2E_TEST=other bun run apps/mobile/.maestro/scripts/inject-test-session.ts ...` |
| TC-5 | Maestro multi-device-sync.yaml exits 0 on iOS Simulator within 3s window | AC-4 | happy_path | `cd apps/mobile && maestro test .maestro/multi-device-sync.yaml` |
| TC-6 | Maestro multi-device-sync.yaml leaves no orphan test session after run | AC-4 | edge | Manual: `chat.listSessions` query confirms test sessions purged |
| TC-7 | Maestro multi-device-sync.yaml exits 0 on Android Emulator within 3s window | AC-5 | edge | `cd apps/mobile && maestro test .maestro/multi-device-sync.yaml --device <android>` |
| TC-8 | README contains 'Multi-Device Sync (UC-PLATF-05)' section with setup + action + observation steps | AC-6 | edge | `grep -E 'Multi-Device Sync|UC-PLATF-05' apps/mobile/.maestro/README.md` returns matches |

---

## READING LIST

| Path | Lines | Focus |
|------|-------|-------|
| `plans/chat-mobile-plan/08-uc-platf.md` | (search UC-PLATF-05) | UC-PLATF-05 spec — multi-device session sync requirement |
| `plans/chat-mobile-plan/11-technical-requirements/02-api-design.md` | 41-60 | Electric shape is unchanged for sessions; cloud tRPC chat.createSession is the entry point |
| `apps/electric-proxy/src/where.ts` | 136-137 | chat_sessions shape (unchanged, just confirming behavior) |
| `packages/trpc/src/router/chat/chat.ts` | (search createSession + deleteSession) | Cloud tRPC procedures the helper script invokes |
| `apps/mobile/lib/trpc/client.ts` | all | Reference for tRPC client construction; the script may reuse or construct its own client |
| `apps/mobile/.maestro/subflows/login.yaml` | (from MOB-INFRA-003) | Login composition |
| `apps/mobile/.maestro/README.md` | (from MOB-INFRA-003) | README to extend |
| `plans/chat-mobile-plan/13-testing-strategy.md` | 96-160 | Maestro conventions |

---

## GUARDRAILS

**WRITE-ALLOWED** (only these files may be created/modified):
- `apps/mobile/.maestro/multi-device-sync.yaml` (NEW)
- `apps/mobile/.maestro/scripts/inject-test-session.ts` (NEW)
- `apps/mobile/.maestro/scripts/inject-test-session.test.ts` (NEW — co-located test for script CLI behavior)
- `apps/mobile/.maestro/README.md` (MODIFY — add UC-PLATF-05 section)

**WRITE-PROHIBITED:**
- `packages/trpc/**` — cloud tRPC routes are stable; do NOT modify the createSession/deleteSession contracts
- `apps/electric-proxy/**` — Electric shape unchanged
- `apps/mobile/lib/collections/collections.ts` — owned by MOB-INFRA-005-V2
- `apps/mobile/lib/trpc/client.ts` — auth client is stable
- `packages/db/drizzle/**` — Drizzle-managed migrations
- `apps/mobile/screens/(authenticated)/(chat)/SessionsListScreen/SessionsListScreen.tsx` — owned by MOB-NAV-005-INT
- Any production code paths — this task is verification-only

---

## CODE PATTERN

**Reference:** Maestro flow with `runScript:` hooks invoking the helper for create/delete, sandwiching the assertion.

**Source:** `plans/chat-mobile-plan/13-testing-strategy.md` lines 96-160 (Maestro conventions); existing `apps/mobile/.maestro/subflows/login.yaml` (MOB-INFRA-003 deliverable).

**Example (helper script sketch):**
```ts
// apps/mobile/.maestro/scripts/inject-test-session.ts
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { randomUUID } from "node:crypto";
import type { AppRouter } from "@superset/trpc";

if (process.env.SUPERSET_E2E_TEST !== "true") {
  console.error(
    "Refusing to run: SUPERSET_E2E_TEST must be set to 'true'.",
  );
  process.exit(2);
}

const jwt = process.env.SUPERSET_E2E_JWT;
const apiUrl = process.env.SUPERSET_E2E_API_URL ?? "https://api.superset.sh";
const workspaceId = process.env.SUPERSET_E2E_WORKSPACE_ID;

if (!jwt || !workspaceId) {
  console.error("SUPERSET_E2E_JWT and SUPERSET_E2E_WORKSPACE_ID are required.");
  process.exit(2);
}

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, v] = arg.replace(/^--/, "").split("=");
    return [k, v];
  }),
);

const client = createTRPCClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/api/trpc`,
      headers: { Authorization: `Bearer ${jwt}` },
    }),
  ],
});

async function main() {
  if (args.action === "create") {
    const sessionId = randomUUID();
    await client.chat.createSession.mutate({
      sessionId,
      v2WorkspaceId: workspaceId,
    });
    if (args.title) {
      await client.chat.updateTitle.mutate({ sessionId, title: args.title });
    }
    console.log(`Session created: ${sessionId}`);
  } else if (args.action === "delete") {
    if (!args.sessionId) {
      console.error("--sessionId is required for delete action");
      process.exit(2);
    }
    await client.chat.deleteSession.mutate({ sessionId: args.sessionId });
    console.log(`Session deleted: ${args.sessionId}`);
  } else {
    console.error("Unknown --action; use 'create' or 'delete'");
    process.exit(2);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

```yaml
# apps/mobile/.maestro/multi-device-sync.yaml
appId: sh.superset.mobile
env:
  TEST_TITLE: "[E2E sync test ${MAESTRO_TIMESTAMP}]"
---
- runFlow: subflows/login.yaml
- tapOn:
    text: "Chat"
- assertVisible:
    id: "sessions-list-screen"
- runScript: scripts/inject-test-session.ts --action=create --title=${TEST_TITLE}
- assertVisible:
    text: ${TEST_TITLE}
    timeout: 3000
- runScript: scripts/inject-test-session.ts --action=delete --sessionId=$LAST_SESSION_ID  # captured from previous runScript stdout
```

**Anti-pattern:** Mocking the tRPC client or stubbing the Electric subscription to "verify" the contract. The supreme rule explicitly forbids this — "watch it work for real." If the cloud is unreachable or the test account can't authenticate, fail closed and document the blocker.

Another anti-pattern: hardcoding test session ids. The script generates a fresh UUID per run and the Maestro flow captures it from the script's stdout, so retries and parallel runs don't collide.

---

## DESIGN

**References:**
- `plans/chat-mobile-plan/08-uc-platf.md` UC-PLATF-05 spec
- `plans/chat-mobile-plan/11-technical-requirements/02-api-design.md` §3 (chat_sessions Electric shape unchanged)
- `plans/chat-mobile-plan/13-testing-strategy.md` (Maestro conventions)

**Interaction notes:**
- 44pt hit target — N/A (no UI changes).
- Light + dark theme — N/A.
- Project-first scoping — the test workspace MUST be in the test account's currently-selected project; if not, the session won't appear in the list (it would be scoped to a different project). The helper script should accept `--projectId` and validate.
- Cache-first per AGENTS.md TanStack DB rule — the 3-second window assumes a warm Electric connection. Cold-launch behavior may differ; the test runs AFTER login when Electric is established.

---

## AGENT INSTRUCTIONS (per AC)

For each AC (AC-1 through AC-6):
1. Implement the artifact (script for AC-1/2/3, YAML for AC-4/5, README extension for AC-6).
2. Verify by running the exact command.
3. Move to next AC.

For AC-1/2/3: write `inject-test-session.test.ts` with unit tests that mock `createTRPCClient` to verify the CLI argument parsing and env-var gating. The actual createSession invocation is verified by manually running the script (AC-1's verify command).

After AC-1 through AC-3: run the script against the real cloud (with creds) to confirm it works end-to-end.

After AC-4/5: run Maestro flows on both platforms. If the 3-second window fails reliably, INVESTIGATE — do NOT lower the threshold without product sign-off (that's a sprint-gate regression).

Commit after every AC passes. Use commit message `chore(mobile/maestro): AC-N {short name} (MOB-PLATF-009)`.

---

## VERIFICATION GATES

| Gate | Command | Expected |
|------|---------|----------|
| Helper Script Unit Tests | `bun test apps/mobile/.maestro/scripts/inject-test-session.test.ts` | Exit 0 |
| Helper Script Create (real cloud) | `SUPERSET_E2E_TEST=true SUPERSET_E2E_JWT=$JWT SUPERSET_E2E_WORKSPACE_ID=$WID bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create --title='[E2E smoke]'` | Exit 0; session id printed |
| Helper Script Delete (real cloud) | `... bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=delete --sessionId=$SID` | Exit 0 |
| Helper Script Env Gate | `unset SUPERSET_E2E_TEST && bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create` | Exit non-zero |
| Type Check | `bun run typecheck` | Exit 0 |
| Lint | `bun run lint` | Exit 0 |
| Format | `bun run format:check` | Exit 0 |
| Maestro iOS | `cd apps/mobile && SUPERSET_E2E_TEST=true ... maestro test .maestro/multi-device-sync.yaml` | Exit 0, within 3s |
| Maestro Android | `cd apps/mobile && SUPERSET_E2E_TEST=true ... maestro test .maestro/multi-device-sync.yaml --device <android>` | Exit 0, within 3s |
| Manual cross-device | Two-device test per README | Session appears on mobile within 3s |

---

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Maestro flow + supporting Node script for E2E verification. Owned by react-native-ui-implementer per `13-testing-strategy.md` and the mobile AGENTS.md. The cloud tRPC contracts are stable — this task consumes them, not modifies them.

---

## CODING STANDARDS

- `plans/chat-mobile-plan/13-testing-strategy.md` (Maestro YAML + naming conventions)
- `~/.claude/CLAUDE.md` (THE SUPREME RULE — real services, no mocks for E2E)
- `apps/mobile/AGENTS.md` (Maestro flows under `.maestro/`)
- `~/.claude/memory/feedback_vendor-libraries-style-overrides-only.md` (Maestro is the base; configure flows, do not wrap)
- `~/.claude/memory/feedback_pixel-perfect-preserve-existing-tokens.md` (N/A here)

---

## DEPENDENCIES

- **Depends on:** MOB-INFRA-003 (Maestro installed + login sub-flow), MOB-NAV-005-INT (SessionsListScreen renders sessions so the assertion has a target)
- **Blocks:** Sprint 02 gate sign-off (this is the formal verification of step 8 of the gate)

---

## NOTES

- The `runScript:` capture pattern (`$LAST_SESSION_ID`) may need refinement based on Maestro's actual stdout-capture syntax; consult Maestro docs and adjust the YAML accordingly. The script always prints the session id on stdout so a wrapping shell script could be used if `runScript:` capture is limited.
- The "[E2E sync test {ts}]" title prefix is a recognizable marker — if a manual run leaves an orphan, a periodic cleanup script can sweep them.
- The 3-second window may need tuning if the cloud has high latency; document any deviations from the spec in the task completion notes.
- If the helper script fails because the cloud tRPC client requires specific headers (CSRF, etc.), inspect `apps/mobile/lib/trpc/client.ts` and mirror the header construction. Do NOT modify cloud routes to bypass auth.

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN SUPERSET_E2E_TEST=true and required env vars set WHEN script invoked with --action=create --title='...' THEN invokes chat.createSession via tRPC, prints 'Session created: ${id}', exits 0",
      "verify": "SUPERSET_E2E_TEST=true SUPERSET_E2E_JWT=$JWT SUPERSET_E2E_WORKSPACE_ID=$WID bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create --title='[E2E test smoke]'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN real test session exists WHEN script invoked with --action=delete --sessionId=... THEN invokes chat.deleteSession, prints 'Session deleted: ${id}', exits 0; session removed from cloud",
      "verify": "bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=delete --sessionId=$sessionId"
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN SUPERSET_E2E_TEST unset or not 'true' WHEN script invoked with any args THEN exits non-zero, stderr explains env-var requirement",
      "verify": "unset SUPERSET_E2E_TEST && bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN iOS Simulator running dev build with signed-in test account WHEN .maestro/multi-device-sync.yaml runs THEN exits 0 within 3-second tolerance and no orphan test session left in cloud",
      "verify": "cd apps/mobile && SUPERSET_E2E_TEST=true ... maestro test .maestro/multi-device-sync.yaml"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN Android Emulator running dev build with same test account WHEN same Maestro flow runs THEN exits 0 on Android within 3s window",
      "verify": "cd apps/mobile && SUPERSET_E2E_TEST=true ... maestro test .maestro/multi-device-sync.yaml --device <android>"
    },
    {
      "id": "AC-6",
      "type": "acceptance_criterion",
      "description": "GIVEN a reviewer reads .maestro/README.md WHEN they look for the multi-device procedure THEN README contains 'Multi-Device Sync (UC-PLATF-05)' section with setup/action/observation/reference",
      "verify": "Manual: read apps/mobile/.maestro/README.md"
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "inject-test-session.ts create-action invokes chat.createSession against real cloud and prints session id",
      "maps_to_ac": "AC-1",
      "verify": "SUPERSET_E2E_TEST=true ... bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=create"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "inject-test-session.ts delete-action invokes chat.deleteSession and the session disappears",
      "maps_to_ac": "AC-2",
      "verify": "bun run apps/mobile/.maestro/scripts/inject-test-session.ts --action=delete --sessionId=..."
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "Helper script exits non-zero when SUPERSET_E2E_TEST is unset",
      "maps_to_ac": "AC-3",
      "verify": "unset SUPERSET_E2E_TEST && bun run apps/mobile/.maestro/scripts/inject-test-session.ts"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "Helper script exits non-zero when SUPERSET_E2E_TEST is set to non-'true' value",
      "maps_to_ac": "AC-3",
      "verify": "SUPERSET_E2E_TEST=other bun run apps/mobile/.maestro/scripts/inject-test-session.ts"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Maestro multi-device-sync.yaml exits 0 on iOS Simulator within 3s window",
      "maps_to_ac": "AC-4",
      "verify": "cd apps/mobile && maestro test .maestro/multi-device-sync.yaml"
    },
    {
      "id": "TC-6",
      "type": "test_criterion",
      "description": "Maestro multi-device-sync.yaml leaves no orphan test session after run",
      "maps_to_ac": "AC-4",
      "verify": "Manual: chat.listSessions confirms purge"
    },
    {
      "id": "TC-7",
      "type": "test_criterion",
      "description": "Maestro multi-device-sync.yaml exits 0 on Android Emulator within 3s window",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && maestro test .maestro/multi-device-sync.yaml --device <android>"
    },
    {
      "id": "TC-8",
      "type": "test_criterion",
      "description": "README contains 'Multi-Device Sync (UC-PLATF-05)' section with setup + action + observation steps",
      "maps_to_ac": "AC-6",
      "verify": "grep -E 'Multi-Device Sync|UC-PLATF-05' apps/mobile/.maestro/README.md"
    }
  ]
}
-->
