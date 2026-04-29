import type { HostServiceContext } from "../../../../../../../types";

export async function listBranchNames(
	ctx: HostServiceContext,
	repoPath: string,
): Promise<string[]> {
	const git = await ctx.git(repoPath);
	try {
		const raw = await git.raw([
			"for-each-ref",
			"--sort=-committerdate",
			"--format=%(refname)",
			"refs/heads/",
			"refs/remotes/origin/",
		]);
		const names = new Set<string>();
		for (const refname of raw.trim().split("\n").filter(Boolean)) {
			let name: string;
			if (refname.startsWith("refs/heads/")) {
				name = refname.slice("refs/heads/".length);
			} else if (refname.startsWith("refs/remotes/origin/")) {
				name = refname.slice("refs/remotes/origin/".length);
			} else {
				continue;
			}
			if (name && name !== "HEAD") names.add(name);
		}
		return Array.from(names);
	} catch {
		return [];
	}
}
