import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../pkg/jwt/JwtGenerator';
import {InvitationStatus }from '../../../storage/DatabaseStorage';

export async function deleteFriend(request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const userId = payload.userId;

    const userToDeleteRaw = (request.params as any).id;
    const userToDelete = parseInt(userToDeleteRaw, 10);
    if (isNaN(userToDelete)) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    const storage = request.server.storage;

    try {
        storage.deleteFriend(userId, userToDelete);
    } catch ( error: any) {
        if (error.message === 'User not found') {
            return reply.code(400).send();
        } else {
            return reply.code(500).send();
        }
    }
    return reply.code(200).send();
}