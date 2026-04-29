import { TRPCError } from "@trpc/server";
import { createTerminalSessionInternal } from "../../../../../../../terminal/terminal";
import type { HostServiceContext } from "../../../../../../../types";
import type { WorkspaceCreateLaunch } from "../../schemas";
import { spawnAgentTerminal } from "./utils/spawn-agent";

export type LaunchOutput =
	| { kind: "terminal"; terminalId: string; label?: string }
	| { kind: "chat"; chatSessionId: string; label?: string };

export interface RunLaunchesArgs {
	ctx: HostServiceContext;
	workspaceId: string;
	launches: WorkspaceCreateLaunch[];
}

/**
 * Iterates `launches[]` in input order. Returns one output entry per
 * successful launch (chat is currently NOT_IMPLEMENTED — fail-fast at the
 * first chat launch). Failures within a launch (missing agent config,
 * unresolvable attachments) yield warnings but don't abort the batch.
 */
export function runLaunches(args: RunLaunchesArgs): {
	outputs: LaunchOutput[];
	warnings: string[];
} {
	const outputs: LaunchOutput[] = [];
	const warnings: string[] = [];

	for (const launch of args.launches) {
		switch (launch.kind) {
			case "terminal": {
				const terminalId = crypto.randomUUID();
				const result = createTerminalSessionInternal({
					terminalId,
					workspaceId: args.workspaceId,
					db: args.ctx.db,
					initialCommand: launch.command,
				});
				if ("error" in result) {
					warnings.push(`Failed to start terminal launch: ${result.error}`);
					break;
				}
				outputs.push({ kind: "terminal", terminalId, label: launch.label });
				break;
			}
			case "agent": {
				const { result, warnings: launchWarnings } = spawnAgentTerminal({
					ctx: args.ctx,
					workspaceId: args.workspaceId,
					agentId: launch.agentId,
					prompt: launch.prompt ?? "",
					attachmentIds: launch.attachmentIds ?? [],
				});
				warnings.push(...launchWarnings);
				if (result) {
					outputs.push({
						kind: "terminal",
						terminalId: result.terminalId,
						label: result.label,
					});
				}
				break;
			}
			case "chat":
				throw new TRPCError({
					code: "NOT_IMPLEMENTED",
					message:
						"Chat launches will be wired up when chat config gets a V2 surface",
				});
		}
	}

	return { outputs, warnings };
}
