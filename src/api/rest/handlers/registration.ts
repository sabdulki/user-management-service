import { FastifyRequest, FastifyReply } from 'fastify'
import UserCreateForm from '../../../models/UserCreateForm';
import JwtGenerator from '../../../pkg/JwtGenerator';

export async function registrationHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserCreateForm;
  try {
    form = await UserCreateForm.create(request.body);
  } catch (error: any) {
    return reply.code(400).send({ message: 'Invalid input data'});
  }

  const storage = request.server.storage;

  try {
    let userId: number;
    userId = storage.userRegisterTransaction(form);
    const instance = JwtGenerator.getInstance();
    const tokenPair = await instance.generateTokenPair({ userId });

    //testing
    console.log('Access Token:', tokenPair.accessToken);
    console.log('Refresh Token:', tokenPair.refreshToken);
    const decoded = await instance.verifyToken(tokenPair.accessToken, "access");
    console.log('Decoded payload:', decoded);
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
