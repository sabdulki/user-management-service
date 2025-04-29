import Fastify from 'fastify'
import { FastifyInstance } from 'fastify'
import { registerRestRoutes } from './api/rest/rest'
import fp from "fastify-plugin";
import Database from "better-sqlite3";

const app = Fastify()
const registerRoutesPlugin = fp(registerRestRoutes)
const dbConnectorPlugin = fp(dbConnector)

async function dbConnector(app: FastifyInstance) 
{
  const db = new Database('./databases.db', { verbose: console.log });

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nickname TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    )
    `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ratings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id BIGINT NOT NULL,
      value INTEGER DEFAULT 1000,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)
  app.decorate('sqlite', db)

  app.addHook("onClose", (app, done) => {
    db.close();
    done();
  });

  console.log("Database users and ratings created successfully");
}

async function main() 
{
  await app.register(dbConnectorPlugin);
  await app.register(registerRoutesPlugin);

  app.listen({ port: 3000 }, (err, address) => {
    if (err) {
      app.log.error(err)
      process.exit(1)
    }
    console.log("Server listening at " + address)
  })
}

main()
