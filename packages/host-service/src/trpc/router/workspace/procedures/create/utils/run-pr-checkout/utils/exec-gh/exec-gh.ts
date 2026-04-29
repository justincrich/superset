import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getStrictShellEnvironment } from "../../../../../../../../../terminal/clean-shell-env";

const execFileAsync = promisify(execFile);

/**
 * Shell out to `gh` CLI for `gh pr checkout`. Octokit doesn't expose a
 * worktree-aware "checkout this PR" primitive, so this stays as a shell
 * call. Other GitHub reads use ctx.github() (octokit) directly.
 */
export async function execGh(
	args: string[],
	options?: { cwd?: string; timeout?: number },
): Promise<unknown> {
	const env = await getStrictShellEnvironment().catch(
		() => process.env as Record<string, string>,
	);
	const { stdout } = await execFileAsync("gh", args, {
		encoding: "utf8",
		timeout: options?.timeout ?? 10_000,
		cwd: options?.cwd,
		env,
	});
	const trimmed = stdout.trim();
	if (!trimmed) return {};
	try {
		return JSON.parse(trimmed);
	} catch {
		return trimmed;
	}
}
