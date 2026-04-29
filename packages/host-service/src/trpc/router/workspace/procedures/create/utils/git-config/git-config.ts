import type { GitClient } from "../../../../../project/utils/branch-search";

export async function enablePushAutoSetupRemote(
	git: GitClient,
	worktreePath: string,
	logPrefix: string,
): Promise<void> {
	await git
		.raw([
			"-C",
			worktreePath,
			"config",
			"--local",
			"push.autoSetupRemote",
			"true",
		])
		.catch((err) => {
			console.warn(`${logPrefix} failed to set push.autoSetupRemote:`, err);
		});
}
