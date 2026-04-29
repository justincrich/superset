import { toast } from "@superset/ui/sonner";
import { useCallback } from "react";
import { env } from "renderer/env.renderer";
import { getHostServiceClientByUrl } from "renderer/lib/host-service-client";
import { useLocalHostService } from "renderer/routes/_authenticated/providers/LocalHostServiceProvider";
import type {
	LinkedIssueDraft,
	LinkedPRDraft,
} from "../../../../../stores/newWorkspaceDraft";
import { useNewWorkspaceDraftStore } from "../../../../../stores/newWorkspaceDraft";
import type { WorkspaceHostTarget } from "../../../components/DevicePicker";

/**
 * Add/remove handlers for `linkedIssues` / `linkedPR` on the draft store.
 *
 * GitHub issues and PRs go through their owning host-service to fetch full
 * body+title, then store the resolved content on the draft. That way the
 * submit-time `composePromptMarkdown` is sync — no spinner waiting on
 * fetches at submit time. Internal tasks come pre-resolved from the
 * Linear search component.
 */
export function useLinkedContext(args: {
	projectId: string | null;
	hostTarget: WorkspaceHostTarget;
}) {
	const { projectId, hostTarget } = args;
	const { activeHostUrl } = useLocalHostService();
	const updateDraft = useNewWorkspaceDraftStore((s) => s.updateDraft);

	const hostUrl =
		hostTarget.kind === "local"
			? activeHostUrl
			: `${env.RELAY_URL}/hosts/${hostTarget.hostId}`;

	const addLinkedInternalIssue = useCallback(
		(slug: string, title: string, taskId: string, url?: string) => {
			const issues = useNewWorkspaceDraftStore.getState().linkedIssues;
			if (issues.some((i) => i.slug === slug)) return;
			updateDraft({
				linkedIssues: [
					...issues,
					{ source: "internal", slug, title, taskId, url, body: "" },
				],
			});
		},
		[updateDraft],
	);

	const addLinkedGitHubIssue = useCallback(
		async (issueNumber: number, _title: string, _url: string) => {
			if (!projectId || !hostUrl) {
				toast.error("Select a project first");
				return;
			}
			const issues = useNewWorkspaceDraftStore.getState().linkedIssues;
			const slug = `#${issueNumber}`;
			if (issues.some((i) => i.slug === slug)) return;
			try {
				const client = getHostServiceClientByUrl(hostUrl);
				const issue = await client.project.getGitHubIssueContent.query({
					projectId,
					issueNumber,
				});
				const next: LinkedIssueDraft = {
					source: "github",
					number: issue.number,
					slug,
					title: issue.title,
					body: issue.body,
					url: issue.url,
					state: issue.state === "closed" ? "closed" : "open",
				};
				updateDraft({
					linkedIssues: [
						...useNewWorkspaceDraftStore.getState().linkedIssues,
						next,
					],
				});
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to fetch GitHub issue",
				);
			}
		},
		[hostUrl, projectId, updateDraft],
	);

	const removeLinkedIssue = useCallback(
		(slug: string) => {
			updateDraft({
				linkedIssues: useNewWorkspaceDraftStore
					.getState()
					.linkedIssues.filter((i) => i.slug !== slug),
			});
		},
		[updateDraft],
	);

	const setLinkedPR = useCallback(
		async (pr: {
			prNumber: number;
			title: string;
			url: string;
			state: string;
		}) => {
			if (!projectId || !hostUrl) {
				toast.error("Select a project first");
				return;
			}
			try {
				const client = getHostServiceClientByUrl(hostUrl);
				const fetched = await client.project.getGitHubPullRequestContent.query({
					projectId,
					prNumber: pr.prNumber,
				});
				const next: LinkedPRDraft = {
					number: fetched.number,
					title: fetched.title,
					body: fetched.body,
					url: fetched.url,
					state: fetched.state,
					branch: fetched.branch,
				};
				updateDraft({ linkedPR: next });
			} catch (err) {
				toast.error(
					err instanceof Error ? err.message : "Failed to fetch pull request",
				);
			}
		},
		[hostUrl, projectId, updateDraft],
	);

	const removeLinkedPR = useCallback(
		() => updateDraft({ linkedPR: null }),
		[updateDraft],
	);

	return {
		addLinkedIssue: addLinkedInternalIssue,
		addLinkedGitHubIssue,
		removeLinkedIssue,
		setLinkedPR,
		removeLinkedPR,
	};
}
