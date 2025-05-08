import net from 'net';
import RadishRequest from './request';
import RadishResponse from './response';
import RequestQueue from './queue';

type RadishClientConfig = {
	host: string;
	port: number;
	onConnect?: () => void;
}

export default class RadishClient {
	private conn : net.Socket;
	private config: RadishClientConfig;
	isConnected: boolean = false;
	private queue: RequestQueue	= new RequestQueue(this);

	constructor(config: RadishClientConfig) {
		this.config = config;
		this.conn = this.connect();
	}

	private connect(){
		if (this.conn) {
			this.conn.removeAllListeners();
			this.conn.destroy();            
		}

		const port = this.config.port;
		const host = this.config.host;

		this.conn = net.createConnection({ port, host }, () => {
			this.config.onConnect?.();
			this.isConnected = true;
		});

		this.conn.on('error', (err) => {
			console.error('Connection error:', err);
			this.isConnected = false;
			this.reconnect();
		});

		this.conn.on('error', (err) => {
			console.error('Socket error:', err);
		});
		return this.conn
	}

	private async reconnect() {
		if (this.isConnected) {
			return;
		}

		setTimeout(() => {
			console.log(`Reconnect attempt...`);
			this.connect();
		}, 1000);
	}
	
	close() {
		this.conn.end();
	}

	async get(key: string) {
		const request = RadishRequest.get(key);
		const data = await this.queue.add(() => request.send(this.conn));
		return new RadishResponse(data);
	}

	async set(key: string, value: string, expire?: number) {
		const request = RadishRequest.set(key, value, expire);
		const data = await this.queue.add(() => request.send(this.conn));
		return new RadishResponse(data);
	}

	async delete(key: string) {
		const request = RadishRequest.del(key);
		const data = await this.queue.add(() => request.send(this.conn));
		return new RadishResponse(data);
	}
}