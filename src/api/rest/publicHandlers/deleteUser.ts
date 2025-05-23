import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid, TokenType, getTokenFromRequest, deleteJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import { JwtPayload } from 'jsonwebtoken';
import { deleteAvatar } from './uploadAvatar';


export async function deleteUser(request: FastifyRequest, reply: FastifyReply) 
{
    try {
        const {userId} = request.params as {userId : number}; //распаковка
        request.server.storage.deleteUser(userId);
        return reply.code(200).send();
    } catch (error: any) {
        if (error.message === 'Failed to delete user') {
            return reply.code(500).send({ error: 'Database error' });
        }
        return (reply.code(400).send({ error: 'error'}));
    }
}