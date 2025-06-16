import { FastifyInstance } from "fastify";
import Client from "./client";
import websocket from "@fastify/websocket";
import Logger from "./logger";
import WebSocketRequest from "./request";
import { messageRawData, messageRequest } from "./utils";
import { ErrUndefinedMessage } from "./errors";

type WebSocketProviderOptions = {
    onConnect?: (client: Client) => void;
    onDisconnect?: (client: Client) => void;
    onError?: (client: Client, error: Error) => void;
}

export default class WebSocketProvider<T> {
    private clients: Client[] = [];
    private route: string;
    private options: WebSocketProviderOptions;

    private listeners: Map<T, (client: Client, message: WebSocketRequest<T>) => void> = new Map();

    constructor(route: string, options?: WebSocketProviderOptions) {
        this.options = options || {};
        this.route = route
    }
    
    public on(type: T, listener: (client: Client, message: WebSocketRequest<T>) => void) : WebSocketProvider<T> {
        
        if (this.listeners.has(type)) {
            throw new Error(`WebSocketProvider error : Listener for type ${type} already exists.`);
        }

        this.listeners.set(type, listener);

        return this
    }

    public register(fastify:FastifyInstance) {

        fastify.register(websocket);
        fastify.register(async (fastify) => {
            fastify.get(this.route, { websocket: true }, (socket, req) => {

                const client = new Client(socket)

                socket.on('open', () => this.onConnectHandler(client));
                socket.on('close', () => this.onDisconnectHandler(client));
                socket.on('error', (error: Error) => this.onErrorHandler(client, error));
                socket.on('message', (message: string) => this.onMessageHandler(client, message));
            })
        });

        console.log(`
WebSocketProvider registered at route: '${this.route}'
with this listeners:
* ${[...this.listeners.keys()].map(key => `'${key}'\t--> ${this.listeners.get(key)?.name}`).join('\n* ')}\n
`)
    }

    private onConnectHandler(client: Client) {
        Logger.info(`${client.id}\t| connected.`);

        this.clients.push(client);

        if (this.options.onConnect) {
            this.options.onConnect(client);
        }
    }

    private onMessageHandler(client: Client, message: string) {  
        Logger.info(`${client.id} --> \t| ${message}`);

        this.parseMessage(client, message);
    }

    private onDisconnectHandler(client: Client) {
        Logger.info(`${client.id}\t| disconnected.`);
        
        this.clients = this.clients.filter(c => c.id !== client.id);

        if (this.options.onDisconnect) {
            this.options.onDisconnect(client);
        }
    }

    private onErrorHandler(client: Client, error: Error) {
        Logger.error(`${client.id}\t| ${error.message}`);

        if (this.options.onError) {
            this.options.onError(client, error);
        }
    }

    private parseMessage(client:Client, message: string) {

        const obj: Record<string, any> | undefined = messageRawData(client, message);
        if (!obj) {
            return;
        }

        const request: WebSocketRequest<T> | undefined = messageRequest(client, obj);
        if (!request) {
            return;
        }

        const listener = this.findListener(client, request.type);
        if (!listener) {
            return ;
        }

        try {
            listener(client, request);
        } catch (error) {
            Logger.error(`${client.id}\t| ${error}`);
            client.error(`${error}`);
        }
    }

    private findListener(client:Client,type: T) : ((client: Client, message: WebSocketRequest<T>) => void) | undefined {
        let listener: ((client: Client, message: WebSocketRequest<T>) => void) | undefined;
        try {
            listener = this.listeners.get(type);
            if (!listener) {
                throw ErrUndefinedMessage
            }
        } catch (error) {
            Logger.error(`${client.id}\t| ${error}`);
            client.error(`${error}`);
            return undefined;
        }
        return listener;
    }
}