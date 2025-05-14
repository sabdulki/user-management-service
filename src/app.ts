import Fastify from 'fastify'
import { registerRestRoutes } from './api/rest/rest'
import fp from "fastify-plugin";
import DatabaseStorage from './storage/DatabaseStorage'
import dotenv from 'dotenv';
import Config from './config/Config';
import cors from '@fastify/cors'
import loggerMiddleware from "./pkg/middlewares/loggerMiddleware"
import { setUpJwtGenerator } from './pkg/jwt/JwtGenerator';
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import path from 'path'
import fastifyOauth2 from '@fastify/oauth2'


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
//       password TEXT
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
  })
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 2 * 1024 * 1024 // Optional: enforce 2MB at plugin level too
    }
  })
  await app.register(fastifyStatic, {
    root: path.join(__dirname, 'public'),
    prefix: '/avatars/', // so /avatars/filename.jpg works
  })

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
    startRedirectPath: 'google/login',
    callbackUri: googleCallbackUrl
  })
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