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

dotenv.config();

const app = Fastify()
const registerRoutesPlugin = fp(registerRestRoutes)
const dbConnectorPlugin = fp(setupDatabaseStorage)

async function setupDatabaseStorage() {
  // const isProduction = process.env.MODE === 'production'
  
  const storage = new DatabaseStorage() 
  
  app.decorate('storage', storage)  
  
  app.addHook('onClose', (app, done) => {
    storage.close()
    done()
  })
}

// async function dbConnector(app: FastifyInstance) 
// {
//   const db = new Database('./databases.db', { verbose: console.log });

//   db.exec(`
//     CREATE TABLE IF NOT EXISTS users (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       nickname TEXT UNIQUE,
//       email TEXT UNIQUE,
//       password TEXT,
//       avatar TEXT,
//       removed_at INTEGER DEFAULT null
//     )
//     `)
//   db.exec(`
//     CREATE TABLE IF NOT EXISTS ratings (
//       id INTEGER PRIMARY KEY AUTOINCREMENT,
//       user_id BIGINT NOT NULL,
//       value INTEGER DEFAULT 1000,
//       FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
//     )
//   `)
//   app.decorate('sqlite', db)

//   app.addHook("onClose", (app, done) => {
//     db.close();
//     done();
//   });

//   console.log("Database users and ratings created successfully");
// }

async function main() 
{
  await app.register(dbConnectorPlugin);
  await app.register(registerRoutesPlugin);
  await app.register(cors, {
    origin: true, // разрешить ВСЕ источники
    methods: ['GET', 'POST', 'PUT',' PATCH', 'DELETE', 'OPTIONS']
  });

  // Берёт root — /path/to/project/public (твой ../public из __dirname)
  // Склеивает root и путь после префикса
  await app.register(fastifyStatic, {
    root: path.join(__dirname, '../public'), // ROOT
    prefix: '/auth/public/', // ALWAYS END WITH '/'
  });
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 2 * 1024 * 1024 // Optional: enforce 2MB at plugin level too
    }
  });
  
  const configInstance =  Config.getInstance()
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
    // startRedirectPath: '/auth/api/rest/google/login',
    callbackUri: googleCallbackUrl,
    scope: ['https://www.googleapis.com/auth/userinfo.email', 'https://www.googleapis.com/auth/userinfo.profile', 'openid']
  });
  app.addHook('onRequest', loggerMiddleware)

  try {
    setUpJwtGenerator();
  } catch (error : any) {
    console.log(error);
    process.exit(1)
  }

  const host = configInstance.getHost();
  const port = configInstance.getPort();

  app.listen({ host, port }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    console.log("Server listening at " + address)
  })
}

main()

export default app;