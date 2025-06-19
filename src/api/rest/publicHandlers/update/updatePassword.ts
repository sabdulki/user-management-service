import { FastifyRequest, FastifyReply } from 'fastify'
import { isTokenValid } from '../../../../pkg/jwt/JwtGenerator'
import UserBaseInfo from 'types/UserBaseInfo';
import IStorage from 'interfaces/IStorage';

function setNewUserPassword(storage: IStorage, userId: number, newPassword: string): number {
    try {
        storage.setUserPassword(userId, newPassword);
    } catch (err: any) {
        if (err.message === 'Failed to get password' || 'Failed to update user password')
            return 500;
    }
    return 201;
}

async function updatePassword(storage:IStorage, userId:number, newPassword:string, oldPassword:string): Promise<number> {
    try {
        await storage.updatePassword(userId, oldPassword, newPassword);
    } catch (err: any) {
        if (err.message === 'Password is not correct')
            return 403
        else (err.message === 'Failed to get password' || 'Failed to update user password')
            return 500
    }
    return 205;
}

export async function updateUserPassword(request: FastifyRequest, reply: FastifyReply) 
{
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const userId = payload.userId;
    const storage = request.server.storage;
    let status = undefined;
    const body = request.body as { oldPassword?: string, newPassword: string }
    const { oldPassword, newPassword } = body;
    if (!newPassword)
        return reply.code(400).send(); // bad request

    const provider = storage.getUserProvider(userId);
    if (provider === 1 && !oldPassword) {
        status = setNewUserPassword(storage, userId, newPassword);
    }
    else if ((provider === 0 && !oldPassword) || !oldPassword) {
        status = 400;
    }
    else {
       status = await updatePassword(storage, userId, newPassword, oldPassword);
    }
    return reply.code(status).send();
}