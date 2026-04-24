import { router } from "../../index";
import { adopt } from "./procedures/adopt";
import { checkout } from "./procedures/checkout";
import { create } from "./procedures/create";
import { generateBranchName } from "./procedures/generate-branch-name";
import { getContext } from "./procedures/get-context";
import { getGitHubIssueContent } from "./procedures/get-github-issue-content";
import { getGitHubPullRequestContent } from "./procedures/get-github-pull-request-content";
import { getProgress } from "./procedures/get-progress";
import { searchBranches } from "./procedures/search-branches";
import { searchGitHubIssues } from "./procedures/search-github-issues";
import { searchPullRequests } from "./procedures/search-pull-requests";

export const workspaceCreationRouter = router({
	getContext,
	searchBranches,
	generateBranchName,
	getProgress,
	create,
	checkout,
	adopt,
	searchGitHubIssues,
	searchPullRequests,
	getGitHubIssueContent,
	getGitHubPullRequestContent,
});
