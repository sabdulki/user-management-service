import { FastifyRequest, FastifyReply } from 'fastify'
import { getUserPayload } from 'pkg/JwtGenerator'
import JwtGenerator from '../../../pkg/JwtGenerator';

export async function deleteUser(request: FastifyRequest, reply: FastifyReply) {
	try {
        const {userId} = request.params as {userId : number}; //распаковка
        request.server.storage.deleteUserById(userId);
		// close his session and felete all jwt tokens
        return reply.code(200).send();
    } catch (error: any) {
        return (reply.code(404).send({ error: 'error'}));
    }
}