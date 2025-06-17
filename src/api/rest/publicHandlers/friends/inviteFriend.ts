import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../../pkg/jwt/JwtGenerator';
import Config from '../../../../config/Config';
import UserBaseInfo from 'types/UserBaseInfo';
import { emailBodyContent, sendToEmail } from '../auth/login';


function setEmailBodyContent(recieverEmail: string, recieverNickname: string, senderNickname: string) {
    const websiteUrl = Config.getInstance().getWebsiteUrl(); 
    let bodyContent: emailBodyContent;
    console.log("recieverEmail: ", recieverEmail, "recieverNickname: ", recieverNickname, "senderNickname: ", senderNickname,  "websiteUrl: ", websiteUrl)
    bodyContent = {
        email: recieverEmail,
        template: 'invitation',
        data: {
            "nickname": recieverNickname,
            "senderNickname": senderNickname,
            "websiteUrl": websiteUrl
        }
    }
    return bodyContent;
}

export async function inviteFriend (request: FastifyRequest, reply: FastifyReply) {
    const payload = await isTokenValid(request);
    if (!payload || !payload.userId){
        return reply.code(401).send();
    }
    
    const storage = request.server.storage;
    let senderNickname: string;
    try {
        const senderUser = storage.getUserById(payload.userId) as UserBaseInfo;
        senderNickname = senderUser.nickname;
    } catch(err: any) {
        if (err.message === 'User not found') {
            return reply.code(404).send();
        } else {
            return reply.code(500).send();
        }
    }

    const body = request.body as {nickname: string}
    const recieverNickname = body.nickname;

    let recieverId;
    let recieverEmail;
    try {
        const user = storage.getUserByNickname(recieverNickname) as UserBaseInfo;
        recieverId = user.id
        recieverEmail = storage.getEmailById(recieverId);
    } catch (err: any) {
        return reply.code(404).send({message: "Failed to get reciever data"});
    }

    try {
        storage.createInvitationTransaction(payload.userId, recieverId);
    } catch (error: any) {
        console.log(error)
        if (error.message === 'User not found') {
            return reply.code(404).send();
        } else if (error.message === 'Invitation already exists' || error.message === 'Already friends') {
            return reply.code(409).send();
        } else {
            return reply.code(500).send();
        }
    }
    
    const bodyContent = setEmailBodyContent(recieverEmail, recieverNickname, senderNickname) as emailBodyContent;
    const sendStatus = await sendToEmail(bodyContent);
    if (sendStatus !== 202) {
        // rollback invitation record
        try {
            storage.deleteInvitationRecordTransaction()
            return reply.code(500).send({message: "Failed to send email"});
        } catch (err:any) {
            return reply.code(500).send({message: "Failed to delete invitation record"});
        }
    }
    return reply.code(201).send();
}