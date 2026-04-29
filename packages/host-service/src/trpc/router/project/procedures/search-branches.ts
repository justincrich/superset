import { eq } from "drizzle-orm";
import { workspaces } from "../../../../db/schema";
import { resolveDefaultBranchName } from "../../../../runtime/git/refs";
import { protectedProcedure } from "../../../index";
import {
	type BranchRow,
	decodeCursor,
	encodeNextCursor,
	getRecentBranchOrder,
	listWorktreeBranches,
	markRefetchRemote,
	shouldRefetchRemote,
} from "../utils/branch-search";
import { findLocalProject } from "../utils/local-project";
import { searchBranchesInputSchema } from "./schemas";

type BranchAccum = {
	name: string;
	lastCommitDate: number;
	isLocal: boolean;
	isRemote: boolean;
};

export const searchBranches = protectedProcedure
	.input(searchBranchesInputSchema)
	.query(async ({ ctx, input }) => {
		const limit = input.limit ?? 50;
		const offset = decodeCursor(input.cursor);

		const localProject = findLocalProject(ctx, input.projectId);
		if (!localProject) {
			return {
				defaultBranch: null as string | null,
				items: [] as BranchRow[],
				nextCursor: null as string | null,
			};
		}

		const git = await ctx.git(localProject.repoPath);

		if (input.refresh && shouldRefetchRemote(input.projectId)) {
			markRefetchRemote(input.projectId);
			try {
				await git.fetch(["--prune", "--quiet", "--no-tags"]);
			} catch {
				// offline — proceed with cached refs
			}
		}

		const defaultBranch = await resolveDefaultBranchName(git);
		const { worktreeMap, checkedOutBranches } = await listWorktreeBranches(
			ctx,
			git,
			input.projectId,
		);
		const recencyMap = await getRecentBranchOrder(git, 30);

		const workspaceBranches = new Set<string>(
			ctx.db
				.select()
				.from(workspaces)
				.where(eq(workspaces.projectId, input.projectId))
				.all()
				.map((workspace) => workspace.branch)
				.filter((branch): branch is string => Boolean(branch)),
		);

		const branchMap = new Map<string, BranchAccum>();
		try {
			const raw = await git.raw([
				"for-each-ref",
				"--sort=-committerdate",
				"--format=%(refname)\t%(refname:short)\t%(committerdate:unix)",
				"refs/heads/",
				"refs/remotes/origin/",
			]);
			for (const line of raw.trim().split("\n").filter(Boolean)) {
				const [refname, _short, timestamp] = line.split("\t");
				if (!refname) continue;

				let name: string;
				let isLocal = false;
				let isRemote = false;
				if (refname.startsWith("refs/heads/")) {
					name = refname.slice("refs/heads/".length);
					isLocal = true;
				} else if (refname.startsWith("refs/remotes/origin/")) {
					name = refname.slice("refs/remotes/origin/".length);
					isRemote = true;
				} else {
					continue;
				}
				if (!name || name === "HEAD") continue;

				const existing = branchMap.get(name);
				if (existing) {
					existing.isLocal = existing.isLocal || isLocal;
					existing.isRemote = existing.isRemote || isRemote;
					continue;
				}

				branchMap.set(name, {
					name,
					lastCommitDate: Number.parseInt(timestamp ?? "0", 10),
					isLocal,
					isRemote,
				});
			}
		} catch (err) {
			console.warn("[project.searchBranches] git for-each-ref failed:", err);
		}

		let branches = Array.from(branchMap.values());

		if (input.filter === "worktree") {
			branches = branches.filter((branch) => worktreeMap.has(branch.name));
		} else {
			branches = branches.filter((branch) => !worktreeMap.has(branch.name));
		}

		if (input.query) {
			const query = input.query.toLowerCase();
			branches = branches.filter((branch) =>
				branch.name.toLowerCase().includes(query),
			);
		}

		branches.sort((a, b) => {
			const aDefault = a.name === defaultBranch ? 0 : 1;
			const bDefault = b.name === defaultBranch ? 0 : 1;
			if (aDefault !== bDefault) return aDefault - bDefault;

			const aRecency = recencyMap.get(a.name);
			const bRecency = recencyMap.get(b.name);
			if (aRecency !== undefined && bRecency !== undefined) {
				return aRecency - bRecency;
			}
			if (aRecency !== undefined) return -1;
			if (bRecency !== undefined) return 1;

			return b.lastCommitDate - a.lastCommitDate;
		});

		const page = branches.slice(offset, offset + limit);
		const items: BranchRow[] = page.map((branch) => ({
			name: branch.name,
			lastCommitDate: branch.lastCommitDate,
			isLocal: branch.isLocal,
			isRemote: branch.isRemote,
			recency: recencyMap.get(branch.name) ?? null,
			worktreePath: worktreeMap.get(branch.name) ?? null,
			hasWorkspace: workspaceBranches.has(branch.name),
			isCheckedOut: checkedOutBranches.has(branch.name),
		}));

		return {
			defaultBranch,
			items,
			nextCursor: encodeNextCursor(offset, limit, branches.length),
		};
	});
