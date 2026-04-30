// ── Relay → Host ────────────────────────────────────────────────────

export interface TunnelHttpRequest {
	type: "http";
	id: string;
	method: string;
	path: string;
	headers: Record<string, string>;
	body?: string;
}

export interface TunnelWsOpen {
	type: "ws:open";
	id: string;
	path: string;
	query?: string;
}

// Asks the host to open a *dedicated* outbound WebSocket back to the relay
// for a single terminal session. Frames on that WS are not multiplexed —
// the connection carries raw stdin/stdout for one terminal only.
//
// On receipt the host should:
//   1. Open a local WebSocket to ws://localhost:<port><path>?<query>
//   2. Open a callback WebSocket to wss://<relay>/terminal/<hostId>/<terminalId>?token=<tunnelToken>
//   3. Bridge raw frames between (1) and (2) until either side closes
export interface TunnelWsOpenDedicated {
	type: "ws:open:dedicated";
	terminalId: string;
	hostId: string;
	path: string;
	query?: string;
	token: string;
}

export interface TunnelWsFrame {
	type: "ws:frame";
	id: string;
	data: string;
}

export interface TunnelWsClose {
	type: "ws:close";
	id: string;
	code?: number;
}

export interface TunnelPing {
	type: "ping";
}

export type TunnelRequest =
	| TunnelHttpRequest
	| TunnelWsOpen
	| TunnelWsOpenDedicated
	| TunnelWsFrame
	| TunnelWsClose
	| TunnelPing;

// ── Host → Relay ────────────────────────────────────────────────────

export interface TunnelHttpResponse {
	type: "http:response";
	id: string;
	status: number;
	headers: Record<string, string>;
	body?: string;
}

export interface TunnelPong {
	type: "pong";
}

export type TunnelResponse =
	| TunnelHttpResponse
	| TunnelWsFrame
	| TunnelWsClose
	| TunnelPong;
