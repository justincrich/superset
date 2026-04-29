import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { TRPCError } from "@trpc/server";
import {
	asRemoteRef,
	type ResolvedRef,
	resolveDefaultBranchName,
	resolveUpstream,
} from "../../../../../../../runtime/git/refs";
import type { HostServiceContext } from "../../../../../../../types";
import {
	type LocalProject,
	requireLocalProject,
} from "../../../../../project/utils/local-project";
import { safeResolveWorktreePath } from "../../../../../project/utils/worktree-paths";
import { applyAiRename } from "../ai-rename";
import { enablePushAutoSetupRemote } from "../git-config";
import { listBranchNames } from "../list-branch-names";
import { registerWorkspace } from "../register-workspace";
import { deduplicateBranchName } from "../sanitize-branch";
import { resolveStartPoint } from "./utils/resolve-start-point";
import { buildStartPointFromHint } from "./utils/start-point";

export interface RunForkArgs {
	ctx: HostServiceContext;
	id?: string;
	projectId: string;
	name: string;
	autoRenameAfterCreate: boolean;
	aiRenamePrompt: string | undefined;
	branchName: string;
	baseBranch?: string;
	baseBranchSource?: "local" | "remote-tracking";
}

export interface RunForkResult {
	workspace: { id: string; projectId: string; name: string; branch: string };
	worktreePath: string;
	localProject: LocalProject;
}

export async function runFork(args: RunForkArgs): Promise<RunForkResult> {
	const localProject = requireLocalProject(args.ctx, args.projectId);

	const existingBranches = await listBranchNames(
		args.ctx,
		localProject.repoPath,
	);
	const branchName = deduplicateBranchName(args.branchName, existingBranches);

	const worktreePath = safeResolveWorktreePath(localProject.id, branchName);
	mkdirSync(dirname(worktreePath), { recursive: true });

	const git = await args.ctx.git(localProject.repoPath);

	let startPoint: ResolvedRef =
		args.baseBranch && args.baseBranchSource
			? buildStartPointFromHint(args.baseBranch, args.baseBranchSource)
			: await resolveStartPoint(git, args.baseBranch);

	// Local default branches are rarely fast-forwarded; swap to the branch's
	// configured upstream so we fork from the real tip, not a stale local ref.
	if (startPoint.kind === "local") {
		const defaultBranchName = await resolveDefaultBranchName(git);
		if (startPoint.shortName === defaultBranchName) {
			const upstream = await resolveUpstream(git, defaultBranchName);
			if (upstream) {
				const remoteRef = asRemoteRef(upstream.remote, upstream.remoteBranch);
				const remoteExists = await git
					.raw(["rev-parse", "--verify", "--quiet", `${remoteRef}^{commit}`])
					.then(() => true)
					.catch(() => false);
				if (remoteExists) {
					startPoint = {
						kind: "remote-tracking",
						fullRef: remoteRef,
						shortName: upstream.remoteBranch,
						remote: upstream.remote,
						remoteShortName: `${upstream.remote}/${upstream.remoteBranch}`,
					};
				}
			}
		}
	}

	if (startPoint.kind === "remote-tracking") {
		try {
			await git.fetch([
				startPoint.remote,
				startPoint.shortName,
				"--quiet",
				"--no-tags",
			]);
		} catch (err) {
			console.warn(
				`[workspace.create:fork] fetch ${startPoint.remoteShortName} failed, proceeding with local ref:`,
				err,
			);
		}
	}

	const startPointArg =
		startPoint.kind === "head" ? "HEAD" : startPoint.shortName;
	try {
		await git.raw([
			"worktree",
			"add",
			"--no-track",
			"-b",
			branchName,
			worktreePath,
			startPoint.kind === "remote-tracking"
				? startPoint.remoteShortName
				: startPointArg,
		]);
	} catch (err) {
		throw new TRPCError({
			code: "CONFLICT",
			message: err instanceof Error ? err.message : "Failed to add worktree",
		});
	}

	await enablePushAutoSetupRemote(git, worktreePath, "[workspace.create:fork]");

	if (startPoint.kind !== "head") {
		await git
			.raw(["config", `branch.${branchName}.base`, startPoint.shortName])
			.catch((err) => {
				console.warn(
					`[workspace.create:fork] failed to record base branch ${startPoint.shortName}:`,
					err,
				);
			});
	}

	const cloudRow = await registerWorkspace({
		ctx: args.ctx,
		id: args.id,
		projectId: args.projectId,
		name: args.name,
		branch: branchName,
		worktreePath,
		rollback: async () => {
			try {
				await git.raw(["worktree", "remove", worktreePath]);
			} catch (err) {
				console.warn("[workspace.create:fork] failed to rollback worktree", {
					worktreePath,
					err,
				});
			}
		},
	});

	const renamePrompt = args.aiRenamePrompt?.trim();
	if (args.autoRenameAfterCreate && renamePrompt) {
		void applyAiRename({
			ctx: args.ctx,
			workspaceId: cloudRow.id,
			prompt: renamePrompt,
			branchRename: {
				repoPath: localProject.repoPath,
				worktreePath,
				oldBranchName: branchName,
			},
		}).catch((err) => {
			console.warn("[workspace.create:fork] AI rename failed", err);
		});
	}

	return {
		workspace: {
			id: cloudRow.id,
			projectId: cloudRow.projectId,
			name: cloudRow.name,
			branch: branchName,
		},
		worktreePath,
		localProject,
	};
}
