import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { TRPCError } from "@trpc/server";
import { resolveRef } from "../../../../../../../runtime/git/refs";
import type { HostServiceContext } from "../../../../../../../types";
import {
	type LocalProject,
	requireLocalProject,
} from "../../../../../project/utils/local-project";
import { safeResolveWorktreePath } from "../../../../../project/utils/worktree-paths";
import { applyAiRename } from "../ai-rename";
import { enablePushAutoSetupRemote } from "../git-config";
import { registerWorkspace } from "../register-workspace";

export interface RunCheckoutArgs {
	ctx: HostServiceContext;
	id?: string;
	projectId: string;
	name: string;
	autoRenameAfterCreate: boolean;
	aiRenamePrompt: string | undefined;
	branchName: string;
}

export interface RunCheckoutResult {
	workspace: { id: string; projectId: string; name: string; branch: string };
	worktreePath: string;
	localProject: LocalProject;
}

export async function runCheckout(
	args: RunCheckoutArgs,
): Promise<RunCheckoutResult> {
	const localProject = requireLocalProject(args.ctx, args.projectId);

	const branch = args.branchName.trim();
	if (!branch) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Branch name is empty",
		});
	}

	const worktreePath = safeResolveWorktreePath(localProject.id, branch);
	mkdirSync(dirname(worktreePath), { recursive: true });
	const git = await args.ctx.git(localProject.repoPath);

	const resolved = await resolveRef(git, branch);
	if (!resolved || resolved.kind === "head" || resolved.kind === "tag") {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message:
				resolved?.kind === "tag"
					? `"${branch}" is a tag, not a branch — cannot check out into a workspace`
					: `Branch "${branch}" does not exist locally or on origin`,
		});
	}

	if (resolved.kind === "remote-tracking") {
		try {
			await git.fetch([
				resolved.remote,
				resolved.shortName,
				"--quiet",
				"--no-tags",
			]);
		} catch (err) {
			console.warn(
				`[workspace.create:checkout] fetch ${resolved.remoteShortName} failed:`,
				err,
			);
		}
	}

	try {
		await git.raw(
			resolved.kind === "remote-tracking"
				? [
						"worktree",
						"add",
						"--track",
						"-b",
						branch,
						worktreePath,
						resolved.remoteShortName,
					]
				: ["worktree", "add", worktreePath, resolved.shortName],
		);
	} catch (err) {
		throw new TRPCError({
			code: "CONFLICT",
			message: err instanceof Error ? err.message : "Failed to add worktree",
		});
	}

	await enablePushAutoSetupRemote(
		git,
		worktreePath,
		"[workspace.create:checkout]",
	);

	const cloudRow = await registerWorkspace({
		ctx: args.ctx,
		id: args.id,
		projectId: args.projectId,
		name: args.name,
		branch,
		worktreePath,
		rollback: async () => {
			try {
				await git.raw(["worktree", "remove", worktreePath]);
			} catch (err) {
				console.warn(
					"[workspace.create:checkout] failed to rollback worktree",
					{ worktreePath, err },
				);
			}
		},
	});

	const renamePrompt = args.aiRenamePrompt?.trim();
	if (args.autoRenameAfterCreate && renamePrompt) {
		void applyAiRename({
			ctx: args.ctx,
			workspaceId: cloudRow.id,
			prompt: renamePrompt,
		}).catch((err) => {
			console.warn("[workspace.create:checkout] AI rename failed", err);
		});
	}

	return {
		workspace: {
			id: cloudRow.id,
			projectId: cloudRow.projectId,
			name: cloudRow.name,
			branch,
		},
		worktreePath,
		localProject,
	};
}
