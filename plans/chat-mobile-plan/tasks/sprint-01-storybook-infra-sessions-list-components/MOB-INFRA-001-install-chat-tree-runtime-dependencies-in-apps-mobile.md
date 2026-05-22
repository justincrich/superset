# TASK: MOB-INFRA-001 — Install chat-tree runtime dependencies in apps/mobile

**TASK_TYPE:** INFRA
**STATUS:** Backlog
**PRIORITY:** P0
**EFFORT:** S
**ESTIMATE:** 60 min
**AGENT:** implementer=`react-native-ui-implementer` · reviewer=`react-native-ui-reviewer`
**SPRINT:** [Sprint 01](./SPRINT.md)
**QUALITY SCORE:** 115/115

**RUNTIME_COMMANDS:**
- typecheck: `cd apps/mobile && bun run typecheck`
- lint: `cd apps/mobile && bun run lint`
- test: `cd apps/mobile && bun test`

**AGENT_RATIONALE:** Owns RN/Expo mobile build configuration and package management for apps/mobile.

---

## OUTCOME

`apps/mobile/package.json` lists every package from `04-dependencies.md` (or confirms it was pre-existing), `bun install` exits 0, `cd apps/mobile && bun run typecheck` exits 0, and the lockfile is committed.

---

## 🚫 CRITICAL CONSTRAINTS (Never tier — read before acting)

### MUST
- Install dependencies via `bun add` from `apps/mobile/` so versions land in apps/mobile/package.json (NOT root package.json).
- Add Storybook 9 packages (`@storybook/react-native`, `@storybook/addon-ondevice-controls`, `@storybook/addon-ondevice-actions`) as devDependencies; runtime chat-tree deps as regular dependencies.
- Pin or use caret-major versions consistent with `04-dependencies.md` (FlashList ^1.7, gorhom/bottom-sheet ^5, @10play/tentap-editor latest, react-native-markdown-display latest).
- Verify presence of pre-existing deps (`lucide-react-native`, `expo-device`, `react-native-reanimated`, `expo-notifications`) and add only the missing ones — do NOT bump or duplicate versions already in package.json.
- Run `bun install` after edits and confirm exit 0; run `cd apps/mobile && bun run typecheck` and confirm exit 0 with no new type errors attributable to the new packages.

### NEVER
- NEVER edit Storybook config files (`.rnstorybook/`, `metro.config.js`, `app/_layout.tsx`, `package.json` scripts) — that work belongs to MOB-INFRA-002.
- NEVER add deps to root package.json or any other workspace; this task is scoped to `apps/mobile/package.json` only.
- NEVER use npm/yarn/pnpm — Bun is the monorepo package manager per AGENTS.md.
- NEVER add fork tarball overrides or patch steps for any added package.
- NEVER stub or comment-out an install if it fails; surface the failure with concrete log output.

### STRICTLY
- STRICTLY scope the diff to `apps/mobile/package.json` and `bun.lock` (root-level lockfile owned by Bun workspaces).
- STRICTLY document each added package alongside the UC/component that justifies it in the commit body.

---

## SPECIFICATION

**Objective:** Add the runtime + Storybook devDependency set required by Sprint 01 components (FlashList, bottom-sheet, tentap-editor, markdown-display, Storybook 9 + on-device addons) to `apps/mobile/package.json` so downstream tasks can import them without ENOENT.

**Success state:** `apps/mobile/package.json` lists every package from `04-dependencies.md` (or confirms it was pre-existing), `bun install` exits 0, `cd apps/mobile && bun run typecheck` exits 0, and the lockfile is committed.

---

## DONE WHEN

- [ ] [AC-1] Runtime chat-tree deps present in package.json
- [ ] [AC-2] Storybook 9 devDependencies present
- [ ] [AC-3] Lockfile resolves and install completes cleanly
- [ ] [AC-4] Typecheck passes with new deps
- [ ] [AC-5] Pre-existing required deps validated, not duplicated
- [ ] `cd apps/mobile && bun run typecheck` exits 0
- [ ] `cd apps/mobile && bun run lint` exits 0
- [ ] Only files in `guardrails.write_allowed` were modified (verify via `git diff --name-only`)

---

## ACCEPTANCE CRITERIA (TDD beads — ordered happy-path first)

