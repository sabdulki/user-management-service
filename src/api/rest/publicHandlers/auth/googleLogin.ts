import { FastifyRequest, FastifyReply } from 'fastify'
import app from '../../../../app';
import UserCreateForm from '../../../../models/UserCreateForm';
import { AuthProvider } from '../../../../storage/DatabaseStorage';
import {generateJwtTokenPair} from '../../../../pkg/jwt/JwtGenerator';
import Config from '../../../../config/Config';
import { deleteLeaderboardCach } from './registration';
import { randomInt } from 'crypto';

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

interface automateRegistartionResponse {
  userId: number | undefined;
  code: number;
}

function generateRandomNumber(): string {
   return randomInt(0, 10).toString();
}


function automateUserRegistartion(form:UserCreateForm, googleUser: GoogleUser): automateRegistartionResponse {
  let userId: number | undefined;
  const MAX_ATTEMPTS = 3;
  let attempt = 0;
  let success = false;
  let code = 201;
  const storage = app.storage;

  while (attempt < MAX_ATTEMPTS && !success) {
    try {
      userId = storage.userRegisterTransaction(form);
      storage.addUserAvatar(userId, googleUser.picture);
      success = true;
    } catch (err: any) {
      if (err.message === "UserAlreadyExists") {
        form.nickname += generateRandomNumber();
        attempt++;
      } else {
        code = 500;
        return {userId, code};
      }
    }
  }

  if (!success) {
    code = 409;
  }
  return {userId, code};
}

export async function googleLoginExchange(request: FastifyRequest, reply: FastifyReply) {

    const body = request.body as { code: string, codeVerifier: string, redirectUri: string}
    const code = body.code;
    const codeVerifier = body.codeVerifier;
    const redirectUri = body.redirectUri;
    if (!code || !codeVerifier || !redirectUri)
        return reply.code(400).send({ error: 'bad request' });
    const configInstance = Config.getInstance();

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

        if (!token || !token.access_token) {
          return reply.status(400).send({ error: 'Token exchange failed' });
        }
        
        userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
                Authorization: `Bearer ${token.access_token}`
            }
        })
    } catch (err: any) {
        return reply.code(500).send(); // or another code
    }
    
  const googleUser = await userInfoRes.json() as GoogleUser;
  const email = googleUser.email;
  
  // Check if user exists in DB
  const storage = request.server.storage;

  let user = undefined;
  try {
    user = storage.getUserByEmail(email);
  } catch (err:any) {
    return reply.code(500).send();
  }

  const isAvalaibe = storage.isUserAvailable(user.id);
  if (!isAvalaibe) // this email alredy exist in db, but user has removed_at != null
    return reply.code(409).send();

  let userId = undefined;
  if (!user) { // register new user
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
  }

    // Generate JWT
    if (user)
      userId = user.id;
    const tokenPair = await generateJwtTokenPair( {userId} );
    if (!tokenPair) {
      return reply.code(500).send();
    }

    // return 200 if just logged in (did not create new data)
    return reply.code(201).send({
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken
      });

}