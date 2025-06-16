import { WebSocket } from "@fastify/websocket";
import Logger from "./logger";

function generator() {
    let id = 0;
    return {
        next: () => {
            id += 1;
            return id;
        }
    };
}

const clientIdGenerator = generator();

export default class Client {
    public id:number = clientIdGenerator.next();
    private userId:number|undefined
    private conn:WebSocket;

    constructor(conn: WebSocket) {
        this.conn = conn;
    } 

    public close(code: number = 1000, reason: string = ''): void {
        this.conn.close(code, reason);
    }
    
    public send(type:string, payload?: any): void {
        if (this.conn.readyState !== WebSocket.OPEN) {
            return ;
        }
        const data = JSON.stringify({
            type: type,
            payload: payload
        })

        Logger.info(`${this.id} <-- \t| ${data}`);

        this.conn.send(data);
    }
    
    public error(message: string): void {
        this.send("error", message)
    }

	public getUserId(): number | undefined {
		return this.userId;
	}

    public setUserId(id:number): void {
        if (this.userId === undefined) {
            this.userId = id;
        }
    }
}
