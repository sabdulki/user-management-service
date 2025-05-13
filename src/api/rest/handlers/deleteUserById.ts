import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid,TokenType} from '../../../pkg/jwt/JwtGenerator';

export async function deleteUserById(request: FastifyRequest, reply: FastifyReply) {
	try {
        await isTokenValid(request);
        const {userId} = request.params as {userId : number}; //распаковка
        request.server.storage.deleteUserById(userId);
		// close his session and delete all jwt tokens
        return reply.code(200).send();
    } catch (error: any) {
        return (reply.code(404).send({ error: 'error'}));
    }
}