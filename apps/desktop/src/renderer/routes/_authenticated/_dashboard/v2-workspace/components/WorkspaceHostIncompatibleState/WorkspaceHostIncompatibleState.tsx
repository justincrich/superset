import { Button } from "@superset/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MonitorCog } from "lucide-react";

interface WorkspaceHostIncompatibleStateProps {
	hostName: string;
	hostVersion: string;
	minVersion: string;
}

export function WorkspaceHostIncompatibleState({
	hostName,
	hostVersion,
	minVersion,
}: WorkspaceHostIncompatibleStateProps) {
	return (
		<div className="flex h-full w-full items-center justify-center p-6">
			<div className="flex w-full max-w-sm flex-col items-start gap-5">
				<MonitorCog
					className="size-5 text-muted-foreground"
					strokeWidth={1.5}
					aria-hidden="true"
				/>
				<div className="flex flex-col gap-1.5">
					<h1 className="text-[15px] font-medium tracking-tight text-foreground">
						Host needs an update
					</h1>
					<p className="select-text cursor-text text-[13px] leading-relaxed text-muted-foreground">
						<span className="font-medium text-foreground">{hostName}</span> is
						running Superset {hostVersion}, but this client requires{" "}
						{minVersion} or newer. Update the Superset app on that device to
						reconnect this workspace.
					</p>
				</div>
				<div className="flex w-full flex-col gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2">
					<div className="flex items-center justify-between gap-3">
						<span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
							Host
						</span>
						<code className="select-text cursor-text min-w-0 truncate font-mono text-[11px] text-muted-foreground">
							{hostVersion}
						</code>
					</div>
					<div className="flex items-center justify-between gap-3">
						<span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
							Required
						</span>
						<code className="select-text cursor-text min-w-0 truncate font-mono text-[11px] text-muted-foreground">
							{minVersion}
						</code>
					</div>
				</div>
				<Button
					asChild
					size="sm"
					variant="ghost"
					className="-ml-2 h-7 gap-1.5 px-2 text-[13px] font-medium text-foreground hover:bg-muted/60"
				>
					<Link to="/v2-workspaces">
						Browse workspaces
						<ArrowRight
							className="size-3.5"
							strokeWidth={2}
							aria-hidden="true"
						/>
					</Link>
				</Button>
			</div>
		</div>
	);
}
