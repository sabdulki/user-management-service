import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../../pkg/jwt/JwtGenerator';

export async function rejectInvitation(request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const invitedUserId = payload.userId;

    const recordIdRaw = (request.params as any).invitationId;
    const recordId = parseInt(recordIdRaw, 10);
    if (isNaN(recordId)) {
      return reply.code(400).send({ error: 'Invalid invitationId' });
    }

    const storage = request.server.storage;

    try {
        storage.rejectInvitationTransaction(recordId, invitedUserId);
    } catch ( error: any) {
        if (error.message === 'User not found' || error.message === 'Invitation not found') {
            return reply.code(404).send();
        } else if (error.message === 'Invitation already exists') {
            return reply.code(409).send();
        } else {
            return reply.code(500).send();
        }
    }
    return reply.code(200).send();    
}