import { Button } from "@superset/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowRight, MonitorOff } from "lucide-react";

interface WorkspaceHostOfflineStateProps {
	hostName: string;
}

export function WorkspaceHostOfflineState({
	hostName,
}: WorkspaceHostOfflineStateProps) {
	return (
		<div className="flex h-full w-full items-center justify-center p-6">
			<div className="flex w-full max-w-sm flex-col items-start gap-5">
				<MonitorOff
					className="size-5 text-muted-foreground"
					strokeWidth={1.5}
					aria-hidden="true"
				/>
				<div className="flex flex-col gap-1.5">
					<h1 className="text-[15px] font-medium tracking-tight text-foreground">
						Host is offline
					</h1>
					<p className="select-text cursor-text text-[13px] leading-relaxed text-muted-foreground">
						This workspace lives on{" "}
						<span className="font-medium text-foreground">{hostName}</span>,
						which isn't reachable right now. Reconnect that device's Superset
						app and the workspace will come back online.
					</p>
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
