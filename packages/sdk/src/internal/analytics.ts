export interface SdkCallEvent {
	method: string;
	kind: "mutation" | "query" | "hostMutation" | "hostQuery";
	status: "success" | "error";
	durationMs: number;
	sdkVersion: string;
}

/**
 * Fire-and-forget POST to the API's `telemetry.captureSdk` mutation. The API
 * resolves the user.id from the same auth context the SDK uses for any other
 * call, so events land in PostHog with the correct distinct_id and merge with
 * the user's desktop / CLI / web identity.
 */
export function captureSdkCall(args: {
	baseURL: string;
	apiKey: string;
	event: SdkCallEvent;
}): void {
	const url = `${args.baseURL.replace(/\/+$/, "")}/api/trpc/telemetry.captureSdk`;
	void fetch(url, {
		method: "POST",
		keepalive: true,
		headers: {
			"Content-Type": "application/json",
			"x-api-key": args.apiKey,
		},
		body: JSON.stringify({
			json: {
				event: "method_called",
				properties: {
					method: args.event.method,
					kind: args.event.kind,
					status: args.event.status,
					duration_ms: args.event.durationMs,
					sdk_version: args.event.sdkVersion,
				},
			},
		}),
	}).catch(() => {
		// Telemetry must never affect the SDK.
	});
}
