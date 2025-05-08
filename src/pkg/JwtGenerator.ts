import { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import RadishClient from "./client/client"
import Config from "../config/Config"

interface JwtPayload {
	userId: number;
}

class JwtGeneratorConfig {
	public readonly secret: string;
	public readonly salt: string;
	public readonly accessExpiresIn: string;
	public readonly refreshExpiresIn: string;
  
	constructor() {
		const secret = process.env.JWT_SECRET
		const salt = process.env.JWT_SALT
		if (!secret || !salt) {
			throw new Error("JwtGeneratorConfig error : not enough arguments.")
		}  
		this.secret = secret;
		this.salt = salt;
		this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
		this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "90d";
	}
};

export default class JwtGenerator {

	private static instance: JwtGenerator;
	private readonly config:JwtGeneratorConfig;
	private radishClient: RadishClient;

	constructor() {
		this.config = new JwtGeneratorConfig();
		const host = Config.getInstance().getRadishHost();
		const port = Config.getInstance().getRadishPort();
		this.radishClient = new RadishClient({ host, port});
	}

	public static getInstance(): JwtGenerator {
		if (!JwtGenerator.instance) {
			JwtGenerator.instance = new JwtGenerator();
		}
		return JwtGenerator.instance;
	}
	
	private generateToken(payload: JwtPayload, expiresIn: string): string {
	  // Include salt in signature by appending it to the secret
		try {
			return jwt.sign(payload as jwt.JwtPayload, this.config.secret + this.config.salt, {
				expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
			});
		} catch (error: any) {
			throw new Error("JwtGenerationFailure");
		} 
	}
  
	public async generateTokenPair(payload: JwtPayload): Promise<{ accessToken: string; refreshToken: string }> {
		try {
			const accessToken = this.generateToken(payload, this.config.accessExpiresIn);
			const refreshToken = this.generateToken(payload, this.config.refreshExpiresIn);
			const accessResponse = await this.radishClient.set(`access-${accessToken}`, "true");
			if (accessResponse.status !== 201)
				throw new Error("JwtPairGenerationFailure");
			const refreshResponse = await this.radishClient.set(`refresh-${refreshToken}`, "true");
			if (refreshResponse.status !== 201)
				throw new Error("JwtPairGenerationFailure");
			return { accessToken, refreshToken };
		} catch (error: any) {
			throw new Error("JwtPairGenerationFailure");
		}
	}
  
	public async verifyToken(token: string, type: string): Promise<JwtPayload> {
		try {
			const status = await this.radishClient.get(type+"-"+token);
			if (status.status == 200) {
				return jwt.verify(token, this.config.secret + this.config.salt) as JwtPayload;
			}
			else {
				throw new Error("TokenVerificationFailure");
			}
		} catch (error) {
			throw new Error("TokenVerificationFailure");
		}
	}
};

async function getUserPayload(request: FastifyRequest): Promise<JwtPayload> {
	try {
		const token = request.headers.authorization?.replace('Bearer ', '') as string;
		return await JwtGenerator.getInstance().verifyToken(token, "access");
	} catch {
		throw new Error("TokenExtractionFailure")
	}
};

// async function 

export {
	getUserPayload
}