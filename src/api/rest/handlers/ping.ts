import { FastifyRequest, FastifyReply } from 'fastify'
import { Storage } from '../../../infrastructure/storage/storage'
import { getUserPayload } from 'pkg/JwtGenerator'

export async function pingHandler(request: FastifyRequest, reply: FastifyReply) {

  //example of getUserPayload()
  // let payload
  // try {
  //   payload = getUserPayload(request);
  // } catch (error: any) {
  //   return reply.code(401)
  // }

  const storage = new Storage()
  const result = await storage.testRequestToDB()
  return { pong: result }
}
