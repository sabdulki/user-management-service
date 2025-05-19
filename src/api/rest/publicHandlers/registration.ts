import { FastifyRequest, FastifyReply } from 'fastify'
import UserCreateForm from '../../../models/UserCreateForm';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';

export async function registrationHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserCreateForm;
  try {
    form = await UserCreateForm.create(request.body);
  } catch (error: any) {
    return reply.code(400).send({ message: 'Invalid input data'});
  }
  // temporarily save these f=valus into cash in redis, 
  // only ofter confirming otp sabe to db
  const storage = request.server.storage;

  try {
    const userId = storage.userRegisterTransaction(form);
    const tokenPair = await generateJwtTokenPair({userId});
    if (!tokenPair) {
      return reply.code(500).send();
    }
    //testing
    // console.log('Access Token:', tokenPair.accessToken);
    // console.log('Refresh Token:', tokenPair.refreshToken);
    // const decoded = await instance.verifyToken(tokenPair.accessToken, TokenType.Access);
    // console.log('Decoded payload:', decoded);
    return reply.code(201).send({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken
    })
  } catch (err: any) {
  if (err.message === 'UserAlreadyExists') {
    return reply.code(409).send({ error: 'User already exists' }); // 409 Conflict
  }
  if (err.message === 'DatabaseFailure') {
    return reply.code(500).send({ error: 'Database error' });
  }
  // Fallback error
  return reply.code(400).send({ error: 'Invalid data', detail: err.message });
  }
}
