import Client from "../../pkg/ws/client";
import { sendError } from "./wsSetup";
import { StateValue } from "../../storage/DatabaseStorage";
import app from "../../app";


export async function setUserOffline(client:Client) {

    const userId: number = client.getUserId() as number;
	if (userId === undefined)
		return;

    try {
        app.storage.changeUserState(userId, StateValue.OFFLINE);
    } catch (err:any) {
        sendError(client, "Failed to save state in db");
    }

}