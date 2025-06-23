import dotenv from 'dotenv';
import Fastify from 'fastify'
import fp from "fastify-plugin";
import cors from '@fastify/cors'
import fastifyOauth2 from '@fastify/oauth2'
import fastifyStatic from '@fastify/static'
import fastifyMultipart from '@fastify/multipart'
import { registerRestRoutes } from './api/rest/rest'
import DatabaseStorage from './storage/DatabaseStorage'
import loggerMiddleware from "./pkg/middlewares/loggerMiddleware"
import { setUpJwtGenerator } from './pkg/jwt/JwtGenerator';
import Config from './config/Config';
import path, {dirname} from 'path'
import RadishClient from './pkg/cache/client/client';
import { RadishSingleton } from './pkg/cache/RadishSingleton';
import registerWebSocketRoutes from './api/ws/ws';

dotenv.config();

const app = Fastify()
const registerRoutesPlugin = fp(registerRestRoutes)
const registerWSRoutesPlugin = fp(registerWebSocketRoutes)
const dbConnectorPlugin = fp(setupStorage)

async function declareDataBase() {
  const storage = new DatabaseStorage() 
  app.decorate('storage', storage)  
  app.addHook('onClose', (app, done) => {
    storage.close()
    done()
  })
}

async function declareCache() {
  const host = Config.getInstance().getRadishHost();
  const port = Config.getInstance().getRadishPort();
  const cache = new RadishClient({host, port}) 
  app.decorate('cache', cache)  
  app.addHook('onClose', (app, done) => {
    cache.close()
    done()
  })
}

async function setupStorage() {
  await declareDataBase();
  await declareCache()
}

async function main() 
{
  await app.register(dbConnectorPlugin);
  await app.register(registerRoutesPlugin);
  await app.register(registerWSRoutesPlugin);
  await app.register(cors, {
    origin: true,
    methods: ['GET', 'POST', 'PUT',' PATCH', 'DELETE', 'OPTIONS']
  });

  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../public'),
    prefix: '/auth/public/',
  });
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 2 * 1024 * 1024
    },
    throwFileSizeLimit: true,
  });
  
  try {
    const cache = RadishSingleton.getInstance();
    setUpJwtGenerator(cache);
  } catch (error : any) {
    console.log(error);
    process.exit(1)
  }

  const configInstance = Config.getInstance()
  const googleClientId = configInstance.getGoogleClientId();
  const googleClientSecret = configInstance.getGoogleClientSecret();
  const googleCallbackUrl = configInstance.getGoogleCallbackUrl();

  await app.register(fastifyOauth2, {
    name: 'googleOAuth2',
    credentials: {
      client: {
        id: googleClientId,
        secret: googleClientSecret
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION
    },
    callbackUri: googleCallbackUrl,
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'openid']
  });
  app.addHook('onRequest', loggerMiddleware)

  
  
  const host = configInstance.getHost();
  const port = configInstance.getPort();
  app.listen({ host, port }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    console.log("Server listening at " + address)
  })

  process.on('SIGINT', async () => {
    await app.close()
    process.exit(0)
  })
  
  process.on('SIGTERM', async () => {
    await app.close()
    process.exit(0)
  })
  
  process.on('uncaughtException', (err) => {
    process.exit(1)
  })
}

main()

export default app;