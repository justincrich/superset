---
stability: FEATURE_SPEC
last_validated: 2026-05-16
prd_version: 1.2.0
functional_group: TSGO
---

# Use Cases: Typechecker Migration (TSGO)

Sprint 1 of the initiative. Replace `tsc` with `@typescript/native-preview` (tsgo) across the monorepo for fast typechecking. Sprint 1 status: ✅ Completed. The acceptance criteria below describe the developer surface in the running tool — verified by invoking the typecheck command on the monorepo.

| ID | Title | Description |
|---|---|---|
| UC-TSGO-01 | Full-monorepo typecheck via tsgo | Run the workspace typecheck command and observe fast results across all 28 packages. |
| UC-TSGO-02 | Per-package incremental typecheck | Typecheck a single package quickly during focused work without re-running the whole graph. |
| UC-TSGO-03 | Pre-typecheck generator hooks still work | Packages that generate files before typechecking (route trees, file-icon manifests, MDX collections) continue to work via the existing `pretypecheck` hook. |

---

## UC-TSGO-01: Full-monorepo typecheck via tsgo

A developer or wrapped agent invokes `bun run typecheck` at the workspace root and gets fast type-check results across all 28 packages. This replaces the previous tsc-based check.

### Acceptance Criteria

- ☐ User can run `bun run typecheck` from the project root and observe a successful exit code with all 28 packages reported when no type errors exist
- ☐ User can observe a cold-cache typecheck complete in under 5 seconds on a typical developer machine
- ☐ User can observe a warm-cache typecheck complete in under 1 second (Turbo full cache hit)
- ☐ System reports the task count (`28 successful, 28 total`) and execution time at completion
- ☐ System emits errors in the same format as tsc so existing CI parsers and editor integrations continue to work

---

## UC-TSGO-02: Per-package incremental typecheck

A developer iterating on a single package can typecheck just that package without re-running the workspace graph.

### Acceptance Criteria

- ☐ User can `cd` into any package directory and run `bun run typecheck` to type-check only that package
- ☐ User can run `bunx tsgo --noEmit` directly inside a package and get the same results
- ☐ System completes a typical per-package typecheck in under 1 second on warm cache and under 3 seconds cold
- ☐ System honors the package's own `tsconfig.json` settings (extends chain, paths, types) without falling back to monorepo defaults

---

## UC-TSGO-03: Pre-typecheck generator hooks still work

Bun's `pretypecheck` lifecycle hook runs before `typecheck` so packages that depend on generated files (TanStack Router's `routeTree.gen`, file-icon manifests, fumadocs-mdx collections) continue to type-check without manual preparation.

### Acceptance Criteria

- ☐ System runs `bun run generate:icons && bun run generate:routes` automatically before tsgo when a user runs `bun run typecheck` in `apps/desktop`
- ☐ System runs `fumadocs-mdx && next typegen` automatically before tsgo when a user runs `bun run typecheck` in `apps/docs`
- ☐ User can clone a fresh workspace and run `bun run typecheck` from the root and observe all 28 packages succeed without manual pre-generation
