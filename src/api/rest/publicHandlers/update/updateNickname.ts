import { FastifyRequest, FastifyReply } from 'fastify'
import { isTokenValid } from '../../../../pkg/jwt/JwtGenerator'
import UserBaseInfo from 'types/UserBaseInfo';
import { MAX_NICKNAME_LENGTH, NICKNAME_REGEX } from '../auth/registration';

function isNicknameValid(nickname: string): boolean {
    return nickname.length <= MAX_NICKNAME_LENGTH && NICKNAME_REGEX.test(nickname);
}

export async function updateUserNickname(request: FastifyRequest, reply: FastifyReply) 
{
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
     
    const body = request.body as { nickname: string }

    if (!isNicknameValid(body.nickname)) {
        return reply.code(400).send({ message: 'Invalid nickname' });
    }
    // const nickname = body.nickname
    try {
        request.server.storage.updateNicknmae(payload.userId, body.nickname);
    } catch (err: any) {
        if (err.message === 'Nicknmae is already taken')
            return reply.code(409).send();
        else (err.message === 'Failed to update user nickname')
            return reply.code(500).send(err);
    }


}