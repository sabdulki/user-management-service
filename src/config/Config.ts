import dotenv from 'dotenv';

dotenv.config();

export default class Config {
  private static instance: Config;
  private mode: string;
  private readonly radishHost: string;
  private readonly radishPort: number;
  private readonly port: number;
  private readonly googleClientId: string;
  private readonly googleClientSecret: string;
  private readonly googleCallbackUrl: string;
  private readonly essHost: string;
  private readonly essPort: number;
  // ess

  private constructor() {
    this.mode = process.env.MODE || "develop";
    this.port = Number(process.env.PORT) || 5000;
    this.radishHost = process.env.RADISH_HOST || "localhost";
    this.radishPort = Number(process.env.RADISH_PORT) || 5100;
    this.googleClientId = process.env.GOOGLE_CLIENT_ID!;
    this.googleClientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    this.googleCallbackUrl = process.env.GOOGLE_CALLBACK_URL!;
    this.essHost = process.env.ESS_HOST || "localhost"; //EmailSenderService
    this.essPort = Number(process.env.ESS_PORT) || 5200; // EmailSenderService
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

  public getPort(): number {
    return this.port;
  }

  public getGoogleClientId(): string {
    return this.googleClientId;
  }

  public getGoogleClientSecret(): string {
    return this.googleClientSecret;
  }

  public getGoogleCallbackUrl(): string {
    return this.googleCallbackUrl;
  }

  public getEssHost(): string {
    return this.essHost;
  }

  public getEssPort(): number {
    return this.essPort;
  }
};
