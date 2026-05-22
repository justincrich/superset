"use client";

import { PromptInputButton } from "@superset/ui/ai-elements/prompt-input";
import type { ThinkingLevel } from "@superset/ui/ai-elements/thinking-toggle";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@superset/ui/dropdown-menu";
import { claudeIcon } from "@superset/ui/icons/preset-icons";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@superset/ui/tooltip";
import {
	BrainIcon,
	CheckIcon,
	ChevronRightIcon,
	ShieldCheckIcon,
	ShieldIcon,
	ShieldOffIcon,
} from "lucide-react";
import type React from "react";
import { PILL_BUTTON_CLASS } from "renderer/components/Chat/ChatInterface/styles";
import type {
	ModelOption,
	PermissionMode,
} from "renderer/components/Chat/ChatInterface/types";

interface ComposerSettingsMenuProps {
	selectedModel: ModelOption | null;
	setModelSelectorOpen: React.Dispatch<React.SetStateAction<boolean>>;
	permissionMode: PermissionMode;
	setPermissionMode: React.Dispatch<React.SetStateAction<PermissionMode>>;
	thinkingLevel: ThinkingLevel;
	setThinkingLevel: (level: ThinkingLevel) => void;
}

interface PermissionModeOption {
	value: PermissionMode;
	label: string;
	description: string;
	icon: React.ComponentType<{ className?: string }>;
}

const PERMISSION_MODES: PermissionModeOption[] = [
	{
		value: "bypassPermissions",
		label: "Auto",
		description: "Tools run without approval",
		icon: ShieldOffIcon,
	},
	{
		value: "acceptEdits",
		label: "Semi-auto",
		description: "Edits auto-approved, others need approval",
		icon: ShieldCheckIcon,
	},
	{
		value: "default",
		label: "Manual",
		description: "All tools require approval",
		icon: ShieldIcon,
	},
];

interface ThinkingLevelOption {
	value: ThinkingLevel;
	label: string;
	description: string;
}

const THINKING_LEVELS: ThinkingLevelOption[] = [
	{ value: "off", label: "Off", description: "No extended thinking" },
	{ value: "low", label: "Low", description: "Minimal reasoning effort" },
	{
		value: "medium",
		label: "Medium",
		description: "Moderate reasoning effort",
	},
	{ value: "high", label: "High", description: "Thorough reasoning effort" },
	{
		value: "xhigh",
		label: "Max",
		description: "Maximum reasoning effort",
	},
];

export function ComposerSettingsMenu({
	selectedModel,
	setModelSelectorOpen,
	permissionMode,
	setPermissionMode,
	thinkingLevel,
	setThinkingLevel,
}: ComposerSettingsMenuProps) {
	const activePermission =
		PERMISSION_MODES.find((m) => m.value === permissionMode) ??
		PERMISSION_MODES[0];
	const PermissionIcon = activePermission.icon;

	const activeThinking =
		THINKING_LEVELS.find((t) => t.value === thinkingLevel) ??
		THINKING_LEVELS[0];

	const brainIconColor =
		thinkingLevel === "off" ? "text-muted-foreground" : "text-foreground";

	// For the tooltip, we need to construct a model display name
	// Try to match the provider logo pattern used in ModelPicker
	const getProviderLogo = (provider: string) => {
		// Using the same logic as ModelPicker's providerToLogo
		if (provider === "claude" || provider === "anthropic") {
			return <img alt="Claude" className="size-3" src={claudeIcon} />;
		}
		// For other providers, we'd need the ModelSelectorLogo component
		// but for now, just show the provider name
		return null;
	};

	const tooltipText = `Model: ${selectedModel?.name ?? "Model"} · Permission: ${activePermission.label} · Thinking: ${activeThinking.label}`;

	const ariaLabel = `Chat settings: model ${selectedModel?.name ?? "Model"}, permission ${activePermission.label}, thinking ${activeThinking.label}`;

	return (
		<DropdownMenu>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<DropdownMenuTrigger asChild>
							<PromptInputButton
								className={`${PILL_BUTTON_CLASS} px-2 gap-1 text-xs text-foreground cursor-pointer`}
								aria-label={ariaLabel}
							>
								<PermissionIcon className="size-3.5 text-foreground" />
								{getProviderLogo(selectedModel?.provider ?? "")}
								<span className="max-w-[180px] truncate">
									{selectedModel?.name ?? "Model"}
								</span>
								<BrainIcon className={`size-3.5 ${brainIconColor}`} />
							</PromptInputButton>
						</DropdownMenuTrigger>
					</TooltipTrigger>
					<TooltipContent>
						<p>{tooltipText}</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
			<DropdownMenuContent align="start" className="w-64">
				<DropdownMenuLabel>Model</DropdownMenuLabel>
				<DropdownMenuItem
					onSelect={() => {
						setModelSelectorOpen(true);
					}}
					className="flex items-center gap-2"
				>
					{getProviderLogo(selectedModel?.provider ?? "")}
					<span className="truncate flex-1">
						{selectedModel?.name ?? "Model"}
					</span>
					<ChevronRightIcon className="size-4 shrink-0" />
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				<DropdownMenuLabel>Permission</DropdownMenuLabel>
				{PERMISSION_MODES.map((mode) => {
					const Icon = mode.icon;
					const isActive = mode.value === permissionMode;
					return (
						<DropdownMenuItem
							key={mode.value}
							onSelect={() => setPermissionMode(mode.value)}
							className="flex items-center gap-2"
						>
							<Icon className="size-4 shrink-0" />
							<div className="flex flex-1 flex-col gap-0.5">
								<span className="text-sm font-medium">{mode.label}</span>
								<span className="text-xs text-muted-foreground">
									{mode.description}
								</span>
							</div>
							{isActive && <CheckIcon className="size-4 shrink-0" />}
						</DropdownMenuItem>
					);
				})}

				<DropdownMenuSeparator />

				<DropdownMenuLabel>Thinking</DropdownMenuLabel>
				{THINKING_LEVELS.map((level) => {
					const isActive = level.value === thinkingLevel;
					return (
						<DropdownMenuItem
							key={level.value}
							onSelect={() => setThinkingLevel(level.value)}
							className="flex items-center gap-2"
						>
							<div className="flex flex-1 flex-col gap-0.5">
								<span className="text-sm font-medium">{level.label}</span>
								<span className="text-xs text-muted-foreground">
									{level.description}
								</span>
							</div>
							{isActive && <CheckIcon className="size-4 shrink-0" />}
						</DropdownMenuItem>
					);
				})}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
