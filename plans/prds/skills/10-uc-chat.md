---
stability: FEATURE_SPEC
last_validated: 2026-05-15
prd_version: 1.0.0
functional_group: CHAT
---

# Use Cases: Chat-Time Resolution (CHAT)

| ID | Title | Description |
|---|---|---|
| UC-CHAT-01 | Type a skill as a slash command | Invoke any registered skill (custom or external) from the chat composer using `/skill-name`. |
| UC-CHAT-02 | Disambiguate with source-qualified skill names | Invoke a specific skill from a specific source when name collisions exist across roots. |
| UC-CHAT-03 | Resolve skills from a 1-second TTL cache | Keep slash command resolution fast by caching the registry query results. |

---

## UC-CHAT-01: Type a skill as a slash command

Invoke any registered skill (custom or external) from the chat composer using the unprefixed form `/skill-name`. The resolver picks the first-wins entry per the deterministic ordering, reads the body, and inlines it into the user's prompt before forwarding to the attached agent.

### Acceptance Criteria

- ☐ User can type `/` in the chat composer and see registered skills appear in the slash command autocomplete list alongside built-in commands
- ☐ User can see skills displayed in a separate `SKILLS` section under the existing `COMMANDS` section in the slash picker popover
- ☐ User can see each skill row in the picker with a `⚡` icon, the skill name, a `<SkillBadge size="sm">` for provenance, and the truncated description
- ☐ User can select a skill from autocomplete with arrow keys + Enter or by typing its name and pressing Enter to invoke it
- ☐ SkillResolver can resolve an unprefixed `/foo` invocation by selecting the row matching `(CASE kind WHEN 'custom' THEN 0 ELSE 1 END, source_priority DESC, created_at ASC) LIMIT 1`
- ☐ System inlines the resolved skill's markdown body into the user's prompt and forwards it to the attached agent as the next user message
- ☐ System renders the resolved skill as a `slash-command` chip in the chat input identical to today's slash command rendering after picker selection

---

## UC-CHAT-02: Disambiguate with source-qualified skill names

Invoke a specific skill from a specific source when the unprefixed form would resolve to a different one. The qualified `/source:skill-name` form bypasses the first-wins ordering and matches the exact `(source_id, name)` pair.

### Acceptance Criteria

- ☐ User can type `/source:foo` (e.g., `/claude:kb-sprint-plan`) in the chat composer to invoke a skill from a specific source root
- ☐ SkillResolver can resolve a qualified `/source:foo` invocation deterministically to the row matching that exact `(source_id, name)` pair
- ☐ User can see source-qualified variants in the slash command autocomplete dropdown when name collisions exist between sources
- ☐ User can see a shadowed entry rendered with reduced opacity and a `(shadowed)` prefix when a higher-priority source claims the same unprefixed name; a sub-row shows the qualified form like `/claude:brainstorm`
- ☐ User can press the right arrow key on a shadowed row in the picker to expand to the qualified form selection
- ☐ System returns a clear in-chat error message when a qualified skill name does not resolve to any registered skill (e.g., `"No skill named claude:does-not-exist. Type / to see available skills."`)

---

## UC-CHAT-03: Resolve skills from a 1-second TTL cache

Keep slash command resolution fast by caching the registry query results in memory with a short TTL. Cache invalidation fires after watcher-triggered transactions commit so the user never sees a stale row.

### Acceptance Criteria

- ☐ SkillResolver can cache skill resolution query results in memory with a 1-second TTL keyed by `(workspace.cwd, query-name)`
- ☐ System invalidates the cache entry within 1 second of any underlying `skills` table mutation (insert, update, delete)
- ☐ System invalidates the cache AFTER the importer transaction commits, never on the raw watcher event, to prevent stale-row reads during in-flight transactions
- ☐ SkillResolver can resolve a typed slash command in under 50ms when the cache is warm
- ☐ System uses the cache as a belt-and-suspenders perf layer; the watcher-driven invalidation is the primary correctness mechanism
