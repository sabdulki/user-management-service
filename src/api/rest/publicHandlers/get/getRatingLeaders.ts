import { RadishSingleton } from '../../../../pkg/cache/RadishSingleTon';
import { FastifyRequest, FastifyReply } from 'fastify'

export const CACHE_KEY = 'top5_rating_leader';

export async function getRatingLeaders(request: FastifyRequest, reply: FastifyReply) {
	const cache = RadishSingleton.getInstance();
	const getResponse = await cache.get(CACHE_KEY);
    if (getResponse.status === 200)
		return reply.send(JSON.parse(getResponse.value));

	const top5Players = request.server.storage.getRatingLeadres();
	if (!top5Players)
		return reply.code(500).send();
	
	const expireTime = 120; 
	const setResponse = await cache.set(`${CACHE_KEY}`, `${JSON.stringify(top5Players)}`, expireTime);
	if (setResponse.status !== 201)
		return reply.code(507).send();
	return reply.code(200).send(top5Players);
}