### AC-1 — Runtime chat-tree deps present in package.json
**GIVEN** Sprint 01 needs FlashList, gorhom bottom-sheet, tentap-editor, and react-native-markdown-display per `04-dependencies.md`
**WHEN** I read `apps/mobile/package.json` after this task lands
**THEN** `dependencies` contains `@shopify/flash-list` (^1.7), `@gorhom/bottom-sheet` (^5), `@10play/tentap-editor`, and `react-native-markdown-display` with explicit version ranges
**VERIFY:** `test -f apps/mobile/package.json && grep -E '\"@shopify/flash-list\"|\"@gorhom/bottom-sheet\"|\"@10play/tentap-editor\"|\"react-native-markdown-display\"' apps/mobile/package.json | wc -l | grep -E '^[[:space:]]*4$'`

### AC-2 — Storybook 9 devDependencies present
**GIVEN** MOB-INFRA-002 will configure Storybook 9 on-device
**WHEN** I read `apps/mobile/package.json` after this task lands
**THEN** `devDependencies` contains `@storybook/react-native` (^9), `@storybook/addon-ondevice-controls`, and `@storybook/addon-ondevice-actions`
**VERIFY:** `cd apps/mobile && node -e "const p=require('./package.json'); const d=p.devDependencies||{}; const need=['@storybook/react-native','@storybook/addon-ondevice-controls','@storybook/addon-ondevice-actions']; const miss=need.filter(k=>!d[k]); if(miss.length){console.error('Missing devDeps:',miss);process.exit(1)} console.log('OK')"`

### AC-3 — Lockfile resolves and install completes cleanly
**GIVEN** package.json has been edited with the new dep set
**WHEN** I run `bun install` from the repo root
**THEN** Install exits 0 and `bun.lock` is updated with deterministic resolutions for the new packages
**VERIFY:** `bun install && test -f bun.lock`

### AC-4 — Typecheck passes with new deps
**GIVEN** New dependencies are installed and types are available under `node_modules/@types` or bundled `.d.ts`
**WHEN** I run `cd apps/mobile && bun run typecheck`
**THEN** tsc --noEmit exits 0 with zero new errors attributable to the added packages
**VERIFY:** `cd apps/mobile && bun run typecheck`

### AC-5 — Pre-existing required deps validated, not duplicated
**GIVEN** `lucide-react-native`, `expo-device`, `react-native-reanimated`, `expo-notifications` are already in package.json per the brief
**WHEN** I inspect `apps/mobile/package.json` after this task lands
**THEN** Each of those four packages appears exactly once with its pre-existing version (no duplicate keys, no version bumps unless missing)
**VERIFY:** `cd apps/mobile && node -e "const p=require('./package.json'); const all={...p.dependencies,...p.devDependencies}; const need=['lucide-react-native','expo-device','react-native-reanimated','expo-notifications']; const miss=need.filter(k=>!all[k]); if(miss.length){console.error('Missing required pre-existing:',miss);process.exit(1)} console.log('OK')"`


---

## TEST CRITERIA (boolean assertions mapped to ACs)

| ID | Statement | Maps to | Type | Verify |
|----|-----------|---------|------|--------|
| TC-1 | package.json declares the four chat-tree runtime deps (flash-list, bottom-sheet, tentap-editor, markdown-display) | AC-1 | happy_path | `grep -E '\"@shopify/flash-list\"\|\"@gorhom/bottom-sheet\"\|\"@10play/tentap-editor\"\|\"react-native-markdown-display\"' apps/mobile/package.json \| wc -l \| grep -E '^[[:space:]]*4$'` |
| TC-2 | package.json declares all three Storybook 9 devDependency packages | AC-2 | happy_path | `cd apps/mobile && node -e "const d=require('./package.json').devDependencies; ['@storybook/react-native','@storybook/addon-ondevice-controls','@storybook/addon-ondevice-actions'].forEach(k=>{if(!d[k])process.exit(1)})"` |
| TC-3 | `bun install` completes successfully and writes bun.lock | AC-3 | happy_path | `bun install && test -f bun.lock` |
| TC-4 | `bun run typecheck` in apps/mobile exits 0 after install | AC-4 | happy_path | `cd apps/mobile && bun run typecheck` |
| TC-5 | Pre-existing deps lucide-react-native, expo-device, react-native-reanimated, expo-notifications appear exactly once each | AC-5 | edge_case | `cd apps/mobile && node -e "const p=require('./package.json'); ['lucide-react-native','expo-device','react-native-reanimated','expo-notifications'].forEach(k=>{const inDep=!!(p.dependencies\|\|{})[k]; const inDev=!!(p.devDependencies\|\|{})[k]; if(inDep&&inDev){console.error('dup:',k);process.exit(1)} if(!inDep&&!inDev){console.error('miss:',k);process.exit(1)}})"` |

