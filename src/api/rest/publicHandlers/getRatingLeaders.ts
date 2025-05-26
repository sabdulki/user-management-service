import RadishClient from '../../../pkg/client/client';
import Config from '../../../config/Config';
import { FastifyRequest, FastifyReply } from 'fastify'
import { INTERNAL } from 'sqlite3';

const CACHE_KEY = 'top5_rating_leader';

export async function getRatingLeaders(request: FastifyRequest, reply: FastifyReply) {
	const host = Config.getInstance().getRadishHost();
	const port = Config.getInstance().getRadishPort();
	const radishClient = new RadishClient({ host, port});

	const getResponse = await radishClient.get(CACHE_KEY);
	// привести к массиву Array<{ username: string, score: number }> 	
    if (getResponse.status === 200) {
		return reply.send(JSON.parse(getResponse.value));
    }
	const top5Players = request.server.storage.getRatingLeadres();
	if (!top5Players)
		return reply.code(500).send();
	
	const expireTime = 300; 
    // const response = await this.radishClient.set(`uuid-${uuid}`, JSON.stringify({otp, userId}), expireTime);
	
	const setResponse = await radishClient.set(`${CACHE_KEY}-${JSON.stringify(top5Players)}`, "true", expireTime);
	//save in cach for 2 minutes
	
	return reply.code(200).send(top5Players);
	// return 
}