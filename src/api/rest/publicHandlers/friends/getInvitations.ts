import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../../pkg/jwt/JwtGenerator';
import {InvitationStatus }from '../../../../storage/DatabaseStorage';
import UserBaseInfo from 'types/UserBaseInfo';

export interface InvitationListForm {
    recordId: number,
    senderId: number;
    nickname: string
}

export async function getInvitations(request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId)
        return reply.code(401).send();
    const userId = payload.userId;

    const storage = request.server.storage;
    let invitationsList: InvitationListForm[];
    try {
        invitationsList = storage.getInvitationsList(userId);
    } catch (err: any) {
        return reply.code(500).send();
    }
    if (invitationsList.length === 0)
        return reply.code(204).send(invitationsList);
    return reply.code(200).send(invitationsList);

}