import { FastifyRequest, FastifyReply } from 'fastify'
import UserBaseInfo from 'types/UserBaseInfo';

export async function getUserInfoById(request: FastifyRequest, reply: FastifyReply) 
{
    try {
        const {userId} = request.params as {userId : number}; //распаковка
        const userBaseInfo = request.server.storage.getUserById(userId) as UserBaseInfo;
        return reply.code(201).send (userBaseInfo);
    } catch (error: any) {
        if (error.message === 'TokenExtractionFailure') {
            return reply.code(401).send({ error: 'TokenFailure' }); // 409 Conflict
        }
        if (error.message === 'Failed to get user') {
            return reply.code(500).send({ error: 'Database error' });
        }
        return (reply.code(400).send({ error: 'error'}));
    }
}

