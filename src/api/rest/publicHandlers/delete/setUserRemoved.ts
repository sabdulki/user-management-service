import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid, deleteJwtTokenPair} from '../../../../pkg/jwt/JwtGenerator';
import { JwtPayload } from 'jsonwebtoken';
import { deleteAvatar } from './../update/uploadAvatar';
import { deleteLeaderboardCach } from '../get/getRatingLeaders';

import { DEFAULT_AVATAR } from '../update/uploadAvatar';

export async function setUserRemoved(request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request) as JwtPayload;
    if (!payload || !payload.userId)
        return reply.code(404).send({error: "invalid jwt tokens"});
    const userId = payload.userId;
    if (!request.server.storage.isUserAvailable(userId))
        return reply.code(404).send({error: "user is not avaliable"});
    try {
        request.server.storage.setUserUnavalibleTransaction(userId);
        if (!deleteJwtTokenPair(request))
            return reply.code(404).send();
        const avatarPath = request.server.storage.getUserAvatar(userId);
        if (avatarPath && avatarPath !== DEFAULT_AVATAR) {
            deleteAvatar(userId, avatarPath, request.server.storage);
        }
        const deleteStatus = deleteLeaderboardCach();
        if (!deleteStatus)
          return reply.code(500).send()
    } catch (error: any) {
        return reply.code(404).send({ error });
    }
    return reply.code(200).send();
}