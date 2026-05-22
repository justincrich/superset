# Parallel challenger review (archived, non-binding)

A second `code-reviewer` agent ran in parallel during the challenger phase and delivered its review after the binding SCOPE.md was already committed. Its findings independently confirm the binding decision; this file preserves the parallel pass for audit purposes only.

**Status**: archival reference. The authoritative scope contract is `SCOPE.md` (HEAD on this branch).

## Key concurrences with primary challenger (in SCOPE.md `## Challenge`)
- Evidence verification: PASS, with the same line-range imprecisions noted (v2 over-cites start by 2 lines; v1 over-cites end by 3 lines)
- No viable smaller-than-minimum option (3 candidates rejected, including Candidate C "partial 2-of-3 collapse — keep Model as own pill")
- Minimum resolves the symptom: TRUE
- Moderate has no hidden scope creep
- Strategic flagged as premature; Rule of 2 violation
- frontend-designer's Option B is an implementation-level refinement, not a separate scope tier — absorbed into moderate

## Parallel review's additional emphasis (non-binding refinements)
- The strategic LOC budget (~150) does NOT include the `PermissionMode`/`ThinkingLevel` type-extraction work needed to break the `packages/ui` → `apps/desktop` circular dependency. (Primary challenger flagged the same type-boundary concern; parallel review framed it sharper as a budget undercount.)
- Candidate C "overflow hide" rejection rationale: hides permission mode (safety-relevant control) behind an extra click, regressing at-a-glance Manual-mode confirmation. (Primary rejected the same candidate for a similar reason — intent mismatch with ticket.)

## Open-questions classification (informational; both Q1 and Q2 already resolved by human)

| # | Question | Classification | Outcome |
|---|----------|----------------|---------|
| 1 | Permission mode icon in trigger? | Human decision | RESOLVED: YES (binding AC-3) |
| 2 | BrainIcon always vs. only-when-active? | Human decision | RESOLVED: always-visible-dimmed-when-off → revised to `text-muted-foreground` via amendment §1 (AC-4) |
| 3 | ChevronDown on trigger? | Implementer's call | Removed (binding AC-2) |
| 4 | Model row truncation inside menu? | Implementer's call | `truncate` with no fixed max-w (Q4 in SCOPE.md) |
| 5 | `onSelect` vs `onClick`? | Implementer's call | `onSelect` throughout (binding AC-9, AC-10) |

## Recommended options (parallel)
- minimum or moderate — strategic NOT recommended (premature)
- Human picked **moderate** (consistent with parallel recommendation)
