import { FastifyReply, FastifyRequest } from "fastify";

export async function updateRating(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.body as Array<{ id: number; rating: number }>;

    if (!Array.isArray(payload)) {
      return reply.status(400).send({ error: 'Invalid payload format' });
    }   

    try {
      request.server.storage.updateRatingTransaction(payload);
      return reply.code(200).send({ success: true, updated: payload.length });
    } catch (err: any) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to update ratings' });
    }
}