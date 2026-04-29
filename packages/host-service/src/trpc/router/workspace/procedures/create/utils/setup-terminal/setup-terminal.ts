import { existsSync } from "node:fs";
import { join } from "node:path";
import { createTerminalSessionInternal } from "../../../../../../../terminal/terminal";
import type { HostServiceContext } from "../../../../../../../types";

export interface SetupTerminalDescriptor {
	terminalId: string;
	label: string;
}

/**
 * Starts the workspace setup terminal if `.superset/setup.sh` exists in the
 * worktree. Always runs (no opt-out) — host-side hook for project owners.
 */
export function startSetupTerminalIfPresent(args: {
	ctx: HostServiceContext;
	workspaceId: string;
	worktreePath: string;
}): { terminal: SetupTerminalDescriptor | null; warning: string | null } {
	const setupScriptPath = join(args.worktreePath, ".superset", "setup.sh");
	if (!existsSync(setupScriptPath)) {
		return { terminal: null, warning: null };
	}

	const terminalId = crypto.randomUUID();
	const result = createTerminalSessionInternal({
		terminalId,
		workspaceId: args.workspaceId,
		db: args.ctx.db,
		initialCommand: `bash ${singleQuote(setupScriptPath)}`,
	});
	if ("error" in result) {
		return {
			terminal: null,
			warning: `Failed to start setup terminal: ${result.error}`,
		};
	}

	return {
		terminal: { terminalId, label: "Workspace Setup" },
		warning: null,
	};
}

function singleQuote(value: string): string {
	return `'${value.replaceAll("'", "'\\''")}'`;
}
