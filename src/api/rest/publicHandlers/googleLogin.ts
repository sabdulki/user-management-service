
// http://localhost:5000/auth/api/rest/google/login

import { FastifyRequest, FastifyReply } from 'fastify'
import app from 'fastify'
import UserCreateForm from '../../../models/UserCreateForm';
import { AuthProvider } from '../../../storage/DatabaseStorage';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import Config from '../../../config/Config';

// const redirectUrl = await request.server.googleOAuth2.generateAuthorizationUri(request, reply);
// // console.log("Redirecting to:", redirectUrl);
// return reply.redirect(redirectUrl);

type GoogleUser = {
    id: string
    email: string
    given_name: string
    picture: string
}

interface GoogleTokenResponse {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
    scope: string;
    token_type: string;
    id_token?: string;
}

export async function googleLoginExchange(request: FastifyRequest, reply: FastifyReply) {

    const body = request.body as { code: string, codeVerifier: string, redirectUri: string}
    const code = body.code;
    const codeVerifier = body.codeVerifier;
    const redirectUri = body.redirectUri;
    if (!code || !codeVerifier || !redirectUri)
        return reply.code(400).send(); // bad request
    const configInstance = Config.getInstance();

    console.log("code: ", code)
    console.log("codeVerifier: ", codeVerifier)
    console.log("redirectUri: ", redirectUri)
    console.log("getGoogleClientId: ", configInstance.getGoogleClientId())
    console.log("getGoogleClientSecret: ", configInstance.getGoogleClientSecret())
    let userInfoRes;

    try {
        // Exchange code + verifier for access token
        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: configInstance.getGoogleClientId(),
            client_secret: configInstance.getGoogleClientSecret(),
            code,
            code_verifier: codeVerifier,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri
          }).toString()
        });

        const token = await tokenRes.json() as GoogleTokenResponse;
        console.log(token);

        if (!token || !token.access_token) {
          console.error('Token exchange failed:', token);
          return reply.status(400).send({ error: 'Token exchange failed' });
        }
        
        userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${token.access_token}`
            }
        })
    } catch (err:any) {
        console.log(err);
        return reply.code(500).send(); // or another code
    }

    const googleUser = await userInfoRes.json() as GoogleUser;
    const email = googleUser.email;
    console.log("email: ", googleUser.email, " nickname: ", googleUser.given_name);

    // Check if user exists in DB
    const storage = request.server.storage;
    const user = storage.getUserByEmail(email);
    let userId = undefined;
    if (!user) {
        let form : UserCreateForm;
        try {
            form = await UserCreateForm.create({
                email: googleUser.email,
                nickname: googleUser.email.split('@')[0],
                password: '', // или undefined
                provider: AuthProvider.GOOGLE
              });
        } catch (error: any) {
          return reply.code(400).send({ message: 'Invalid input data in google login'});
        }

        const storage = request.server.storage;
        try {
            userId = storage.userRegisterTransaction(form);
            storage.addUserAvatar(userId, googleUser.picture);
        } catch (err: any) {
            console.log(err);
            return reply.code(500).send({message: "internal server error"});
        }
    }

    // Generate JWT
    if (user)
      userId = user.id;
    const tokenPair = await generateJwtTokenPair( {userId} );
    if (!tokenPair) {
        console.log("token paits failed");
      return reply.code(500).send();
    }

    // return 200 if just logged in (did not create new data)
    return reply.code(201).send({
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken
      });

}