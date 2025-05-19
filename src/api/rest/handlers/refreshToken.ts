import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid, generateJwtTokenPair, TokenType } from '../../../pkg/jwt/JwtGenerator';

export async function refreshTokensPair(request: FastifyRequest, reply: FastifyReply) 
{
	const payload = await isTokenValid(request, TokenType.Refresh);
	if (!payload || !payload.userId)
		return reply.code(401).send();
	const userId = payload.userId;
	if (!request.server.storage.isUserAvailable(userId))
		return reply.code(404).send();
	const tokenPair = await generateJwtTokenPair({userId});
	if (!tokenPair)
		return reply.code(500).send();
	return reply.code(201).send({
		accessToken: tokenPair.accessToken,
		refreshToken: tokenPair.refreshToken
	})

}