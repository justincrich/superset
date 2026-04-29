import { TRPCError } from "@trpc/server";
import { and, eq } from "drizzle-orm";
import { workspaces } from "../../../../../../../db/schema";
import type { HostServiceContext } from "../../../../../../../types";
import {
	findWorktreeAtPath,
	listWorktreeBranches,
} from "../../../../../project/utils/branch-search";
import {
	type LocalProject,
	requireLocalProject,
} from "../../../../../project/utils/local-project";
import { applyAiRename } from "../ai-rename";
import { registerWorkspace } from "../register-workspace";

export interface RunAdoptArgs {
	ctx: HostServiceContext;
	id?: string;
	projectId: string;
	name: string;
	autoRenameAfterCreate: boolean;
	aiRenamePrompt: string | undefined;
	branchName: string;
	worktreePath?: string;
}

export interface RunAdoptResult {
	workspace: { id: string; projectId: string; name: string; branch: string };
	worktreePath: string;
	localProject: LocalProject;
}

export async function runAdopt(args: RunAdoptArgs): Promise<RunAdoptResult> {
	const localProject = requireLocalProject(args.ctx, args.projectId);

	const branch = args.branchName.trim();
	if (!branch) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: "Branch name is empty",
		});
	}

	const git = await args.ctx.git(localProject.repoPath);

	let worktreePath: string;
	if (args.worktreePath) {
		const found = await findWorktreeAtPath(git, args.worktreePath, branch);
		if (!found) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: `No git worktree registered at "${args.worktreePath}" on branch "${branch}"`,
			});
		}
		worktreePath = args.worktreePath;
	} else {
		const { worktreeMap } = await listWorktreeBranches(
			args.ctx,
			git,
			args.projectId,
		);
		const found = worktreeMap.get(branch);
		if (!found) {
			throw new TRPCError({
				code: "NOT_FOUND",
				message: `No existing worktree for branch "${branch}"`,
			});
		}
		worktreePath = found;
	}

	// Replace any stale local row for this (project, branch) before creating
	// the new cloud row — the stale row's id likely points at a deleted
	// cloud row.
	const stale = args.ctx.db.query.workspaces
		.findFirst({
			where: and(
				eq(workspaces.projectId, args.projectId),
				eq(workspaces.branch, branch),
			),
		})
		.sync();

	const cloudRow = await registerWorkspace({
		ctx: args.ctx,
		id: args.id,
		projectId: args.projectId,
		name: args.name,
		branch,
		worktreePath,
		rollback: async () => {
			// Adopt didn't create the worktree — nothing to roll back here.
			// Cloud rollback is handled inside registerWorkspace.
		},
	});

	if (stale && stale.id !== cloudRow.id) {
		args.ctx.db.delete(workspaces).where(eq(workspaces.id, stale.id)).run();
	}

	const renamePrompt = args.aiRenamePrompt?.trim();
	if (args.autoRenameAfterCreate && renamePrompt) {
		void applyAiRename({
			ctx: args.ctx,
			workspaceId: cloudRow.id,
			prompt: renamePrompt,
		}).catch((err) => {
			console.warn("[workspace.create:adopt] AI rename failed", err);
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
