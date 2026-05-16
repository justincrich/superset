---
stability: FEATURE_SPEC
last_validated: 2026-05-15
prd_version: 1.0.0
functional_group: AUTH
---

# Use Cases: Custom Skill Authoring (AUTH)

| ID | Title | Description |
|---|---|---|
| UC-AUTH-01 | Create a custom skill in Superset | Author a new `kind='custom'` skill via inline markdown editor. |
| UC-AUTH-02 | Edit an existing custom skill | Modify body, description, or frontmatter of a previously authored custom skill. |
| UC-AUTH-03 | Delete a custom skill | Remove a custom-authored skill from the Superset registry. |

---

## UC-AUTH-01: Create a custom skill in Superset

Author a new `kind='custom'` skill directly in the app via the inline markdown editor with explicit frontmatter form fields. Custom skills are stored only in the local SQLite DB and propagate to harnesses via the per-harness exporters.

### Acceptance Criteria

- ☐ User can open a "New skill" editor from the Settings → Skills sidebar via a `+ New custom skill` button
- ☐ User can enter the skill name in a dedicated input field with inline validation against the regex `^[a-z][a-z0-9-]*$`
- ☐ System rejects save when the name fails the regex and shows the inline error `"Use lowercase letters, numbers, and hyphens only — this becomes your /slash-command."`
- ☐ System rejects save when the name collides with another `kind='custom'` skill and shows the inline error `"You already have a custom skill named "{name}". Choose a different name."`
- ☐ System shows a non-blocking yellow warning when the name collides with an external skill: `"An imported skill from {sourceLabel} also uses this name. Your custom version will take priority. Type /{sourceQualifier}:{name} to invoke the imported one."`
- ☐ User can enter a description in a Textarea field; system rejects save when description is empty with the inline error `"Description is required so you and your agent can identify this skill in the slash picker."`
- ☐ User can enter optional frontmatter fields (allowed-tools as comma-separated, model as Select with "Inherit from chat" default)
- ☐ User can enter the markdown body in a Textarea with `[Edit]`/`[Preview]` Tab switcher; preview uses the chat markdown renderer
- ☐ System persists the new skill to the `skills` table with `kind='custom'`, `source_id='superset'`, `enabled=true` on save
- ☐ User can invoke the newly created skill as `/skill-name` in any chat workspace immediately after save without restarting the app

---

## UC-AUTH-02: Edit an existing custom skill

Modify the body, description, or frontmatter of a previously authored custom skill. External skills (`kind='external'`) are read-only — they must be edited at their filesystem origin.

### Acceptance Criteria

- ☐ User can open a custom skill in the SkillEditor by clicking its row in the Settings → Skills sidebar list
- ☐ User can modify the description, body, allowed-tools, and model fields and save changes back to the `skills` table
- ☐ System updates the skill's `updated_at` timestamp and re-materializes it through the active exporters within 2 seconds of save
- ☐ System uses blur-to-save behavior matching the existing AgentDetail editor pattern; footer shows `"Saved Ns ago"` or validation message
- ☐ System routes external (`kind='external'`) skills to the SkillPreview component instead of SkillEditor and renders a read-only view with an `[Open at origin ↗]` button
- ☐ System shows a "Conflict" row in the SkillPreview when a custom skill shadows the external skill being viewed: `"Shadowed by /custom/{name}. Type /{sourceQualifier}:{name} to use this one."`

---

## UC-AUTH-03: Delete a custom skill

Remove a custom-authored skill from the Superset registry. Triggers cleanup of any exporter-materialized artifacts.

### Acceptance Criteria

- ☐ User can delete a custom skill from the SkillEditor via a destructive `Delete` button rendered in the header
- ☐ System opens an AlertDialog with title `"Delete "{skillName}"?"` and description `"This skill will be removed from Superset and can no longer be invoked from chat. Imported skills with the same name will become invokable again."`
- ☐ System hard-deletes the skill row from the `skills` table on user confirmation
- ☐ System triggers exporter teardown for the deleted skill within 2 seconds of confirmation, removing any symlinks under `~/.claude/skills/superset-skills/<name>/` and any materialized files in `~/.superset/skills-bundle/<name>/`
- ☐ System prevents the user from typing the deleted skill's name as an unprefixed slash command after deletion
- ☐ System hides the `Delete` button entirely for `kind='external'` skills (no soft-delete path on read-only entries)
