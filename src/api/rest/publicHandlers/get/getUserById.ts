import { FastifyRequest, FastifyReply } from 'fastify'
import UserBaseInfo from 'types/UserBaseInfo';
import {isTokenValid}  from '../../../../pkg/jwt/JwtGenerator';

export async function getUserById(request: FastifyRequest, reply: FastifyReply) 
{
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    try {
        const userIdRaw = (request.params as any).userId;
        const userId = parseInt(userIdRaw, 10);
        if (isNaN(userId)) {
          return reply.code(400).send({ error: 'Invalid user ID' });
        }
        const userBaseInfo = request.server.storage.getUserById(userId) as UserBaseInfo;
        return reply.code(200).send (userBaseInfo);
    } catch (error: any) {
        if (error.message === 'Failed to get user') {
            return reply.code(500).send({ error: 'Database error' });
        }
        if (error.message === 'UserNotFound') {
            return reply.code(404).send({ error: 'User Not Found' });
        }
        return (reply.code(400).send(error));
    }
}

