import { FastifyReply, FastifyRequest } from "fastify";
import { deleteLeaderboardCach } from "../publicHandlers/auth/registration";

export async function updateRating(request: FastifyRequest, reply: FastifyReply) {
    const payload = request.body as Array<{ id: number; rating: number }>;

    if (!Array.isArray(payload)) {
      return reply.status(400).send({ error: 'Invalid payload format' });
    }   

    try {
      request.server.storage.updateRatingTransaction(payload);
    } catch (err: any) {
      console.error(err);
      return reply.status(500).send({ error: 'Failed to update ratings' });
    }
    //  delete radish top5_rating_leader
    let status = 200;
    const deleteStatus = deleteLeaderboardCach();
    if (!deleteStatus)
      status = 500;

    return reply.code(status).send({ success: true, updated: payload.length });
}