import { FEATURE_FLAGS } from "@superset/shared/constants";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@superset/ui/dropdown-menu";
import { toast } from "@superset/ui/sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@superset/ui/tooltip";
import { cn } from "@superset/ui/utils";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, Radio } from "lucide-react";
import { useFeatureFlagEnabled } from "posthog-js/react";
import { useMemo, useState } from "react";
import { apiTrpcClient } from "renderer/lib/api-trpc-client";

interface TerminalRemoteControlButtonProps {
	workspaceId: string;
	terminalId: string;
}

interface ActiveSession {
	sessionId: string;
	terminalId: string;
	// `webUrl` is only available right after `create` — the cloud only
	// stores `token_hash`, so we cannot reconstruct the share URL when
	// hydrating from `listForWorkspace`. `null` means "session is live but
	// the original link isn't recoverable; user needs to stop + re-share".
	webUrl: string | null;
	expiresAt: string;
}

type Phase = "inactive" | "loading" | "creating" | "active" | "revoking";
const HYDRATE_REFRESH_MS = 30_000;
const remoteControlSessionsQueryKey = (workspaceId: string) =>
	["remote-control-sessions", workspaceId] as const;

export function TerminalRemoteControlButton({
	workspaceId,
	terminalId,
}: TerminalRemoteControlButtonProps) {
	// Hooks must run unconditionally — gate at render time instead of
	// short-circuiting before `useState` etc.
	const hasAccess = useFeatureFlagEnabled(
		FEATURE_FLAGS.WEB_REMOTE_CONTROL_ACCESS,
	);
	const queryClient = useQueryClient();
	const queryKey = remoteControlSessionsQueryKey(workspaceId);
	const [actionPhase, setActionPhase] = useState<Phase>("inactive");
	const [localActive, setLocalActive] = useState<ActiveSession | null>(null);
	const sessionsQuery = useQuery({
		queryKey,
		enabled: Boolean(hasAccess),
		queryFn: () =>
			apiTrpcClient.remoteControl.listForWorkspace.query({ workspaceId }),
		refetchInterval: HYDRATE_REFRESH_MS,
		refetchOnWindowFocus: false,
		staleTime: 5_000,
	});

	const active = useMemo<ActiveSession | null>(() => {
		const now = Date.now();
		const live = sessionsQuery.data?.find(
			(row) =>
				row.terminalId === terminalId &&
				row.status === "active" &&
				new Date(row.expiresAt).getTime() > now,
		);
		if (live) {
			return {
				sessionId: live.sessionId,
				terminalId: live.terminalId,
				webUrl:
					localActive?.sessionId === live.sessionId ? localActive.webUrl : null,
				expiresAt: live.expiresAt,
			};
		}
		if (
			localActive &&
			localActive.terminalId === terminalId &&
			new Date(localActive.expiresAt).getTime() > now
		) {
			return localActive;
		}
		return null;
	}, [localActive, sessionsQuery.data, terminalId]);

	const phase: Phase =
		actionPhase === "creating" || actionPhase === "revoking"
			? actionPhase
			: sessionsQuery.isPending && !sessionsQuery.data
				? "loading"
				: active
					? "active"
					: "inactive";

	if (!hasAccess) return null;

	async function copyLink(url: string) {
		try {
			await navigator.clipboard.writeText(url);
			toast.success("Remote control link copied", {
				description: "Anyone with this link can control your terminal.",
			});
		} catch {
			toast.error("Failed to copy link to clipboard");
		}
	}

	async function startShare() {
		setActionPhase("creating");
		try {
			const result = await apiTrpcClient.remoteControl.create.mutate({
				workspaceId,
				terminalId,
				mode: "full",
			});
			setLocalActive({
				sessionId: result.sessionId,
				terminalId,
				webUrl: result.webUrl,
				expiresAt: result.expiresAt,
			});
			setActionPhase("inactive");
			void queryClient.invalidateQueries({ queryKey });
			void copyLink(result.webUrl);
		} catch (err) {
			setActionPhase("inactive");
			toast.error(
				`Failed to start remote control: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	async function stopShare() {
		if (!active) return;
		setActionPhase("revoking");
		try {
			await apiTrpcClient.remoteControl.revoke.mutate({
				sessionId: active.sessionId,
			});
			setLocalActive(null);
			setActionPhase("inactive");
			void queryClient.invalidateQueries({ queryKey });
			toast.success("Remote control stopped");
		} catch (err) {
			setActionPhase("inactive");
			toast.error(
				`Failed to stop remote control: ${err instanceof Error ? err.message : String(err)}`,
			);
		}
	}

	if (phase === "loading") {
		// Render the button but suppress the live badge until hydration
		// completes — otherwise the badge flashes "off" on every remount even
		// when a session is in fact still live.
		return (
			<button
				type="button"
				disabled
				aria-label="Loading remote control state"
				className="rounded p-1 text-muted-foreground opacity-50"
			>
				<Radio className="size-3.5" />
			</button>
		);
	}

	if (phase === "inactive" || phase === "creating") {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<button
						type="button"
						disabled={phase === "creating"}
						onClick={(e) => {
							e.stopPropagation();
							void startShare();
						}}
						aria-label="Share remote control"
						className={cn(
							"rounded p-1 transition-colors",
							"text-muted-foreground hover:text-foreground",
							phase === "creating" && "opacity-50",
						)}
					>
						<Radio className="size-3.5" />
					</button>
				</TooltipTrigger>
				<TooltipContent side="bottom" showArrow={false}>
					{phase === "creating" ? "Starting…" : "Share remote control"}
				</TooltipContent>
			</Tooltip>
		);
	}

	const canCopy = Boolean(active?.webUrl);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					onClick={(e) => e.stopPropagation()}
					aria-label="Remote control active"
					className={cn(
						"flex items-center gap-1 rounded px-1.5 py-0.5 text-xs",
						"text-emerald-600 dark:text-emerald-400",
						"hover:bg-emerald-500/10",
					)}
				>
					<span className="relative flex size-2">
						<span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
						<span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
					</span>
					<span className="font-medium">live</span>
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={() => {
						// `window.open(url, "_blank")` is the convention used elsewhere
						// in the renderer (e.g. DashboardSidebarHelpMenu) — Electron's
						// main process intercepts and routes to the system browser
						// so the share opens outside the Superset app.
						if (active?.webUrl) window.open(active.webUrl, "_blank");
					}}
					disabled={!canCopy}
				>
					<ExternalLink className="h-4 w-4" />
					Open in browser
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => {
						if (active?.webUrl) void copyLink(active.webUrl);
					}}
					disabled={!canCopy}
				>
					{canCopy ? "Copy link" : "Link only available right after sharing"}
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={() => void stopShare()}
					disabled={phase === "revoking"}
					className="text-destructive focus:text-destructive"
				>
					{phase === "revoking" ? "Stopping…" : "Stop sharing"}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
