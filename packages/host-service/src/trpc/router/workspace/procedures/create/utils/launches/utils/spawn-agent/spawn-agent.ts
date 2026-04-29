import { buildPromptCommandString } from "@superset/shared/agent-prompt-launch";
import { eq } from "drizzle-orm";
import { hostAgentConfigs } from "../../../../../../../../../db/schema";
import { createTerminalSessionInternal } from "../../../../../../../../../terminal/terminal";
import type { HostServiceContext } from "../../../../../../../../../types";
import { resolveAttachmentPath } from "../../../../../../../attachments";

export interface SpawnAgentArgs {
	ctx: HostServiceContext;
	workspaceId: string;
	agentId: string;
	prompt: string;
	attachmentIds: string[];
}

export interface SpawnAgentResult {
	terminalId: string;
	label: string;
}

/**
 * Looks up the configured agent, resolves attachments to absolute on-disk
 * paths, composes the final prompt, and starts a terminal session running
 * the agent's launch command.
 */
export function spawnAgentTerminal(args: SpawnAgentArgs): {
	result: SpawnAgentResult | null;
	warnings: string[];
} {
	const config = args.ctx.db
		.select({
			label: hostAgentConfigs.label,
			launchCommand: hostAgentConfigs.launchCommand,
			promptInput: hostAgentConfigs.promptInput,
		})
		.from(hostAgentConfigs)
		.where(eq(hostAgentConfigs.id, args.agentId))
		.get();

	if (!config) {
		return {
			result: null,
			warnings: [`Agent config "${args.agentId}" not found — skipping launch`],
		};
	}

	const { finalPrompt, warnings } = attachAttachmentBlock(
		args.prompt,
		args.attachmentIds,
	);

	const terminalId = crypto.randomUUID();
	const command = buildPromptCommandString({
		command: config.launchCommand,
		transport: config.promptInput,
		prompt: finalPrompt,
		randomId: terminalId,
	});

	const result = createTerminalSessionInternal({
		terminalId,
		workspaceId: args.workspaceId,
		db: args.ctx.db,
		initialCommand: command,
	});

	if ("error" in result) {
		warnings.push(`Failed to start agent terminal: ${result.error}`);
		return { result: null, warnings };
	}

	return { result: { terminalId, label: config.label }, warnings };
}

function attachAttachmentBlock(prompt: string, attachmentIds: string[]) {
	const resolved: string[] = [];
	const warnings: string[] = [];
	for (const id of attachmentIds) {
		const r = resolveAttachmentPath(id);
		if (!r) {
			warnings.push(`Attachment "${id}" not found on host — skipping`);
			continue;
		}
		resolved.push(r.path);
	}
	const finalPrompt =
		resolved.length > 0
			? `${prompt}\n\n# Attached files\n\n${resolved.map((p) => `- ${p}`).join("\n")}`
			: prompt;
	return { finalPrompt, warnings };
}
