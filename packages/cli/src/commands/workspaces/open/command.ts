import { spawn } from "node:child_process";
import { boolean, CLIError, positional } from "@superset/cli-framework";
import { command } from "../../../lib/command";

function openUrl(url: string): Promise<void> {
	const [bin, args]: [string, string[]] =
		process.platform === "darwin"
			? ["open", [url]]
			: process.platform === "win32"
				? ["cmd", ["/c", "start", "", url]]
				: ["xdg-open", [url]];

	return new Promise((resolve, reject) => {
		const child = spawn(bin, args, { stdio: "ignore", detached: true });
		child.once("error", reject);
		child.once("spawn", () => {
			child.unref();
			resolve();
		});
	});
}

export default command({
	description: "Open a workspace in the Superset desktop app",
	args: [positional("workspace").required().desc("Workspace ID or exact name")],
	options: {
		print: boolean().desc(
			"Print the deep link URL instead of opening the desktop app",
		),
	},
	run: async ({ ctx, args, options }) => {
		const query = args.workspace as string;
		const organizationId = ctx.config.organizationId;
		if (!organizationId) {
			throw new CLIError("No active organization", "Run: superset auth login");
		}

		const workspaces = await ctx.api.v2Workspace.list.query({
			organizationId,
		});
		const matches = workspaces.filter(
			(w) => w.id === query || w.name === query,
		);
		if (matches.length === 0) {
			throw new CLIError(
				`No workspace matched: ${query}`,
				"Pass a workspace ID or exact name. List options with: superset workspaces list",
			);
		}
		const exactById = matches.find((w) => w.id === query);
		if (!exactById && matches.length > 1) {
			throw new CLIError(
				`Multiple workspaces named "${query}"`,
				`Pass the workspace ID instead. Matches: ${matches.map((w) => w.id).join(", ")}`,
			);
		}
		const { id, name } = exactById ?? matches[0]!;

		const url = `superset://v2-workspace/${id}`;

		if (!options.print) {
			try {
				await openUrl(url);
			} catch (err) {
				throw new CLIError(
					"Failed to open desktop app",
					err instanceof Error ? err.message : String(err),
				);
			}
		}

		return {
			data: { id, name, url },
			message: options.print ? url : `Opening "${name}" in Superset desktop`,
		};
	},
});
