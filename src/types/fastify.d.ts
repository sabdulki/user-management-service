import 'fastify'
import Database from 'better-sqlite3'
import IStorage from '../models/storage'

declare module 'fastify' {
  interface FastifyRequest {
    server: FastifyInstance
  }
  interface FastifyInstance {
    storage: IStorage
  }
}
