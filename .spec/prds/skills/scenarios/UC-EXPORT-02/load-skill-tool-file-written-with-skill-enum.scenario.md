---
service: skills
feature: UC-EXPORT-02
priority: P1
type: happy_path
---
# MastraExporter writes load_skill tool with skill enum + loopback token

With 12 enabled skills in the registry and `~/.mastracode/` present, MastraExporter.sync() generates a TypeScript file at `~/.mastracode/tools/superset-skills.ts`. The file contents include: a `createTool({ id: 'load_skill', ... })` block; an `inputSchema` whose `name` field is a `z.enum([...])` containing all 12 skill names; a `description` field listing each skill on its own line `name — description`; and an `execute()` body that performs an HTTPS GET against `http://127.0.0.1:<port>/skills/<name>/body` with the loopback token in an Authorization header. The token file is at `~/.mastracode/tools/.superset-token` with mode 0600. A subsequent mastracode session that calls `load_skill({name: 'brainstorm'})` receives the body as the tool result.
