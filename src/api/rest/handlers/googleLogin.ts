import { FastifyRequest, FastifyReply } from 'fastify'
import app from 'fastify'
import UserCreateForm from '../../../models/UserCreateForm';
import { AuthProvider } from 'storage/DatabaseStorage';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';

type GoogleUser = {
    id: string
    email: string
    name: string
    picture: string
  }
  

// User logs into Google and gives permission.
export async function googleLoginCallbackHandler(request: FastifyRequest, reply: FastifyReply) 
{
    const token = await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
        Authorization: `Bearer ${token.access_token}`
        }
    })

    const googleUser = await userInfoRes.json() as GoogleUser;

    // Extract email or id
    const email = googleUser.email;

    // Check if user exists in DB
    const storage = request.server.storage;
    const user = storage.getUserByEmail(email);
    let userId = undefined;
    if (!user) {
        let form : UserCreateForm;
        try {
            form = await UserCreateForm.create({
                email: googleUser.email,
                nickname: googleUser.name,
                password: '', // или undefined
                provider: AuthProvider.GOOGLE
              });
        } catch (error: any) {
            return reply.code(400).send({ message: 'Invalid input data'});
        }

        const storage = request.server.storage;
        userId = storage.userRegisterTransaction(form);
    }

    // Generate JWT
    userId = user.id;
    const tokenPair = await generateJwtTokenPair( {userId} );
    if (!tokenPair) {
      return reply.code(500).send();
    }

    // Option 1: return JWT as JSON
    // return reply.send({ token: jwt })

    // Option 2: redirect to frontend with token as query param
    return reply.code(201).send({
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken
      })
    // return reply.redirect(`http://localhost:5173/auth/callback?token=${jwt}`)
}