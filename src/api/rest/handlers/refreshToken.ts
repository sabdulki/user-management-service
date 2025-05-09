import { FastifyRequest, FastifyReply } from 'fastify'
import JwtGenerator, {isTokenValid, generateJwtTokenPair, TokenType } from '../../../pkg/JwtGenerator';

export async function refreshTokensPair(request: FastifyRequest, reply: FastifyReply) {
	try {
		const payload = await isTokenValid(request, TokenType.Refresh);
		const userId = payload.userId;
		const tokenPair = await generateJwtTokenPair({userId});
		return reply.code(201).send({
			accessToken: tokenPair.accessToken,
			refreshToken: tokenPair.refreshToken
		})
	} catch (error: any) {
		if (error.message === "TokenExtractionFailure")
			return (reply.code(400).send({message: 'TokenExtractionFailure'}))
		if (error.message == "TokenVerificationFailure"  || error.message === 'TokenIsNotValid') {
			return reply.code(401).send( {message: 'TokenVerificationFailure'});
		} else {
			return reply.code(500).send( {message: error.message });
		}
	}
}