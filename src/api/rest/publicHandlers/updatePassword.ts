import { FastifyRequest, FastifyReply } from 'fastify'
import { isTokenValid } from '../../../pkg/jwt/JwtGenerator'
import UserBaseInfo from 'types/UserBaseInfo';

export async function updateUserPassword(request: FastifyRequest, reply: FastifyReply) 
{
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const body = request.body as { oldPassword: string, newPassword: string }
    const oldPassword = body.oldPassword;
    const newPassword = body.newPassword;
    if (!oldPassword || !newPassword)
        return reply.code(400).send(); // bad request
    try {
        await request.server.storage.updatePassword(payload.userId, oldPassword, newPassword);
    } catch (err: any) {
        if (err.message === 'Password is not correct')
            return reply.code(403).send();
        else (err.message === 'Failed to get password' || 'Failed to update user password')
            return reply.code(500).send(err);
    }
    return reply.code(205).send();
}