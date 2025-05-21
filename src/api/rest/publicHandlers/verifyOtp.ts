// if otp is correct it sends access and refresh tokens. 

import Config from 'config/Config';
import { FastifyRequest, FastifyReply } from 'fastify'
import RadishClient from 'pkg/client/client';
import { generateJwtTokenPair, isTokenValid } from 'pkg/jwt/JwtGenerator';

export class OtpManager {
    private static instance: OtpManager;
    private radishClient: RadishClient;
    private constructor() {
        const host = Config.getInstance().getRadishHost();
        const port = Config.getInstance().getRadishPort();
        this.radishClient = new RadishClient({ host, port});
    }

    public static getInstance(): OtpManager {
		if (!OtpManager.instance) {
			OtpManager.instance = new OtpManager();
		}
		return OtpManager.instance;
	}
}


async function checkOtpMatch(uuid: string, userOtp: string): Promise<number>{
    const radishClient = new RadishClient({ host, port}); // создавать новый инстанс Радиша????
    const response = await radishClient.get(`uuid-${uuid}`);
    if (response.status !== 200)
        return 500;
    const radishOtp = response?.value;
    if (radishOtp !== userOtp)
        return 403;
    return 200;
}

export async function verifyOtp (request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const userId = payload.userId;
    const body = request.body as { uuid: string, otp: string }
    const uuid = body.uuid;
    const userOtp = body.otp;
    if (!uuid || !userOtp)
        return reply.code(400).send(); // bad request
    const matchStatus = await checkOtpMatch(uuid, userOtp);
    if (matchStatus !== 200)
        return reply.code(400).send(); // internal server error or forbiden

    try {
        const tokenPair = await generateJwtTokenPair({ userId });
        if (!tokenPair) {
          return reply.code(500).send();
        }
        return reply.code(200).send({
          accessToken: tokenPair.accessToken,
          refreshToken: tokenPair.refreshToken
        })
    } catch (err: any) {
        if (err.message === 'Failed to get user') {
          return reply.code(409).send({ error: 'User already exists' }); // 409 Conflict
        }
        if (err.message === 'DatabaseFailure') {
          return reply.code(500).send({ error: 'Database error' });
        }
        return reply.code(400).send({ error: 'Invalid data', detail: err.message });
    }
    
}