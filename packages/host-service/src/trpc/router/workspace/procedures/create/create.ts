import { TRPCError } from "@trpc/server";
import { protectedProcedure } from "../../../../index";
import { workspaceCreateInputSchema } from "./schemas";
import { type LaunchOutput, runLaunches } from "./utils/launches";
import { runAdopt } from "./utils/run-adopt";
import { runCheckout } from "./utils/run-checkout";
import { runFork } from "./utils/run-fork";
import { runPrCheckout } from "./utils/run-pr-checkout";
import { startSetupTerminalIfPresent } from "./utils/setup-terminal";

/**
 * Single host-service entry for workspace creation. Dispatches by
 * `mode.kind` to the appropriate worktree-creation routine, then runs the
 * setup terminal (if `.superset/setup.sh` present) and any caller-supplied
 * launches in input order.
 *
 * AI rename signal: the first agent launch's `prompt` (already composed
 * by the renderer including linked PR/issue context). Gated by the input's
 * `autoRenameAfterCreate` flag — false when the renderer prefilled `name`
 * from a user edit, PR title, or linked-issue title.
 */
export const create = protectedProcedure
	.input(workspaceCreateInputSchema)
	.mutation(async ({ ctx, input }) => {
		if (!ctx.api) {
			throw new TRPCError({
				code: "PRECONDITION_FAILED",
				message: "Cloud API not configured",
			});
		}

		const launches = input.launches ?? [];
		const firstAgentLaunch = launches.find((l) => l.kind === "agent");
		const aiRenamePrompt =
			firstAgentLaunch?.kind === "agent" ? firstAgentLaunch.prompt : undefined;
		const autoRenameAfterCreate = input.autoRenameAfterCreate ?? false;

		let runResult: {
			workspace: {
				id: string;
				projectId: string;
				name: string;
				branch: string;
			};
			worktreePath: string;
			warnings?: string[];
		};

		switch (input.mode.kind) {
			case "fork":
				runResult = await runFork({
					ctx,
					id: input.id,
					projectId: input.projectId,
					name: input.name,
					autoRenameAfterCreate,
					aiRenamePrompt,
					branchName: input.mode.branchName,
					baseBranch: input.mode.baseBranch,
					baseBranchSource: input.mode.baseBranchSource,
				});
				break;
			case "checkout":
				runResult = await runCheckout({
					ctx,
					id: input.id,
					projectId: input.projectId,
					name: input.name,
					autoRenameAfterCreate,
					aiRenamePrompt,
					branchName: input.mode.branchName,
				});
				break;
			case "pr-checkout":
				runResult = await runPrCheckout({
					ctx,
					id: input.id,
					projectId: input.projectId,
					name: input.name,
					pr: input.mode.pr,
				});
				break;
			case "adopt":
				runResult = await runAdopt({
					ctx,
					id: input.id,
					projectId: input.projectId,
					name: input.name,
					autoRenameAfterCreate,
					aiRenamePrompt,
					branchName: input.mode.branchName,
					worktreePath: input.mode.worktreePath,
				});
				break;
		}

		const launchOutputs: LaunchOutput[] = [];
		const warnings: string[] = [...(runResult.warnings ?? [])];

		const setupResult = startSetupTerminalIfPresent({
			ctx,
			workspaceId: runResult.workspace.id,
			worktreePath: runResult.worktreePath,
		});
		if (setupResult.warning) warnings.push(setupResult.warning);
		if (setupResult.terminal) {
			launchOutputs.push({
				kind: "terminal",
				terminalId: setupResult.terminal.terminalId,
				label: setupResult.terminal.label,
			});
		}

		const { outputs, warnings: launchWarnings } = runLaunches({
			ctx,
			workspaceId: runResult.workspace.id,
			launches,
		});
		launchOutputs.push(...outputs);
		warnings.push(...launchWarnings);

		return {
			workspace: runResult.workspace,
			launches: launchOutputs,
			warnings,
		};
	});
