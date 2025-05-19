import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid, TokenType, getTokenFromRequest, deleteJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import { JwtPayload } from 'jsonwebtoken';

export async function removeUser(request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request) as JwtPayload;
    if (!payload || !payload.userId)
        return reply.code(404).send();
    if (!request.server.storage.isUserAvailable(payload.userId))
        return reply.code(404);
    try {
        request.server.storage.setUserUnavalible(payload.userId);
        if (!deleteJwtTokenPair(request))
            return reply.code(404).send();
        return reply.code(200).send();
    } catch (error: any) {
        return reply.code(404).send({ error });
    }
}