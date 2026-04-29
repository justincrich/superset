import { protectedProcedure } from "../../../index";
import { resolveGithubRepo } from "../utils/local-project";
import { normalizeGitHubQuery } from "../utils/normalize-github-query";
import { githubSearchInputSchema } from "./schemas";

export const searchGitHubIssues = protectedProcedure
	.input(githubSearchInputSchema)
	.query(async ({ ctx, input }) => {
		const repo = await resolveGithubRepo(ctx, input.projectId);
		const limit = input.limit ?? 30;

		const raw = input.query?.trim() ?? "";
		const normalized = normalizeGitHubQuery(raw, repo, "issue");

		if (normalized.repoMismatch) {
			return {
				issues: [],
				repoMismatch: `${repo.owner}/${repo.name}`,
			};
		}

		const effectiveQuery = normalized.query;
		const octokit = await ctx.github();

		try {
			if (normalized.isDirectLookup) {
				const issueNumber = Number.parseInt(effectiveQuery, 10);
				const { data: issue } = await octokit.issues.get({
					owner: repo.owner,
					repo: repo.name,
					issue_number: issueNumber,
				});
				if (issue.pull_request) {
					return { issues: [] };
				}
				if (!input.includeClosed && issue.state !== "open") {
					return { issues: [] };
				}
				return {
					issues: [
						{
							issueNumber: issue.number,
							title: issue.title,
							url: issue.html_url,
							state: issue.state,
							authorLogin: issue.user?.login ?? null,
						},
					],
				};
			}

			const stateFilter = input.includeClosed ? "" : " is:open";
			const query =
				`repo:${repo.owner}/${repo.name} is:issue${stateFilter} ${effectiveQuery}`.trim();
			const { data } = await octokit.search.issuesAndPullRequests({
				q: query,
				per_page: limit,
				sort: "updated",
				order: "desc",
			});
			return {
				issues: data.items
					.filter((item) => !item.pull_request)
					.map((item) => ({
						issueNumber: item.number,
						title: item.title,
						url: item.html_url,
						state: item.state,
						authorLogin: item.user?.login ?? null,
					})),
			};
		} catch (err) {
			console.warn("[project.searchGitHubIssues] failed", err);
			return { issues: [] };
		}
	});
