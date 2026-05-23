---
task_id: REMED-008
sprint: ./SPRINT-01b-remediation.md
parent_sprint_id: sprint-01b-remediation
agent: react-native-ui-implementer
estimate_minutes: 15
task_type: BUG_FIX
status: Backlog
priority: P2
effort: XS
prd_refs: [TS-5]
upstream_review: red-hat 2026-05-23 DG-15
---

# REMED-008 — Fix SlashCommandOption USER badge variant (destructive → live)

## Background

**Problem:** `apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx:31`
maps the `user` source kind to the `destructive` Badge variant:
```tsx
const SOURCE_VARIANT: Record<SlashCommandSourceKind, BadgeVariant> = {
  builtin: "secondary",
  user: "destructive",      // ← WRONG: USER scope should be green/live
  project: "default",
};
```

This makes user-scoped slash commands appear in red/destructive styling.
USER-scope commands are personal commands the user defined for themselves —
they are NOT dangerous. Red conveys the wrong semantic.

Per `designs/AUDIT.md` TS-5 cross-reference, USER source should map to
the `live` (green) badge variant — matching the running/streaming color
that signals user-personalization.

**Why it matters:** Visual semantics drive trust. A red badge next to
`/deploy` (user-scoped) reads as "dangerous" when it's actually "your
personal command."

**Current:** USER = destructive (red).

**Desired:** USER = live (green). Or, if Badge doesn't have a `live`
variant in the rn-reusables vocab, map to the closest "personal"
semantic — likely a `default` variant with a `live-fg` text override or
a new `live` variant exposed.

## CRITICAL CONSTRAINTS

- **MUST** verify the rn-reusables `Badge` component supports a `live` variant before assuming. If not, use the existing live-fg color via className override.
- **MUST** keep `builtin` and `project` mappings unchanged.
- **NEVER** introduce a "live" Badge variant by editing `apps/mobile/components/ui/badge.tsx` — vendor primitive is immutable per `apps/mobile/components/ui/AUDIT.md`.

## SPECIFICATION

**Objective:** Re-map the USER slash-command source's badge from destructive (red) to live (green) semantic.

**Success state:** In Storybook (`Views/Chat/02-ChatView · Slash-command popover`), USER-source command rows render with a green/live badge — visually distinct from project/built-in but NOT red.

## ACCEPTANCE CRITERIA

### AC-1: USER mapping no longer uses destructive
**Given** `apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx`,
**When** I grep for the SOURCE_VARIANT map,
**Then** the `user` value is NOT `"destructive"`.

**Verify:** `grep -A 5 "SOURCE_VARIANT\|sourceVariant" apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx | grep "user:" | grep -v destructive` → 1+ match

### AC-2: USER mapping uses live/green semantic
**Given** the SOURCE_VARIANT map (or equivalent),
**When** I inspect the `user` value,
**Then** it resolves to a green/live appearance — either a Badge variant named `live` if available, OR a default Badge with `text-state-live-fg` / `bg-state-live-bg` className override.

**Verify:** `grep -A 5 "user:" apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx` → "live" reference OR className override with state-live tokens

### AC-3: builtin + project unchanged
**Given** the SOURCE_VARIANT map,
**When** I diff against pre-change state,
**Then** `builtin: "secondary"` and `project: "default"` remain unchanged.

**Verify:** `git diff apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx | grep -E "(builtin|project):"` → no diff hunks

### AC-4: storybook USER row renders green
**Given** the storybook `Views/Chat/02-ChatView · Slash-command popover` story,
**When** I view a USER-source command row (`/deploy` in mock data),
**Then** its source badge renders with green/live coloring, not red/destructive.

**Verify:** Manual storybook check

### AC-5: typecheck + lint pass
**Given** the edits,
**When** I run typecheck + lint,
**Then** EXIT 0.

**Verify:** `cd apps/mobile && bun run typecheck` + `bun run lint apps/mobile/components/SlashCommandOption/` → EXIT 0

## TEST CRITERIA

| ID | Statement | maps_to_ac | Verify |
|---|---|---|---|
| TC-1 | `user:` mapping no longer equals `"destructive"` | AC-1 | grep |
| TC-2 | `user:` mapping references live/green semantic (Badge variant OR className override with state-live tokens) | AC-2 | grep |
| TC-3 | `builtin:` and `project:` mappings unchanged | AC-3 | git diff |
| TC-4 | USER-source row in slash-command popover storybook renders green | AC-4 | manual storybook |
| TC-5 | `bun run typecheck` exits 0 | AC-5 | bash exit code |
| TC-6 | `bun run lint` for SlashCommandOption exits 0 | AC-5 | bash exit code |

## READING LIST

| Path | Lines | Focus |
|---|---|---|
| `apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx` | 25-45 | SOURCE_VARIANT map + Badge usage |
| `apps/mobile/components/ui/badge.tsx` | full | Vendor Badge variant inventory — confirm what's available |
| `apps/mobile/components/ui/AUDIT.md` | full | Vendor immutability rule + token-bypass divergences |
| `apps/mobile/screens/chat-view/mock-data.tsx` | MOCK_SLASH_COMMANDS | Has `/deploy` USER-source example for visual check |
| `apps/mobile/global.css` | state palette section | `--color-state-live-bg`, `--color-state-live-fg` tokens |

## GUARDRAILS

**WRITE-ALLOWED:**
- `apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx` (MODIFY) — only the SOURCE_VARIANT map entry for `user`, possibly the className composition where the badge is rendered.

