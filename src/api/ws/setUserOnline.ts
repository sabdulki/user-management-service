import Client from "../../pkg/ws/client";
import WebSocketRequest from "../../pkg/ws/request";
import { sendUnauthorized, sendError, WS_CLIENT } from "./wsSetup";
import { isTokenValid } from "../../pkg/jwt/JwtGenerator";
import { StateValue } from "../../storage/DatabaseStorage";
import app from "../../app";


export async function setUserOnline(client:Client, request: WebSocketRequest<WS_CLIENT>) {

    const payload = request.payload as {accessToken: string};
    if (!payload || !payload.accessToken) {
        return sendUnauthorized(client);
    }
    
    // Validate token and if it's valid get its payload
    const tokenPayload = await isTokenValid(payload.accessToken) as {userId: number}
    if (!tokenPayload || !tokenPayload.userId) {
        return sendUnauthorized(client);
    }

    const userId = tokenPayload.userId;
	client.setUserId(userId);

    try {
        app.storage.changeUserState(userId, StateValue.ONLINE);
    } catch (err:any) {
        console.log(err);
        sendError(client, "Failed to save state in db");
    }

}