import { sanitizeUserBranchName } from "@superset/shared/workspace-launch";
import { toast } from "@superset/ui/sonner";
import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { env } from "renderer/env.renderer";
import { getHostServiceClientByUrl } from "renderer/lib/host-service-client";
import { useLocalHostService } from "renderer/routes/_authenticated/providers/LocalHostServiceProvider";
import { useNewWorkspaceDraftStore } from "../../../../../stores/newWorkspaceDraft";
import { composePromptMarkdown } from "../../../../../utils/composePromptMarkdown";
import { useCloseAndResetDraft } from "../../../../../utils/useCloseAndResetDraft";

export interface SubmitAttachment {
	url: string;
	mediaType: string;
	filename?: string;
}

export type SubmitIntent =
	| { kind: "fork" }
	| { kind: "checkout"; branchName: string }
	| { kind: "adopt"; branchName: string };

/**
 * Single submit entry for the V2 modal: composes the prompt markdown,
 * resolves the workspace name precedence, builds the canonical
 * `workspace.create` payload, and dispatches to the workspace's owning
 * host-service.
 *
 * Picker actions (Check out / Adopt) call this with the row's branch name
 * via the `intent` argument so they share the same dispatch path as the
 * normal Submit button.
 *
 * `_files` is the V1 PromptInput attachment shape — passed through but
 * not yet uploaded; full host-attachment lifecycle lands in a follow-up.
 */
export function useSubmitWorkspace(
	projectId: string | null,
	_selectedAgent: string | null,
) {
	const navigate = useNavigate();
	const closeAndResetDraft = useCloseAndResetDraft();
	const { activeHostUrl } = useLocalHostService();

	return useCallback(
		async (intent: SubmitIntent, _files: SubmitAttachment[] = []) => {
			if (!projectId) {
				toast.error("Select a project first");
				return;
			}

			const draft = useNewWorkspaceDraftStore.getState();
			const hostUrl =
				draft.hostTarget.kind === "local"
					? activeHostUrl
					: `${env.RELAY_URL}/hosts/${draft.hostTarget.hostId}`;
			if (!hostUrl) {
				toast.error("Selected host is not reachable");
				return;
			}

			const composedPrompt = composePromptMarkdown(draft);
			const userTypedName = draft.nameEdited && draft.name.trim();
			const linkedName = draft.linkedPR?.title ?? draft.linkedIssues[0]?.title;
			const resolvedName =
				userTypedName || linkedName?.trim() || draft.friendlyFallback;
			const autoRenameAfterCreate = !userTypedName && !linkedName;

			const branchName =
				draft.branchNameEdited && draft.branchName.trim()
					? sanitizeUserBranchName(draft.branchName.trim())
					: draft.friendlyFallback;

			const mode = resolveMode(intent, draft, branchName);
			const workspaceId = crypto.randomUUID();

			try {
				const client = getHostServiceClientByUrl(hostUrl);
				const result = await client.workspace.create.mutate({
					id: workspaceId,
					projectId,
					name: resolvedName,
					autoRenameAfterCreate,
					mode,
					launches: draft.agentId
						? [
								{
									kind: "agent",
									agentId: draft.agentId,
									prompt: composedPrompt,
									attachmentIds: draft.attachments
										.map((a) => a.attachmentId)
										.filter((id): id is string => Boolean(id)),
								},
							]
						: [],
				});

				for (const warning of result.warnings ?? []) {
					toast.warning(warning);
				}

				const launchTerminalId =
					result.launches.find((l) => l.kind === "terminal")?.terminalId ??
					null;

				closeAndResetDraft();
				void navigate({
					to: "/v2-workspace/$workspaceId",
					params: { workspaceId: result.workspace.id },
					state: { launchTerminalId } as never,
				});
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to create workspace",
				);
			}
		},
		[activeHostUrl, closeAndResetDraft, navigate, projectId],
	);
}

type CreateMode = Parameters<
	ReturnType<typeof getHostServiceClientByUrl>["workspace"]["create"]["mutate"]
>[0]["mode"];

function resolveMode(
	intent: SubmitIntent,
	draft: ReturnType<typeof useNewWorkspaceDraftStore.getState>,
	branchName: string,
): CreateMode {
	if (intent.kind === "fork" && draft.linkedPR) {
		return {
			kind: "pr-checkout",
			pr: {
				number: draft.linkedPR.number,
				url: draft.linkedPR.url,
				title: draft.linkedPR.title,
				headRefName: draft.linkedPR.branch,
				baseRefName: "",
				headRepositoryOwner: "",
				isCrossRepository: false,
				state:
					draft.linkedPR.state === "merged"
						? "merged"
						: draft.linkedPR.state === "closed"
							? "closed"
							: "open",
			},
		};
	}
	if (intent.kind === "fork") {
		return {
			kind: "fork",
			branchName,
			baseBranch: draft.baseBranch ?? undefined,
			baseBranchSource: draft.baseBranchSource ?? undefined,
		};
	}
	if (intent.kind === "checkout") {
		return { kind: "checkout", branchName: intent.branchName };
	}
	return { kind: "adopt", branchName: intent.branchName };
}
