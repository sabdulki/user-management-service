import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

interface JwtPayload {
  userId: number;
  [key: string]: any; // optionally allow additional data
}

export default class Config {
  private static instance: Config;
  private readonly secret: string;
  private readonly salt: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  private constructor() {
    this.secret = process.env.JWT_SECRET!;
    this.salt = process.env.JWT_SALT!;
    this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
    this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "90d";
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  private generateToken(payload: JwtPayload, expiresIn: string): string {
    // Include salt in signature by appending it to the secret
    return jwt.sign(payload as jwt.JwtPayload, this.secret + this.salt, {
		expiresIn: expiresIn as jwt.SignOptions['expiresIn'],
	  });
  }

  public generateTokenPair(payload: JwtPayload): { accessToken: string; refreshToken: string } {
    const accessToken = this.generateToken(payload, this.accessExpiresIn);
    const refreshToken = this.generateToken(payload, this.refreshExpiresIn);
    return { accessToken, refreshToken };
  }

  public verifyToken(token: string): JwtPayload {
    return jwt.verify(token, this.secret + this.salt) as JwtPayload;
  }
}