---

## READING LIST

- `plans/chat-mobile-plan/11-technical-requirements/04-dependencies.md` (lines 1-200) — Authoritative dep list with version ranges + per-UC justification
- `plans/chat-mobile-plan/13-testing-strategy.md` (lines 26-95) — Storybook 9 packages and on-device addons
- `apps/mobile/package.json` (lines 1-200) — Existing deps to avoid duplicating

---

## GUARDRAILS

### WRITE ALLOWED
- apps/mobile/package.json (MODIFY — add deps + devDeps only)
- bun.lock (MODIFY — regenerated by `bun install`)

### WRITE PROHIBITED
- apps/mobile/.rnstorybook/** (reserved for MOB-INFRA-002)
- apps/mobile/metro.config.js (reserved for MOB-INFRA-002)
- apps/mobile/app/_layout.tsx (reserved for MOB-INFRA-002)
- package.json at repo root (out of scope)
- apps/desktop/**, apps/web/**, packages/** (mobile-only sprint)

---

## DESIGN

### References
- plans/chat-mobile-plan/11-technical-requirements/04-dependencies.md

### Interaction notes
- No UI artifact in this task — pure dependency manifest changes.

### Pattern
Bun-managed monorepo dep additions: `cd apps/mobile && bun add <pkg>` for runtime deps; `bun add -D <pkg>` for devDeps.

**Pattern source:** AGENTS.md (Tech Stack: Package Manager = Bun)

### Anti-pattern
Editing root package.json; mixing npm/yarn; pinning via tarball overrides

---

## VERIFICATION GATES

### Bun install clean
- **Command:** `bun install`
- **Expected:** Exit 0, bun.lock updated

### Mobile typecheck
- **Command:** `cd apps/mobile && bun run typecheck`
- **Expected:** Exit 0, no new errors

### Mobile lint
- **Command:** `cd apps/mobile && bun run lint`
- **Expected:** Exit 0, no warnings (lint script treats warnings as errors)

### Dep manifest correct
- **Command:** `grep -E '\"@shopify/flash-list\"|\"@gorhom/bottom-sheet\"|\"@10play/tentap-editor\"|\"react-native-markdown-display\"' apps/mobile/package.json | wc -l`
- **Expected:** 4


---

## DEPENDENCIES

- **Depends on:** None
- **Blocks:** MOB-INFRA-002, MOB-NAV-002, MOB-NAV-003, MOB-NAV-004, MOB-NAV-008-UI

---

## CODING STANDARDS

- `AGENTS.md — Tech Stack (Bun, no npm/yarn/pnpm)`
- `AGENTS.md — Agent Rule #7 (lint warnings block push)`
- `plans/chat-mobile-plan/11-technical-requirements/04-dependencies.md`

---

## QUALITY RUBRIC SCORE

**Total: 115/115** ✅ PASS

| Section | Earned / Max |
|---------|--------------|
| CRITICAL CONSTRAINTS | 13/13 |
| SPECIFICATION | 10/10 |
| ACCEPTANCE CRITERIA | 25/25 |
| TEST CRITERIA | 15/15 |
| STABLE REQUIREMENT IDS | 5/5 |
| GUARDRAILS | 7/7 |
| DESIGN | 10/10 |
| VERIFICATION GATES | 15/15 |
| AGENT ASSIGNMENT | 5/5 |
| ESTIMATE | 5/5 |
| CODING STANDARDS | 5/5 |

---

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {
      "id": "AC-1",
      "type": "acceptance_criterion",
      "description": "GIVEN Sprint 01 needs FlashList, gorhom bottom-sheet, tentap-editor, react-native-markdown-display, WHEN I read apps/mobile/package.json, THEN dependencies contain all four packages with version ranges.",
      "verify": "test -f apps/mobile/package.json && grep -E '\\\"@shopify/flash-list\\\"|\\\"@gorhom/bottom-sheet\\\"|\\\"@10play/tentap-editor\\\"|\\\"react-native-markdown-display\\\"' apps/mobile/package.json | wc -l | grep -E '^[[:space:]]*4$'"
    },
    {
      "id": "AC-2",
      "type": "acceptance_criterion",
      "description": "GIVEN Storybook 9 will be configured by MOB-INFRA-002, WHEN I read apps/mobile/package.json, THEN devDependencies contain @storybook/react-native, addon-ondevice-controls, and addon-ondevice-actions.",
      "verify": "cd apps/mobile && node -e \"const d=require('./package.json').devDependencies; ['@storybook/react-native','@storybook/addon-ondevice-controls','@storybook/addon-ondevice-actions'].forEach(k=>{if(!d[k])process.exit(1)})\""
    },
    {
      "id": "AC-3",
      "type": "acceptance_criterion",
      "description": "GIVEN package.json was edited, WHEN bun install runs, THEN it exits 0 and bun.lock is updated.",
      "verify": "bun install && test -f bun.lock"
    },
    {
      "id": "AC-4",
      "type": "acceptance_criterion",
      "description": "GIVEN new deps are installed, WHEN cd apps/mobile && bun run typecheck runs, THEN tsc --noEmit exits 0.",
      "verify": "cd apps/mobile && bun run typecheck"
    },
    {
      "id": "AC-5",
      "type": "acceptance_criterion",
      "description": "GIVEN lucide-react-native/expo-device/react-native-reanimated/expo-notifications are already present, WHEN I inspect package.json, THEN they appear exactly once each with no version bumps.",
      "verify": "cd apps/mobile && node -e \"const p=require('./package.json'); ['lucide-react-native','expo-device','react-native-reanimated','expo-notifications'].forEach(k=>{const inDep=!!(p.dependencies||{})[k]; const inDev=!!(p.devDependencies||{})[k]; if(inDep&&inDev){process.exit(1)} if(!inDep&&!inDev){process.exit(1)}})\""
    },
    {
      "id": "TC-1",
      "type": "test_criterion",
      "description": "package.json declares the four chat-tree runtime deps.",
      "maps_to_ac": "AC-1",
      "verify": "grep -E '\\\"@shopify/flash-list\\\"|\\\"@gorhom/bottom-sheet\\\"|\\\"@10play/tentap-editor\\\"|\\\"react-native-markdown-display\\\"' apps/mobile/package.json | wc -l | grep -E '^[[:space:]]*4$'"
    },
    {
      "id": "TC-2",
      "type": "test_criterion",
      "description": "package.json declares all three Storybook 9 devDependency packages.",
      "maps_to_ac": "AC-2",
      "verify": "cd apps/mobile && node -e \"const d=require('./package.json').devDependencies; ['@storybook/react-native','@storybook/addon-ondevice-controls','@storybook/addon-ondevice-actions'].forEach(k=>{if(!d[k])process.exit(1)})\""
    },
    {
      "id": "TC-3",
      "type": "test_criterion",
      "description": "bun install completes successfully and writes bun.lock.",
      "maps_to_ac": "AC-3",
      "verify": "bun install && test -f bun.lock"
    },
    {
      "id": "TC-4",
      "type": "test_criterion",
      "description": "bun run typecheck in apps/mobile exits 0 after install.",
      "maps_to_ac": "AC-4",
      "verify": "cd apps/mobile && bun run typecheck"
    },
    {
      "id": "TC-5",
      "type": "test_criterion",
      "description": "Pre-existing required deps appear exactly once each (no dupes, no bumps).",
      "maps_to_ac": "AC-5",
      "verify": "cd apps/mobile && node -e \"const p=require('./package.json'); ['lucide-react-native','expo-device','react-native-reanimated','expo-notifications'].forEach(k=>{const inDep=!!(p.dependencies||{})[k]; const inDev=!!(p.devDependencies||{})[k]; if(inDep&&inDev){process.exit(1)} if(!inDep&&!inDev){process.exit(1)}})\""
    }
  ]
}
-->
