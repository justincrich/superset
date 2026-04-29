import { Agent } from "@mastra/core/agent";
import { getSmallModel } from "@superset/chat/server/shared";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { workspaces } from "../../../../../../../db/schema";
import type { HostServiceContext } from "../../../../../../../types";
import { listBranchNames } from "../list-branch-names";
import { deduplicateBranchName } from "../sanitize-branch";

const WORKSPACE_TITLE_MAX = 150;
const BRANCH_NAME_MAX = 25;

function sanitizeBranchCandidate(raw: string): string {
	return raw
		.toLowerCase()
		.trim()
		.replace(/\s+/g, "-")
		.replace(/[^a-z0-9-]/g, "")
		.replace(/-+/g, "-")
		.replace(/^-+|-+$/g, "")
		.slice(0, BRANCH_NAME_MAX)
		.replace(/-+$/g, "");
}

function trimTitle(raw: string): string {
	return raw
		.trim()
		.replace(/[\s.,;:!?-]+$/g, "")
		.slice(0, WORKSPACE_TITLE_MAX);
}

const workspaceNamesSchema = z.object({
	title: z
		.string()
		.transform(trimTitle)
		.describe(
			`Short human-readable workspace title. Up to ${WORKSPACE_TITLE_MAX} characters. No trailing punctuation. Prefer whole words; never truncate mid-word.`,
		),
	branchName: z
		.string()
		.transform(sanitizeBranchCandidate)
		.describe(
			`Git branch name in kebab-case (lowercase, dashes). 2-4 words, up to ${BRANCH_NAME_MAX} characters. Only [a-z0-9-]. No leading/trailing dashes. No prefixes.`,
		),
});

const INSTRUCTIONS = [
	"You name new code workspaces from the user's initial prompt.",
	"Return a structured object with two fields:",
	`- title: a short human-readable label (<= ${WORKSPACE_TITLE_MAX} chars). Full words only; never cut mid-word. No trailing punctuation.`,
	`- branchName: a kebab-case git branch name (<= ${BRANCH_NAME_MAX} chars, 2-4 words). Only a-z 0-9 and dashes. No prefixes.`,
	"Both fields must describe the same underlying task; the branch is just a compact slug of the title.",
].join("\n");

async function generateWorkspaceNames(
	prompt: string,
): Promise<{ title: string; branchName: string } | null> {
	const cleaned = prompt.trim();
	if (!cleaned) return null;

	const model = await getSmallModel();
	if (!model) return null;

	const agent = new Agent({
		id: "workspace-namer",
		name: "Workspace Namer",
		instructions: INSTRUCTIONS,
		model,
	});

	try {
		const { object } = await agent.generate(cleaned, {
			structuredOutput: {
				schema: workspaceNamesSchema,
				jsonPromptInjection: true,
			},
		});
		return object;
	} catch (err) {
		console.warn("[ai-rename] generation failed:", err);
		return null;
	}
}

export interface ApplyAiRenameArgs {
	ctx: HostServiceContext;
	workspaceId: string;
	prompt: string;
	/**
	 * When set, the helper also renames the git branch (fork mode). When
	 * omitted, only the workspace name updates — used by checkout/adopt
	 * where the branch is a pre-existing ref we must not rewrite.
	 */
	branchRename?: {
		repoPath: string;
		worktreePath: string;
		oldBranchName: string;
	};
}

/**
 * Generates an AI title (and optionally a branch name) and applies them.
 * Cloud is source of truth; local DB only writes after cloud confirms. Git
 * rename runs first because it's cheap to roll back. On cloud failure the
 * git rename reverts so git, host-local DB, and cloud stay in lockstep.
 */
export async function applyAiRename(args: ApplyAiRenameArgs): Promise<void> {
	const aiNames = await generateWorkspaceNames(args.prompt);
	if (!aiNames) return;

	const titleChanged = aiNames.title !== "";
	const branchChanged =
		args.branchRename !== undefined &&
		aiNames.branchName !== "" &&
		aiNames.branchName !== args.branchRename.oldBranchName;

	if (!titleChanged && !branchChanged) return;

	let renamedBranch: string | null = null;
	if (branchChanged && args.branchRename) {
		const freshBranches = await listBranchNames(
			args.ctx,
			args.branchRename.repoPath,
		);
		const deduped = deduplicateBranchName(
			aiNames.branchName,
			freshBranches.filter((b) => b !== args.branchRename?.oldBranchName),
		);
		try {
			const worktreeGit = await args.ctx.git(args.branchRename.worktreePath);
			await worktreeGit.raw([
				"branch",
				"-m",
				args.branchRename.oldBranchName,
				deduped,
			]);
			renamedBranch = deduped;
		} catch (err) {
			console.warn("[ai-rename] git branch rename failed", err);
		}
	}

	const patch: { id: string; name?: string; branch?: string } = {
		id: args.workspaceId,
	};
	if (titleChanged) patch.name = aiNames.title;
	if (renamedBranch) patch.branch = renamedBranch;
	if (patch.name === undefined && patch.branch === undefined) return;

	try {
		await args.ctx.api.v2Workspace.updateNameFromHost.mutate(patch);
	} catch (err) {
		if (renamedBranch && args.branchRename) {
			const { worktreePath, oldBranchName } = args.branchRename;
			await args.ctx
				.git(worktreePath)
				.then((g) => g.raw(["branch", "-m", renamedBranch, oldBranchName]))
				.catch((rollbackErr) => {
					console.warn(
						`[ai-rename] git branch rollback failed (workspace ${args.workspaceId}, ${renamedBranch} → ${oldBranchName})`,
						rollbackErr,
					);
				});
		}
		throw err;
	}

	if (renamedBranch) {
		args.ctx.db
			.update(workspaces)
			.set({ branch: renamedBranch })
			.where(eq(workspaces.id, args.workspaceId))
			.run();
	}
}
