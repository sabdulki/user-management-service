import { FastifyRequest, FastifyReply } from 'fastify'
import UserBaseInfo from 'types/UserBaseInfo';
import {isTokenValid, TokenType} from '../../../pkg/jwt/JwtGenerator'

export async function getUserInfoById(request: FastifyRequest, reply: FastifyReply) 
{
    try {
        await isTokenValid(request);
        const {userId} = request.params as {userId : number}; //распаковка
        if (!request.server.storage.isUserAvailable(userId))
            return reply.code(404).send();
        const userBaseInfo = request.server.storage.getUserById(userId) as UserBaseInfo;
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

