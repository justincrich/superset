export type GitHubEntityKind = "pull" | "issue";

export interface NormalizedQuery {
	query: string;
	repoMismatch: boolean;
	isDirectLookup: boolean;
}

const GITHUB_URL_RE =
	/^https?:\/\/(?:www\.)?github\.com\/([\w.-]+)\/([\w.-]+)\/(pull|issues)\/(\d+)(?:[/?#].*)?$/i;

export function normalizeGitHubQuery(
	raw: string,
	repo: { owner: string; name: string },
	kind: GitHubEntityKind,
): NormalizedQuery {
	if (!raw) return { query: "", repoMismatch: false, isDirectLookup: false };

	const urlMatch = raw.match(GITHUB_URL_RE);
	if (urlMatch) {
		const urlOwner = urlMatch[1] as string;
		const urlRepo = urlMatch[2] as string;
		const urlPath = (urlMatch[3] as string).toLowerCase();
		const number = urlMatch[4] as string;

		const urlEntityKind: GitHubEntityKind =
			urlPath === "pull" ? "pull" : "issue";
		if (urlEntityKind !== kind) {
			return { query: raw, repoMismatch: false, isDirectLookup: false };
		}

		const isSameRepo =
			urlOwner.toLowerCase() === repo.owner.toLowerCase() &&
			urlRepo.toLowerCase() === repo.name.toLowerCase();
		return {
			query: isSameRepo ? number : "",
			repoMismatch: !isSameRepo,
			isDirectLookup: isSameRepo,
		};
	}

	if (/^#\d+$/.test(raw)) {
		return { query: raw.slice(1), repoMismatch: false, isDirectLookup: true };
	}

	if (/^\d+$/.test(raw)) {
		return { query: raw, repoMismatch: false, isDirectLookup: true };
	}

	return { query: raw, repoMismatch: false, isDirectLookup: false };
}
