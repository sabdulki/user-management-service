// if otp is correct it sends access and refresh tokens. 

import Config from '../../../config/Config';
import { FastifyRequest, FastifyReply } from 'fastify'
import RadishClient from '../../../pkg/client/client';
import { generateJwtTokenPair, isTokenValid } from '../../../pkg/jwt/JwtGenerator';

export class OtpManager {
    private static instance: OtpManager;
    private radishClient: RadishClient;
    private constructor() {
        const host = Config.getInstance().getRadishHost();
        const port = Config.getInstance().getRadishPort();
        this.radishClient = new RadishClient({ host, port});
        // setTimeout( async () => {
        //     const response = await this.radishClient.set("example", "example");
        //     console.log(response);
        // }, 0);
        
    }

    public static getInstance(): OtpManager {
		if (!OtpManager.instance) {
			OtpManager.instance = new OtpManager();
		}
        console.log(" successfully created OtpManager ")
		return OtpManager.instance;
	}

    public async checkOtpMatch(uuid: string, userOtp: string): Promise<{userId: number | undefined, status: number}>{
        const response = await this.radishClient.get(`uuid-${uuid}`);
        let userId = undefined;
        let status;
        if (response.status !== 200) {
            status = 500;
            return {userId, status};
        }
        console.log("response?.value: ", response?.value);
        const obj = JSON.parse(response?.value);
        if (!obj.otp || ! obj.userId) {
            status = 500;
            return {userId, status};
        }
        userId = obj.userId;
        const radishOtp = obj.otp;
        if (radishOtp !== userOtp) {
            status = 403;
            return {userId, status};
        }
        status = 200;
        const radishResponse = await this.radishClient.delete(`uuid-${uuid}`);
        if (radishResponse.status !== 200) {
            status = 403;
            return {userId, status};
        }

        return {userId, status};
    }

    public async saveUuidInRadish(userId: number, uuid: string, otp: string, expireTime: number) : Promise<number> {
        console.log("in saveUuidInRadish")
        
        const response = await this.radishClient.set(`uuid-${uuid}`, JSON.stringify({otp, userId}), expireTime);
        if (response.status !== 201){
            console.log("radishClient set failed")
            return 500;
        }
        return 200;
      }
}

export async function verifyOtp (request: FastifyRequest, reply: FastifyReply) {
    // const payload = await isTokenValid(request);
    // if (!payload || !payload.userId)
    //     return reply.code(401).send();
    const body = request.body as { uuid: string, otp: string}
    const uuid = body.uuid;
    const userOtp = body.otp;
    if (!uuid || !userOtp)
        return reply.code(400).send(); // bad request

    const OtpManagerInstance = OtpManager.getInstance();
    const obj = await OtpManagerInstance.checkOtpMatch(uuid, userOtp);
    if (obj.status !== 200 || !obj.userId)
        return reply.code(400).send(); // internal server error or forbiden
    const userId = obj.userId;
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
    return reply.code(400).send(); 
    
}