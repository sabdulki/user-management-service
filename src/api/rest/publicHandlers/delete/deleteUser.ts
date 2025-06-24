import { FastifyRequest, FastifyReply } from 'fastify'
import {deleteJwtTokenPair} from '../../../../pkg/jwt/JwtGenerator';
import { deleteLeaderboardCach } from '../get/getRatingLeaders';


export async function deleteUser(request: FastifyRequest, reply: FastifyReply) 
{
    try {
        const {userId} = request.params as {userId : number}; //распаковка
        request.server.storage.deleteUser(userId);
        if (!deleteJwtTokenPair(request))
            return reply.code(404).send();
        const deleteStatus = deleteLeaderboardCach();
        if (!deleteStatus)
          return reply.code(500).send();
        return reply.code(200).send();
    } catch (error: any) {
        if (error.message === 'Failed to delete user') {
            return reply.code(500).send({ error: 'Database error' });
        }
        return (reply.code(400).send({ error: 'error'}));
    }
}