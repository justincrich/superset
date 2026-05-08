import type { ReactNode } from "react";

interface CollapsedColumnRailProps {
	label: string;
	icon: ReactNode;
	count?: string;
	onExpand: () => void;
}

export function CollapsedColumnRail({
	label,
	icon,
	count,
	onExpand,
}: CollapsedColumnRailProps) {
	return (
		<button
			type="button"
			onClick={onExpand}
			title={`Expand ${label}`}
			className="group flex h-full w-full flex-col items-center justify-start gap-2 py-3 hover:bg-muted/50 transition-colors"
		>
			<div className="text-muted-foreground group-hover:text-foreground">
				{icon}
			</div>
			<span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground group-hover:text-foreground [writing-mode:vertical-rl]">
				{label}
			</span>
			{count !== undefined && (
				<span className="text-[10px] text-muted-foreground tabular-nums [writing-mode:vertical-rl]">
					{count}
				</span>
			)}
		</button>
	);
}
