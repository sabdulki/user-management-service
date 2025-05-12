import { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import RadishClient from "./client/client"
import Config from "../config/Config"
import { stringToSeconds } from './utils';

interface JwtPayload {
	userId: number;
}

export enum TokenType {
	Access = 'access',
	Refresh = 'refresh',
}

// const ErrNotEnoughArgs = new Error("JwtGeneratorConfig error : not enough arguments.")
// const err = new Error()
// if (err === ErrNotEnoughArgs) {

// } 

class JwtGeneratorConfig {
	public readonly secret: string;
	public readonly salt: string;
	public readonly accessExpiresIn: number;
	public readonly refreshExpiresIn: number;
  
	constructor() {
		const secret = process.env.JWT_SECRET
		const salt = process.env.JWT_SALT
		if (!secret || !salt) {
			throw new Error("JwtGeneratorConfig error : not enough arguments.")
		}  
		this.secret = secret;
		this.salt = salt;
		try {
			this.accessExpiresIn = stringToSeconds(process.env.JWT_ACCESS_EXPIRES_IN || '15m');
			this.refreshExpiresIn = stringToSeconds(process.env.JWT_REFRESH_EXPIRES_IN || '90d');
		} catch {
			throw new Error('JwtGeneratorConfig error: invalid expiration format');
		}
	}
};

export default class JwtGenerator {

	private static instance: JwtGenerator;
	private readonly config:JwtGeneratorConfig;
	private radishClient: RadishClient;

	private constructor() {
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
	
	private generateToken(payload: JwtPayload, expiresIn: number): string {
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
				throw new Error("JwtSettingFailure");
			const refreshResponse = await this.radishClient.set(`refresh-${refreshToken}`, "true");
			if (refreshResponse.status !== 201)
				throw new Error("JwtSettingFailure");
			return { accessToken, refreshToken };
		} catch (error: any) {
			throw new Error("JwtPairGenerationFailure");
		}
	}
  
	public async verifyToken(token: string, type: TokenType): Promise<JwtPayload> {
		try {
			const key = `${type}-${token}`;
			const status = await this.radishClient.get(key);
			if (status.status == 200) {
				return jwt.verify(token, this.config.secret + this.config.salt) as JwtPayload;
			}
			else {
				throw new Error("TokenVerificationFailure1");
			}
		} catch (error) {
			throw new Error("TokenVerificationFailure2");
		}
	}
};

async function isTokenValid(request: FastifyRequest, type: TokenType = TokenType.Access): Promise<JwtPayload>
{
	let token: string;
	try {
		if (type === TokenType.Access) {
			token = request.headers.authorization?.replace('Bearer ', '') as string;
		} else {
			const body = request.body as { refreshToken: string };
			token = body.refreshToken;
		}
	} catch (err: any) {
		throw new Error ("TokenExtractionFailure");
	}
	
	try {
		return await JwtGenerator.getInstance().verifyToken(token, type);
	} catch (err: any) {
		throw new Error("TokenIsNotValid");
	}
}

async function generateJwtTokenPair(payload: JwtPayload): Promise<{ accessToken: string; refreshToken: string }>
{
	return JwtGenerator.getInstance().generateTokenPair(payload);
}

export {
	isTokenValid,
	generateJwtTokenPair
}