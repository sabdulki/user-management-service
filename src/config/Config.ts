import dotenv from 'dotenv';

dotenv.config();

export default class Config {
  private static instance: Config;
  private mode: string;
  private readonly radishHost: string;
  private readonly radishPort: number;
    // private readonly secret: string;
    // private readonly salt: string;
    // private readonly accessExpiresIn: string;
    // private readonly refreshExpiresIn: string;

  private constructor() {
    this.mode = process.env.MODE || "develop";
    this.radishHost = process.env.RADISH_HOST || "localhost";
    this.radishPort = Number(process.env.RADISH_PORT) || 5100;
    // if (!this.radishHost || !this.radishPort) {
		// 	throw new Error("Radish initialization error : not enough arguments.")
		// }
    // this.secret = process.env.JWT_SECRET!;
    // this.salt = process.env.JWT_SALT!;
    // this.accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
    // this.refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "90d";
  }

  public static getInstance(): Config {
    if (!Config.instance) {
      Config.instance = new Config();
    }
    return Config.instance;
  }

  public getRadishHost(): string {
    return this.radishHost;
  }

  public getRadishPort(): number {
    return this.radishPort;
  }

  public getHost(): string {
    if (this.mode === "production") {
      return "0.0.0.0";
    } 
    return "localhost";
  }
};
