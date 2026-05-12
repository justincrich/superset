import { Button } from "@superset/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@superset/ui/tooltip";
import { FoldVertical, UnfoldVertical } from "lucide-react";
import type { ChangesViewMode } from "renderer/routes/_authenticated/providers/CollectionsProvider/dashboardSidebarLocal/schema";
import { ViewModeToggle } from "../ChangesHeader/components/ViewModeToggle";

interface ChangesToolbarProps {
	viewMode: ChangesViewMode;
	onViewModeChange: (next: ChangesViewMode) => void;
	onCollapseAll: () => void;
	onExpandAll: () => void;
}

/**
 * Single action row beneath the changes header (above the section list): the
 * folders/tree view-mode toggle on the left, expand-all / collapse-all on the
 * right. The fold actions apply to every section's folder groups (folders
 * mode) or tree directories (tree mode).
 */
export function ChangesToolbar({
	viewMode,
	onViewModeChange,
	onCollapseAll,
	onExpandAll,
}: ChangesToolbarProps) {
	return (
		<div className="flex items-center justify-between gap-2 border-b border-border px-2 py-0.5">
			<ViewModeToggle viewMode={viewMode} onChange={onViewModeChange} />
			<div className="flex items-center gap-0.5">
				<ToolbarButton
					icon={UnfoldVertical}
					label="Expand all"
					onClick={onExpandAll}
				/>
				<ToolbarButton
					icon={FoldVertical}
					label="Collapse all"
					onClick={onCollapseAll}
				/>
			</div>
		</div>
	);
}

interface ToolbarButtonProps {
	icon: React.ComponentType<{ className?: string }>;
	label: string;
	onClick: () => void;
}

function ToolbarButton({ icon: Icon, label, onClick }: ToolbarButtonProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					variant="ghost"
					size="icon"
					className="size-5 text-muted-foreground hover:text-foreground"
					onClick={onClick}
					aria-label={label}
				>
					<Icon className="size-3" />
				</Button>
			</TooltipTrigger>
			<TooltipContent side="bottom">{label}</TooltipContent>
		</Tooltip>
	);
}
