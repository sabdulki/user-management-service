import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../pkg/jwt/JwtGenerator';

export async function inviteFriend (request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const body = request.body as {recieverNickname: string}
    const recieverNickname = body.recieverNickname;

    const storage = request.server.storage;

    let recieverId;
    try {
        recieverId = storage.getUserByNickname(recieverNickname);
    } catch (err: any) {
        return reply.code(404).send();
    }

    try {
        storage.createInvitation(payload.userId, recieverId);
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