import { FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

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
			throw new Error("JwtGeneratorConfig error : not enoght arguments.")
		}  
		this.secret = secret;
		this.salt = salt;
		this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
		this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "90d";
	}
};

export default class JwtGenerator {

	private static instance: JwtGenerator;
	private readonly config:JwtGeneratorConfig

	constructor() {
		this.config = new JwtGeneratorConfig()
	}

	public static getInstance(): JwtGenerator {
		if (!JwtGenerator.instance) {
			JwtGenerator.instance = new JwtGenerator();
		}
		return JwtGenerator.instance;
	}
	
	private generateToken(payload: JwtPayload, expiresIn: string): string {
	  // Include salt in signature by appending it to the secret
	  return jwt.sign(payload as jwt.JwtPayload, this.config.secret + this.config.salt, {
		  expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
		});
	}
  
	public generateTokenPair(payload: JwtPayload): { accessToken: string; refreshToken: string } {
	  const accessToken = this.generateToken(payload, this.config.accessExpiresIn);
	  const refreshToken = this.generateToken(payload, this.config.refreshExpiresIn);
	  return { accessToken, refreshToken };
	}
  
	public verifyToken(token: string): JwtPayload {
		try {
			return jwt.verify(token, this.config.secret + this.config.salt) as JwtPayload;
		} catch (error) {
			throw new Error("verification failed");
		}
	}
};

function getUserPayload(request: FastifyRequest)
{
	const token = request.headers.authorization?.replace('Bearer ', '');
	if (!token) {
		throw new Error("token is not provided")
	}
  
	return JwtGenerator.getInstance().verifyToken(token);
};

export {
	getUserPayload
}