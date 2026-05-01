/**
 * Spawn a Superset workspace + agent session in a fresh OpenComputer sandbox.
 *
 * Runtime is intentionally thin: secret materialization, dockerd boot, and
 * host-service start are all baked into the image's superset-init.sh script.
 * This module is the sandbox-agnostic glue between OpenComputer and the
 * Superset SDK.
 */

import { Sandbox } from "@opencomputer/sdk";
import { SupersetClient } from "@superset/sdk"; // assumed package name
import { REPO_PATH, supersetImage } from "./image";

export interface SpawnArgs {
  doppler: { token: string; project: string; config: string };
  superset: { apiKey: string };
  workspace: { name: string; branch: string };
  agent: { prompt: string; model?: string };
}

export async function spawnSupersetWorkspace(args: SpawnArgs) {
  // Boot from the pre-baked image. The only secret the orchestrator brings is
  // the Doppler token; everything else comes from Doppler at boot time.
  const sandbox = await Sandbox.create({
    image: supersetImage,
    timeout: 3600,
    envs: {
      DOPPLER_TOKEN: args.doppler.token,
      DOPPLER_PROJECT: args.doppler.project,
      DOPPLER_CONFIG: args.doppler.config,
      SUPERSET_API_KEY: args.superset.apiKey,
    },
  });

  // Materialize secrets, start dockerd, start host-service. All baked.
  await sandbox.exec(`/usr/local/bin/superset-init.sh`);

  // SDK calls reach api.superset.sh and route to the host-service in this
  // sandbox via the relay.
  const client = new SupersetClient({ apiKey: args.superset.apiKey });

  // Project create with a hint to register the baked clone instead of cloning
  // again under ~/.superset/repos/.
  const project = await client.projects.create({
    name: "Superset",
    repoCloneUrl: "https://github.com/superset-sh/superset",
    existingClonePath: REPO_PATH,
  });

  const workspace = await client.workspaces.create({
    project: project.id,
    hostId: sandbox.hostId,
    name: args.workspace.name,
    branch: args.workspace.branch,
  });

  // Per-workspace setup: Neon branch, port allocation, Electric container.
  // Lives inside the worktree and reads tier-2 secrets from the root .env.
  await sandbox.exec(`cd ${workspace.worktreePath} && ./.superset/setup.sh`);

  const session = await client.sessions.create({
    workspaceId: workspace.id,
    agent: "claude-code",
    model: args.agent.model ?? "claude-sonnet-4-6",
    prompt: args.agent.prompt,
  });

  return { sandbox, project, workspace, session };
}
