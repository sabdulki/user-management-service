import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid, generateJwtTokenPair, TokenType } from '../../../pkg/jwt/JwtGenerator';

export async function refreshTokensPair(request: FastifyRequest, reply: FastifyReply) 
{
	const payload = await isTokenValid(request, TokenType.Refresh);
	if (!payload)
		return reply.code(401).send();
	const userId = payload.userId;
	const tokenPair = await generateJwtTokenPair({userId});
	if (!tokenPair)
		return reply.code(500).send();
	return reply.code(201).send({
		accessToken: tokenPair.accessToken,
		refreshToken: tokenPair.refreshToken
	})

}