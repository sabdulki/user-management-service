import { FastifyInstance } from "fastify";
import WebSocketProvider from "../../pkg/ws/ws";
import { setUserOffline } from "./setUserOffline";
import { WS_CLIENT } from "./wsSetup";
import { setUserOnline } from "./setUserOnline";

const connectionListeners = {
    onConnect: undefined,
    onDisconnect: setUserOffline,
    onError: undefined,    
}

const provider = new WebSocketProvider<WS_CLIENT>("/auth/api/ws/online", connectionListeners)
.on(WS_CLIENT.Join, setUserOnline);

export default async function registerWebSocketRoutes(fastify: FastifyInstance) {
    provider.register(fastify);
} 
