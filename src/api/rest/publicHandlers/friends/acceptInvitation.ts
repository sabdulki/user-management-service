import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../../pkg/jwt/JwtGenerator';
import UserBaseInfo from 'types/UserBaseInfo';
import {InvitationStatus }from '../../../../storage/DatabaseStorage';


export async function acceptInvitation (request: FastifyRequest, reply: FastifyReply) {

    const payload = await isTokenValid(request);
    if (!payload || !payload.userId) {
        return reply.code(401).send();
    }
    const invitedUserId = payload.userId;

    const recordIdRaw = (request.params as any).invitationId;
    const recordId = parseInt(recordIdRaw, 10);
    if (isNaN(recordId)) {
      return reply.code(400).send({ error: 'Invalid recordId' });
    }

    const storage = request.server.storage;

    let senderUserBaseInfo: UserBaseInfo;
    try {
        senderUserBaseInfo = storage.acceptInvitationAndAddFriendsTransaction(recordId, invitedUserId);
        console.log("senderUserBaseInfo2: ", senderUserBaseInfo)
        return reply.code(201).send({"senderUserBaseInfo": senderUserBaseInfo});
    } catch (error: any) {
        console.log(error);
        if (error.message === 'User not found' || error.message === 'Invitation not found') {
            return reply.code(404).send();
        } else if (error.message === 'Invitation already exists' || error.message === 'Record already exists') {
            return reply.code(409).send();
        } else {
            return reply.code(500).send();
        }
    }
}