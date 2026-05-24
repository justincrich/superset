const { getDefaultConfig } = require("expo/metro-config");
const { withUniwindConfig } = require("uniwind/metro");
const withStorybook = require("@storybook/react-native/metro/withStorybook");
const path = require("node:path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch all files in the monorepo
config.watchFolders = [monorepoRoot];

// Let Metro find modules from the monorepo root
config.resolver.nodeModulesPaths = [
	path.resolve(projectRoot, "node_modules"),
	path.resolve(monorepoRoot, "node_modules"),
];

// Enable package exports for better-auth
config.resolver.unstable_enablePackageExports = true;

// Resolve local Expo Modules (modules/ dir)
config.resolver.extraNodeModules = {
	"@superset/tab-bar": path.resolve(projectRoot, "modules/tab-bar"),
};

// Stub Node-only built-ins that Storybook 9.x's `instrumenter` (transitively
// via @storybook/addon-ondevice-*) tries to bundle through tinyrainbow.
// Without this Metro fails with "Unable to resolve module tty from
// storybook/dist/instrumenter/index.cjs". `{ type: "empty" }` is Metro's
// built-in way to bind an import to an empty module — same trick used for
// Node built-ins (fs, path, etc.) Metro doesn't bundle.
const previousResolveRequest = config.resolver.resolveRequest;

// Storybook prepares stories before React decorators/root wrappers are always
// in play. Expo Router's vendored React Navigation linking contexts use
// throwing default getters, so Storybook mode resolves those context modules to
// safe Storybook-owned defaults while the root still provides a real
// NavigationContainer.
const storybookContextAliases = {
	"./LinkingContext": path.resolve(
		projectRoot,
		".rnstorybook/router/LinkingContext.ts",
	),
	"./LinkingContext.js": path.resolve(
		projectRoot,
		".rnstorybook/router/LinkingContext.ts",
	),
	"./UnhandledLinkingContext": path.resolve(
		projectRoot,
		".rnstorybook/router/UnhandledLinkingContext.ts",
	),
	"./UnhandledLinkingContext.js": path.resolve(
		projectRoot,
		".rnstorybook/router/UnhandledLinkingContext.ts",
	),
	"expo-router/build/react-navigation/native/LinkingContext": path.resolve(
		projectRoot,
		".rnstorybook/router/LinkingContext.ts",
	),
	"expo-router/build/react-navigation/native/LinkingContext.js": path.resolve(
		projectRoot,
		".rnstorybook/router/LinkingContext.ts",
	),
	"expo-router/build/react-navigation/native/UnhandledLinkingContext":
		path.resolve(projectRoot, ".rnstorybook/router/UnhandledLinkingContext.ts"),
	"expo-router/build/react-navigation/native/UnhandledLinkingContext.js":
		path.resolve(projectRoot, ".rnstorybook/router/UnhandledLinkingContext.ts"),
};

const isReactNavigationContextImporter = (originModulePath) =>
	originModulePath?.includes(
		`${path.sep}expo-router${path.sep}build${path.sep}react-navigation${path.sep}native${path.sep}`,
	) ||
	originModulePath?.includes(
		`${path.sep}@react-navigation${path.sep}native${path.sep}`,
	);

config.resolver.resolveRequest = (ctx, moduleName, platform) => {
	if (moduleName === "tty") {
		return { type: "empty" };
	}
	if (
		process.env.EXPO_PUBLIC_STORYBOOK === "true" &&
		storybookContextAliases[moduleName] &&
		(moduleName.startsWith("expo-router/") ||
			isReactNavigationContextImporter(ctx.originModulePath))
	) {
		return {
			type: "sourceFile",
			filePath: storybookContextAliases[moduleName],
		};
	}
	return previousResolveRequest
		? previousResolveRequest(ctx, moduleName, platform)
		: ctx.resolveRequest(ctx, moduleName, platform);
};

const uniwindConfig = withUniwindConfig(config, {
	cssEntryFile: "./global.css",
	dtsFile: "./uniwind-types.d.ts",
});

module.exports = withStorybook(uniwindConfig, {
	configPath: path.resolve(projectRoot, ".rnstorybook"),
	enabled: process.env.EXPO_PUBLIC_STORYBOOK === "true",
});
