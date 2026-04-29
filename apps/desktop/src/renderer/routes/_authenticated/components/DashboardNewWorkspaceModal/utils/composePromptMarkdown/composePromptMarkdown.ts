import type {
	LinkedIssueDraft,
	LinkedPRDraft,
	NewWorkspaceDraftState,
} from "../../stores/newWorkspaceDraft";

/**
 * Assemble the final prompt markdown by concatenating, in order:
 *   1. Linked PR block (if attached)
 *   2. Linked issue blocks (in attach order)
 *   3. The user's typed prompt text
 *
 * Section bodies are pre-fetched and stored on the draft at link-attach time
 * so submit composition is sync. Headers mirror `shared/context/contributors/*`
 * formatting so agents see the same shape regardless of entry point.
 */
export function composePromptMarkdown(
	draft: Pick<NewWorkspaceDraftState, "prompt" | "linkedPR" | "linkedIssues">,
): string {
	const sections: string[] = [];

	if (draft.linkedPR) {
		sections.push(formatLinkedPR(draft.linkedPR));
	}
	for (const issue of draft.linkedIssues) {
		sections.push(formatLinkedIssue(issue));
	}
	const trimmedPrompt = draft.prompt.trim();
	if (trimmedPrompt) {
		sections.push(trimmedPrompt);
	}

	return sections.join("\n\n");
}

function formatLinkedPR(pr: LinkedPRDraft): string {
	const branchLine = pr.branch
		? `This PR is checked out in this workspace on branch \`${pr.branch}\`. Commits you make here will be added to this PR.`
		: "";
	const headerParts = [`# PR #${pr.number} — ${pr.title}`, branchLine].filter(
		Boolean,
	);
	const header = headerParts.join("\n\n");
	const body = pr.body.trim();
	return body ? `${header}\n\n${body}` : header;
}

function formatLinkedIssue(issue: LinkedIssueDraft): string {
	if (issue.source === "github") {
		const heading = `# GitHub Issue #${issue.number} — ${issue.title}`;
		const body = issue.body.trim();
		return body ? `${heading}\n\n${body}` : heading;
	}
	const heading = `# Task ${issue.taskId ?? issue.slug} — ${issue.title}`;
	const body = issue.body.trim();
	return body ? `${heading}\n\n${body}` : heading;
}
