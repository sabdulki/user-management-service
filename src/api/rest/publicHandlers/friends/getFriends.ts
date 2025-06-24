import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../../pkg/jwt/JwtGenerator';
import UserBaseInfo from 'types/UserBaseInfo';

export async function getFriends(request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const issuerId = payload.userId;

    const storage = request.server.storage;
    let friendsList: UserBaseInfo[];
    try {
        friendsList = storage.getFriendsList(issuerId);
    } catch (err: any) {
        return reply.code(500).send();
    }
    if (friendsList.length === 0)
        return reply.code(204).send(friendsList);
    return reply.code(200).send(friendsList);
}