import { FastifyRequest, FastifyReply } from 'fastify'
import { getUserPayload, isTokenValid, TokenType } from '../../../pkg/JwtGenerator'
import UserBaseInfo from 'types/UserBaseInfo';

export async function getUserInfo(request: FastifyRequest, reply: FastifyReply) 
{
    try {
        await isTokenValid(request, TokenType.Access);
        const payload = await getUserPayload(request);
        const userBaseInfo = request.server.storage.getUserById(payload.userId) as UserBaseInfo;
        return reply.code(201).send (userBaseInfo);
    } catch (error: any) {
        if (error.message === 'TokenExtractionFailure' || error.message === 'TokenIsNotValid') {
            return reply.code(401).send({ error: 'TokenFailure' }); // 409 Conflict
        }
        if (error.message === 'Failed to get user') {
            return reply.code(500).send({ error: 'Database error' });
        }
        return (reply.code(400).send({ error: 'error'}));
    }
}
