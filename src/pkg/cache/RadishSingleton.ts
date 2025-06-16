import Config from "../../config/Config";
import RadishClient from "./client/client";

export class RadishSingleton {
    private static instance: RadishClient;
  
    static getInstance(): RadishClient {
      if (!RadishSingleton.instance) {
        const config = Config.getInstance();
        RadishSingleton.instance = new RadishClient({
          host: config.getRadishHost(),
          port: config.getRadishPort(),
        });
      }
      return RadishSingleton.instance;
    }
}
  