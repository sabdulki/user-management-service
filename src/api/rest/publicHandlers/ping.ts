import { FastifyRequest, FastifyReply } from 'fastify'
import { Storage } from '../../../infrastructure/storage/storage'

export async function pingHandler(request: FastifyRequest, reply: FastifyReply) {

  //example of getUserPayload()
  // let payload
  // try {
  //   payload = await getUserPayload(request);
  // } catch (error: any) {
  //   return reply.code(401).send()
  // }

  const storage = new Storage()
  const result = await storage.testRequestToDB()
  return { pong: result }
}
