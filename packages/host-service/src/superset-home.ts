import { homedir } from "node:os";
import { join } from "node:path";

export function supersetHomeDir(): string {
	return process.env.SUPERSET_HOME_DIR?.trim() || join(homedir(), ".superset");
}

export function supersetWorktreesRoot(): string {
	return join(supersetHomeDir(), "worktrees");
}

export function supersetAttachmentsRoot(): string {
	return join(supersetHomeDir(), "attachments");
}

export function supersetReposRoot(): string {
	return join(supersetHomeDir(), "repos");
}
