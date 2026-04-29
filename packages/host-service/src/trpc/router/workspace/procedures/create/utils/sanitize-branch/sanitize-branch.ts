/**
 * Branch name deduplication. Sanitization/slugification lives on the
 * renderer — host only deduplicates against existing branches.
 */

const MAX_BRANCH_LENGTH = 100;
const SUFFIX_RESERVE = 6;

export function deduplicateBranchName(
	candidate: string,
	existingBranchNames: string[],
): string {
	if (!candidate) return candidate;

	const existingSet = new Set(existingBranchNames.map((b) => b.toLowerCase()));
	if (!existingSet.has(candidate.toLowerCase())) return candidate;

	const base =
		candidate.length > MAX_BRANCH_LENGTH - SUFFIX_RESERVE
			? candidate
					.slice(0, MAX_BRANCH_LENGTH - SUFFIX_RESERVE)
					.replace(/[-.]+$/, "")
			: candidate;

	for (let suffix = 2; suffix < 10_000; suffix++) {
		const deduplicated = `${base}-${suffix}`;
		if (!existingSet.has(deduplicated.toLowerCase())) return deduplicated;
	}

	return `${base}-${Date.now().toString(36)}`;
}
