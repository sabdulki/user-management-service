import { FastifyRequest, FastifyReply } from 'fastify'


export async function deleteInvitation(request: FastifyRequest, reply: FastifyReply) 
{
    try {
        const {recordId} = request.params as {recordId : number}; //распаковка
        request.server.storage.deleteInvitationRecordTransaction(recordId);
        return reply.code(200).send();
    } catch (error: any) {
        if (error.message === 'Failed to delete invitationRecord') {
            return reply.code(500).send({ error: 'Database error' });
        }
        return (reply.code(400).send(error));
    }

}