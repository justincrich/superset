import { z } from "zod";

const prCheckoutSchema = z.object({
	number: z.number().int().positive(),
	url: z.string().url(),
	title: z.string(),
	headRefName: z.string(),
	baseRefName: z.string(),
	headRepositoryOwner: z.string(),
	isCrossRepository: z.boolean(),
	state: z.enum(["open", "closed", "merged"]),
});

export const workspaceCreateModeSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("fork"),
		branchName: z.string().min(1),
		baseBranch: z.string().optional(),
		baseBranchSource: z.enum(["local", "remote-tracking"]).optional(),
	}),
	z.object({
		kind: z.literal("checkout"),
		branchName: z.string().min(1),
	}),
	z.object({
		kind: z.literal("pr-checkout"),
		pr: prCheckoutSchema,
	}),
	z.object({
		kind: z.literal("adopt"),
		branchName: z.string().min(1),
		// When provided, adopt the worktree at this explicit path instead
		// of looking one up under the managed worktrees root. Used by the
		// v1→v2 migration to adopt worktrees at legacy paths.
		worktreePath: z.string().optional(),
	}),
]);

export const workspaceCreateLaunchSchema = z.discriminatedUnion("kind", [
	z.object({
		kind: z.literal("terminal"),
		command: z.string().min(1),
		label: z.string().optional(),
	}),
	z.object({
		kind: z.literal("agent"),
		agentId: z.string().min(1),
		prompt: z.string().optional(),
		attachmentIds: z.array(z.string()).optional(),
	}),
	z.object({
		kind: z.literal("chat"),
		model: z.string().min(1),
		prompt: z.string().optional(),
		attachmentIds: z.array(z.string()).optional(),
	}),
]);

export const workspaceCreateInputSchema = z.object({
	// Optional client-supplied workspace id. When absent, the cloud assigns
	// one. When present, the renderer's pending row uses the same id so the
	// UI can navigate immediately and resolve into the real row when it lands.
	id: z.string().uuid().optional(),
	projectId: z.string().min(1),
	name: z.string().min(1),
	// True when `name` came from the friendly fallback rather than user-typed
	// or PR/Linear-prefilled. Gates the post-create AI rename so a meaningful
	// user/linked-context name is never overwritten.
	autoRenameAfterCreate: z.boolean().optional(),
	mode: workspaceCreateModeSchema,
	launches: z.array(workspaceCreateLaunchSchema).optional(),
});

export type WorkspaceCreateInput = z.infer<typeof workspaceCreateInputSchema>;
export type WorkspaceCreateMode = z.infer<typeof workspaceCreateModeSchema>;
export type WorkspaceCreateLaunch = z.infer<typeof workspaceCreateLaunchSchema>;
