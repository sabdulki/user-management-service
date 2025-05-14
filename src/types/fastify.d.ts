import 'fastify'
import Database from 'better-sqlite3'
import IStorage from '../models/storage'
import '@fastify/oauth2'
import { FastifyOAuth2Namespace } from '@fastify/oauth2'


declare module 'fastify' {
  interface FastifyRequest {
    server: FastifyInstance
  }
  interface FastifyInstance {
    storage: IStorage
  }
  interface FastifyInstance {
    googleOAuth2: FastifyOAuth2Namespace

  }
}
