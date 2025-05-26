import Config from '../../../config/Config';
import { FastifyRequest, FastifyReply } from 'fastify'
import RadishClient from '../../../pkg/client/client';
import { generateJwtTokenPair, isTokenValid } from '../../../pkg/jwt/JwtGenerator';
import UserCreateForm from '../../../models/UserCreateForm';
import RadishResponse from 'pkg/client/response';
import { saveRegisteredUser } from './registration';

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

    public async checkOtpMatch(uuid: string, userOtp: string): Promise<{userId: number | undefined, status: number}>{
        const response = await this.radishClient.get(`uuid-${uuid}`);
        let userId = undefined;
        let form: UserCreateForm | undefined = undefined;
        let status: number;
        if (response.status !== 200) {
            status = 500;
            return {userId, status};
        }
        const obj = JSON.parse(response?.value);
        if (!obj.otp) {
            status = 500;
            console.log("otp is not provided in cash");
            return {userId, status};
        }
        if (obj.form) {
            form = obj.form;
        }
        else if (obj.userId)
            userId = obj.userId;
        else {
            status = 400;
            console.log("neither userId nor form is provided in cash");
            return {userId, status};
        }
        
        const radishOtp = obj.otp;
        if (radishOtp !== userOtp) {
            status = 403;
            return {userId, status};
        }
        if (form) {
            const obj = await saveRegisteredUser(form);
            if (obj.status !== 201 || !obj.userId) {
                status = obj.status;
                return {userId, status};
            }
            userId = obj.userId;
        }

        status = 200;
        const radishResponse = await this.radishClient.delete(`uuid-${uuid}`);
        if (radishResponse.status !== 200) {
            status = 403;
            return {userId, status};
        }

        return {userId, status};
    }

    public async saveUuidInRadish(identifier: { userId?: number; form?: UserCreateForm }, uuid: string, otp: string, expireTime: number) : Promise<number> {
        let response: RadishResponse;
        if (identifier.userId) {
            const userId = identifier.userId;
            response = await this.radishClient.set(`uuid-${uuid}`, JSON.stringify({otp, userId}), expireTime);
        }
        else if (identifier.form) {
            const form = identifier.form;
            response = await this.radishClient.set(`uuid-${uuid}`, JSON.stringify({otp, form}), expireTime);
        }
        else {
            console.log("Neither userId nor form provided");
            return 400; // or throw an error
        }

        if (response.status !== 201){
            console.log("radishClient set failed")
            return 500;
        }

        return 200;
    }
}

export async function verifyOtp (request: FastifyRequest, reply: FastifyReply) {
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
          return reply.code(409).send({ error: 'User already exists' });
        }
        if (err.message === 'DatabaseFailure') {
          return reply.code(500).send({ error: 'Database error' });
        }
        return reply.code(400).send({ error: 'Invalid data', detail: err.message });
    }
}