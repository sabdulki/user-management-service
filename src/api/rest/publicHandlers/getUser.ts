import { FastifyRequest, FastifyReply } from 'fastify'
import { isTokenValid } from '../../../pkg/jwt/JwtGenerator'
import UserBaseInfo from 'types/UserBaseInfo';

export async function getUserInfo(request: FastifyRequest, reply: FastifyReply) 
{
    try {
        const payload = await isTokenValid(request);
        if (!payload || !payload.userId)
            return reply.code(401).send();
        const userBaseInfo = request.server.storage.getUserById(payload.userId) as UserBaseInfo;
        return reply.code(200).send (userBaseInfo);
    } catch (error: any) {
        if (error.message === 'TokenExtractionFailure' || error.message === 'TokenIsNotValid') {
            return reply.code(401).send({ error: 'TokenFailure' }); // 409 Conflict
        }
        if (error.message === 'Failed to get user') {
            return reply.code(500).send({ error: 'Database error' });
        }
        return (reply.code(400).send(error));
    }
}
