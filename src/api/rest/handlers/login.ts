import { FastifyRequest, FastifyReply } from 'fastify'
import { UserLoginForm } from '../../../models/UserLoginForm';
import JwtGenerator from 'pkg/JwtGenerator';
  
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) 
{
  //try 
  const form = await UserLoginForm.create(request.body) as UserLoginForm;

  // const { nickname, password } = request.body as { nickname: string, password: string };
  // const form = new UserLoginForm(nickname, password, request.server.storage);

  const isValid = await form.authenticate();
  if (!isValid) {
      return reply.code(401).send({ error: 'Invalid data' });
  }
  const user = request.server.storage.getUserByNickname(form.nickname);
  const userId = user.id;
  
  const instance = JwtGenerator.getInstance();
  const tokenPair = instance.generateTokenPair({ userId });
  // send jwt pair
  return reply.code(200).send({
    accessToken: tokenPair.accessToken,
    refreshToken: tokenPair.refreshToken
  })
  // return reply.send({ message: 'Login successful', user: { id: user.id, nickname: user.nickname } })

}
