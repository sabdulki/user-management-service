import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid, TokenType, getTokenFromRequest, deleteJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import { JwtPayload } from 'jsonwebtoken';
import { deleteAvatar } from './uploadAvatar';

export async function removeUser(request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request) as JwtPayload;
    if (!payload || !payload.userId)
        return reply.code(404).send();
    const userId = payload.userId;
    if (!request.server.storage.isUserAvailable(userId))
        return reply.code(404);
    try {
        request.server.storage.setUserUnavalible(userId);
        if (!deleteJwtTokenPair(request))
            return reply.code(404).send();
        const avatarPath = request.server.storage.getUserAvatar(userId);
        if (avatarPath) {
            deleteAvatar(userId, avatarPath, request.server.storage);
        }
        return reply.code(200).send();
    } catch (error: any) {
        return reply.code(404).send({ error });
    }
}