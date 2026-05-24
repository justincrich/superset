import { PortalHost } from "@rn-primitives/portal";
import type { Preview } from "@storybook/react-native";
import { View } from "react-native";
import { cn } from "@/lib/utils";

import { StorybookRouterProvider } from "./StorybookRouterProvider";

const preview: Preview = {
	decorators: [
		(Story, context) => {
			// Stories that declare `parameters.layout: 'fullscreen'` (per the
			// Storybook convention) render edge-to-edge so views look like they
			// would on a real device. Atoms/molecules keep the p-4 chrome.
			const isFullscreen = context.parameters?.layout === "fullscreen";
			return (
				<StorybookRouterProvider>
					<View className={cn("flex-1 bg-background", !isFullscreen && "p-4")}>
						<Story />
						<PortalHost />
					</View>
				</StorybookRouterProvider>
			);
		},
	],
	parameters: {
		controls: {
			matchers: {
				color: /(background|color|foreground)$/i,
				date: /Date$/i,
			},
		},
	},
};

export default preview;
