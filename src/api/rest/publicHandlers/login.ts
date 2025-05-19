import { FastifyRequest, FastifyReply } from 'fastify'
import { UserLoginForm } from '../../../models/UserLoginForm';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
  
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserLoginForm;
  let isValid: boolean;
  try {
    form = await UserLoginForm.create(request.body) as UserLoginForm;
  } catch (error: any) {
    return reply.code(400).send({ message: 'Invalid input data'});
  }

  const user = request.server.storage.getUserByNickname(form.nickname);
    const userId = user.id;
  if (!request.server.storage.isUserAvailable(userId))
    return reply.code(404).send();

  isValid = await form.authenticate();
  if (!isValid) {
    return reply.code(401).send({ error: 'Authentication failed' });
  }
  // generate uuid and otp and send otp to ess, whait for response. 
  try {
    const user = request.server.storage.getUserByNickname(form.nickname);
    const userId = user.id;
    
    const tokenPair = await generateJwtTokenPair({ userId });
    if (!tokenPair) {
      return reply.code(500).send();
    }
    return reply.code(200).send({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken
    })
  } catch (err: any) {
    if (err.message === 'Failed to get user') {
      return reply.code(409).send({ error: 'User already exists' }); // 409 Conflict
    }
    if (err.message === 'DatabaseFailure') {
      return reply.code(500).send({ error: 'Database error' });
    }
    return reply.code(400).send({ error: 'Invalid data', detail: err.message });
  }
}
