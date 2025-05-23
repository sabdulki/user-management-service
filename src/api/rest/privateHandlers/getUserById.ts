import { FastifyRequest, FastifyReply } from 'fastify'
import UserBaseInfo from 'types/UserBaseInfo';

export async function getUserInfoById(request: FastifyRequest, reply: FastifyReply) 
{
    try {
        const userIdRaw = (request.params as any).id;
        const userId = parseInt(userIdRaw, 10);
        if (isNaN(userId)) {
          return reply.code(400).send({ error: 'Invalid user ID' });
        }
        const userBaseInfo = request.server.storage.getUserById(userId) as UserBaseInfo;
        return reply.code(201).send (userBaseInfo);
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

