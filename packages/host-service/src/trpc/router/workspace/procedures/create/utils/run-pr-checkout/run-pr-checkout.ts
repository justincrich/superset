import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { TRPCError } from "@trpc/server";
import type { HostServiceContext } from "../../../../../../../types";
import {
	type LocalProject,
	requireLocalProject,
} from "../../../../../project/utils/local-project";
import { safeResolveWorktreePath } from "../../../../../project/utils/worktree-paths";
import { enablePushAutoSetupRemote } from "../git-config";
import { registerWorkspace } from "../register-workspace";
import { execGh } from "./utils/exec-gh";
import { derivePrLocalBranchName } from "./utils/pr-branch-name";

export interface RunPrCheckoutArgs {
	ctx: HostServiceContext;
	id?: string;
	projectId: string;
	name: string;
	pr: {
		number: number;
		headRefName: string;
		headRepositoryOwner: string;
		isCrossRepository: boolean;
		state: "open" | "closed" | "merged";
	};
}

export interface RunPrCheckoutResult {
	workspace: { id: string; projectId: string; name: string; branch: string };
	worktreePath: string;
	localProject: LocalProject;
	warnings: string[];
}

export async function runPrCheckout(
	args: RunPrCheckoutArgs,
): Promise<RunPrCheckoutResult> {
	const localProject = requireLocalProject(args.ctx, args.projectId);
	const branch = derivePrLocalBranchName(args.pr);

	const worktreePath = safeResolveWorktreePath(localProject.id, branch);
	mkdirSync(dirname(worktreePath), { recursive: true });
	const git = await args.ctx.git(localProject.repoPath);

	// Detect a pre-existing local branch BEFORE running `gh pr checkout
	// --force`. `--force` would reset it to PR HEAD, silently losing any
	// unpushed commits. Surface a warning pointing at reflog for recovery.
	let preExistingLocalBranch = false;
	try {
		await git.raw(["show-ref", "--verify", "--quiet", `refs/heads/${branch}`]);
		preExistingLocalBranch = true;
	} catch {
		// branch doesn't exist — expected
	}

	// Detached worktree first — `gh pr checkout` inside it creates the
	// branch with correct fork-remote + upstream config. Mirrors v1's
	// `createWorktreeFromPr`.
	try {
		await git.raw(["worktree", "add", "--detach", worktreePath]);
	} catch (err) {
		throw new TRPCError({
			code: "CONFLICT",
			message:
				err instanceof Error ? err.message : "Failed to add detached worktree",
		});
	}

	try {
		await execGh(
			["pr", "checkout", String(args.pr.number), "--branch", branch, "--force"],
			{ cwd: worktreePath, timeout: 120_000 },
		);
	} catch (err) {
		await git
			.raw(["worktree", "remove", "--force", worktreePath])
			.catch((rollbackErr) => {
				console.warn(
					"[workspace.create:pr-checkout] failed to rollback PR worktree",
					{ worktreePath, err: rollbackErr },
				);
			});
		throw new TRPCError({
			code: "INTERNAL_SERVER_ERROR",
			message: `gh pr checkout failed: ${
				err instanceof Error ? err.message : String(err)
			}`,
		});
	}

	await enablePushAutoSetupRemote(
		git,
		worktreePath,
		"[workspace.create:pr-checkout]",
	);

	const warnings: string[] = [];
	if (args.pr.state !== "open") {
		warnings.push(
			`PR is ${args.pr.state} — commits are included, but the PR may not merge.`,
		);
	}
	if (preExistingLocalBranch) {
		warnings.push(
			`Reset existing local branch "${branch}" to PR HEAD. If you had unpushed commits there, recover them via \`git reflog show ${branch}\`.`,
		);
	}

	const cloudRow = await registerWorkspace({
		ctx: args.ctx,
		id: args.id,
		projectId: args.projectId,
		name: args.name,
		branch,
		worktreePath,
		rollback: async () => {
			try {
				await git.raw(["worktree", "remove", "--force", worktreePath]);
			} catch (err) {
				console.warn(
					"[workspace.create:pr-checkout] failed to rollback worktree",
					{ worktreePath, err },
				);
			}
		},
	});

	return {
		workspace: {
			id: cloudRow.id,
			projectId: cloudRow.projectId,
			name: cloudRow.name,
			branch,
		},
		worktreePath,
		localProject,
		warnings,
	};
}
