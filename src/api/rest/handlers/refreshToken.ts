import { FastifyRequest, FastifyReply } from 'fastify'
import { getUserPayload } from '../../../pkg/JwtGenerator'
import JwtGenerator from '../../../pkg/JwtGenerator';

export async function refreshTokensPair(request: FastifyRequest, reply: FastifyReply) {
	let refreshToken;
	try {
		const body = request.body as { refreshToken: string };
		refreshToken = body.refreshToken;
	} catch (error: any) {
		return reply.code(400).send({ message: 'Missing refresh token' });
	}
	try {
		const instance = JwtGenerator.getInstance();
		const payload = instance.verifyToken(refreshToken);
		const userId = payload.userId;
		const tokenPair = instance.generateTokenPair({userId});
		return reply.code(201).send({
			accessToken: tokenPair.accessToken,
			refreshToken: tokenPair.refreshToken
		})
	} catch (error: any) {
		if (error.message == "TokenVerificationFailure") {
			return reply.code(401).send( {message: 'TokenVerificationFailure'});
		} else {
			return reply.code(500).send( {message: error.message });
		}
	}
}