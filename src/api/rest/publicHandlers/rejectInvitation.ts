import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../pkg/jwt/JwtGenerator';
import UserBaseInfo from 'types/UserBaseInfo';
import {InvitationStatus }from '../../../storage/DatabaseStorage';

export async function rejectInvitation(request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const invitedUserId = payload.userId;

    const recordIdRaw = (request.params as any).id;
    const recordId = parseInt(recordIdRaw, 10);
    if (isNaN(recordId)) {
      return reply.code(400).send({ error: 'Invalid user ID' });
    }

    const storage = request.server.storage;

    try {
        storage.changeInvitationStatus(recordId, invitedUserId, InvitationStatus.REJECT);
    } catch ( error: any) {
        if (error.message === 'User not found') {
            return reply.code(400).send();
        } else if (error.message === 'Invitation already exists') {
            return reply.code(409).send();
        } else {
            return reply.code(500).send();
        }
    }
    return reply.code(200).send();    
}