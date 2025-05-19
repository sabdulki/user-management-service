import { FastifyRequest, FastifyReply } from "fastify";

// http://localhost:5000/auth/api/rest/google/login

export async function googleLoginRedirector(request: FastifyRequest, reply: FastifyReply) {
    const redirectUrl = await request.server.googleOAuth2.generateAuthorizationUri(request, reply);
    // console.log("Redirecting to:", redirectUrl);
    return reply.redirect(redirectUrl);
}