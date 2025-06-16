import Client from "pkg/ws/client";

export enum WS_CLIENT {
    Join = 'join',
}

export enum WS_SERVER {
    Error = 'error',

    // Authorization
    Authorized = 'authorized',
    Unauthorized = 'unauthorized',

    // Gameplay
    Sync = 'sync',
    MatchStart = 'match_start',
	MatchOver = 'match_over',
    MatchScoreUpdate = 'match_score_update',
    MatchOpponentConnected = 'match_opponent_connected',
    MatchOpponentDisconnected = 'match_opponent_disconnected',
    MatchOpponentReconnected = 'match_opponent_reconnected',
}

export function sendUnauthorized(client:Client) {
    client.send(WS_SERVER.Unauthorized);
}

export function sendError(client:Client, message:string) {
    client.send(WS_SERVER.Error, {message})
}