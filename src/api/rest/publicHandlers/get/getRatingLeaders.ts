import app from '../../../../app';
import { RadishSingleton } from '../../../../pkg/cache/RadishSingleton';
import { FastifyRequest, FastifyReply } from 'fastify'

export const CACHE_KEY = 'rating_leaders';

export async function getRatingLeaders(request: FastifyRequest, reply: FastifyReply) {
	const cache = RadishSingleton.getInstance();
	const getResponse = await cache.get(CACHE_KEY);
    if (getResponse.status === 200)
		return reply.code(200).send(JSON.parse(getResponse.value));
	else if (getResponse.status !== 404) // server error or invalid data
		return reply.code(getResponse.status).send(JSON.parse(getResponse.value));
	// else if this record doesn't exist (404)

	const top5Players = request.server.storage.getRatingLeadres();
	if (!top5Players)
		return reply.code(509).send();

	if (top5Players.length === 0) {
		return reply.code(204).send(top5Players);
	}
	const expireTime = 120; 
	const setResponse = await cache.set(`${CACHE_KEY}`, `${JSON.stringify(top5Players)}`, expireTime);
	if (setResponse.status !== 201 && setResponse.status !== 409)
		return reply.code(507).send(); // server error or invalid data
	return reply.code(200).send(top5Players);
}


export async function deleteLeaderboardCach(): Promise<boolean> {
	const radishClient = app.cache;
	const response = await radishClient.delete(CACHE_KEY);
	if (response.status != 200)
		return false;
	console.log("deleted! CACHE_KEY");
	return true;
}