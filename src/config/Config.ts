import dotenv from 'dotenv';

dotenv.config();

export default class Config {
  private static instance: Config;
    // private readonly secret: string;
    // private readonly salt: string;
    // private readonly accessExpiresIn: string;
    // private readonly refreshExpiresIn: string;

  private constructor() {
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
};
