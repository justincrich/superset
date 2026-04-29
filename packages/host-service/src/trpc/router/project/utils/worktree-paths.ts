import { resolve, sep } from "node:path";
import { TRPCError } from "@trpc/server";
import { supersetWorktreesRoot } from "../../../../superset-home";

export function projectWorktreesRoot(projectId: string): string {
	return resolve(supersetWorktreesRoot(), projectId);
}

export function safeResolveWorktreePath(
	projectId: string,
	branchName: string,
): string {
	const projectRoot = projectWorktreesRoot(projectId);
	const worktreePath = resolve(projectRoot, branchName);
	if (
		worktreePath !== projectRoot &&
		!worktreePath.startsWith(projectRoot + sep)
	) {
		throw new TRPCError({
			code: "BAD_REQUEST",
			message: `Invalid branch name: path traversal detected (${branchName})`,
		});
	}
	return worktreePath;
}