**WRITE-PROHIBITED:**
- `apps/mobile/components/ui/badge.tsx` (vendor primitive, immutable per AUDIT.md).
- Any other variant mapping or the rendered badge text.
- Storybook stories.

## CODE PATTERN

### Reference (current, buggy)
**Source:** `apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx:28-32`
```tsx
const SOURCE_VARIANT: Record<SlashCommandSourceKind, BadgeVariant> = {
  builtin: "secondary",
  user: "destructive",   // ← Wrong semantic
  project: "default",
};
```

### Target option A (if Badge has live variant)
```tsx
const SOURCE_VARIANT: Record<SlashCommandSourceKind, BadgeVariant> = {
  builtin: "secondary",
  user: "live",       // ← personal-scope green
  project: "default",
};
```

### Target option B (if Badge does NOT have live variant — likely)
```tsx
const SOURCE_VARIANT: Record<SlashCommandSourceKind, BadgeVariant> = {
  builtin: "secondary",
  user: "default",     // ← neutral base
  project: "default",
};

// Custom className override at the Badge render call site:
<Badge
  variant={SOURCE_VARIANT[source]}
  className={cn(source === "user" && "bg-state-live-bg")}
>
  <Text className={cn(source === "user" && "text-state-live-fg")}>{source}</Text>
</Badge>
```

### Anti-pattern
- Editing `badge.tsx` to add a `live` variant — violates vendor immutability rule.
- Hardcoding hex green — use `--color-state-live-*` tokens via NativeWind classes.

## DESIGN

**References:**
- Red-hat review DG-15
- `designs/AUDIT.md` TS-5 source-kind variant table
- `apps/mobile/components/ui/AUDIT.md` (vendor immutability)
- State palette in `global.css` (live tokens)

**Pattern source:** `apps/mobile/components/StatusDot/StatusDot.tsx` uses `--color-state-live-fg` via NativeWind classes — same idiom

**Anti-pattern:** Inline hex `#50a878`; bypassing tokens; running `npx @react-native-reusables/cli@latest add badge` to "upgrade" the vendor — that resets local theme bindings.

## VERIFICATION GATES

| Gate | Command | Expected |
|---|---|---|
| user no destructive | `grep -A 5 "SOURCE_VARIANT" apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx \| grep "user:"` | No "destructive" on user line |
| live semantic present | `grep -A 5 "user:" apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx` | "live" OR state-live-* className |
| builtin/project unchanged | `git diff apps/mobile/components/SlashCommandOption/SlashCommandOption.tsx \| grep -E "(builtin\|project):"` | No diff |
| Typecheck | `cd apps/mobile && bun run typecheck` | EXIT 0 |
| Lint | `bun run lint apps/mobile/components/SlashCommandOption/` | EXIT 0 |

## AGENT INSTRUCTIONS

1. READ `badge.tsx` to inventory available variants — confirm if `live` exists or not.
2. RED — verify current `user: "destructive"` (grep).
3. GREEN — apply option A (if Badge has live) OR option B (className override approach).
4. Verify in storybook by viewing the slash-command popover view.
5. Verify all 6 TCs.

## AGENT ASSIGNMENT

**Agent:** `react-native-ui-implementer`
**Rationale:** Single-component TSX edit, NativeWind class composition. RN UI domain.

## DEPENDENCIES

- **depends_on:** none
- **blocks:** none

## NOTES

15-min estimate is realistic only if option A is available (1-line
change). If option B is required (className override), expect closer to
the upper bound.

<!-- REQUIREMENT-CONTRACT v1 -->
<!--
{
  "requirements": [
    {"id": "AC-1", "type": "acceptance_criterion", "description": "GIVEN SlashCommandOption.tsx WHEN I grep SOURCE_VARIANT THEN user value is NOT destructive", "verify": "grep -A 5 SOURCE_VARIANT | grep user: | grep -v destructive"},
    {"id": "AC-2", "type": "acceptance_criterion", "description": "GIVEN the map WHEN I inspect user value THEN it resolves to green/live (variant OR className override)", "verify": "grep -A 5 user:"},
    {"id": "AC-3", "type": "acceptance_criterion", "description": "GIVEN the map WHEN I diff against pre-change THEN builtin and project unchanged", "verify": "git diff | grep -E '(builtin|project):'"},
    {"id": "AC-4", "type": "acceptance_criterion", "description": "GIVEN slash-command popover storybook WHEN I view USER source row THEN badge renders green not red", "verify": "manual storybook"},
    {"id": "AC-5", "type": "acceptance_criterion", "description": "GIVEN edits WHEN typecheck + lint run THEN EXIT 0", "verify": "bun run typecheck && bun run lint"},
    {"id": "TC-1", "type": "test_criterion", "description": "user mapping no longer equals destructive", "maps_to_ac": "AC-1", "verify": "grep"},
    {"id": "TC-2", "type": "test_criterion", "description": "user mapping references live/green semantic", "maps_to_ac": "AC-2", "verify": "grep"},
    {"id": "TC-3", "type": "test_criterion", "description": "builtin and project mappings unchanged", "maps_to_ac": "AC-3", "verify": "git diff"},
    {"id": "TC-4", "type": "test_criterion", "description": "USER row in storybook renders green", "maps_to_ac": "AC-4", "verify": "manual storybook"},
    {"id": "TC-5", "type": "test_criterion", "description": "bun run typecheck exits 0", "maps_to_ac": "AC-5", "verify": "bash exit code"},
    {"id": "TC-6", "type": "test_criterion", "description": "bun run lint for SlashCommandOption exits 0", "maps_to_ac": "AC-5", "verify": "bash exit code"}
  ]
}
-->
