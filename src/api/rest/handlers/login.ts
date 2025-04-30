import { FastifyRequest, FastifyReply } from 'fastify'
import { UserLoginForm } from '../../../models/UserLoginForm';
  
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) 
{
  const form = await UserLoginForm.create(request.body) as UserLoginForm;

  // const { nickname, password } = request.body as { nickname: string, password: string };
  // const form = new UserLoginForm(nickname, password, request.server.storage);

  const isValid = await form.authenticate();
  if (!isValid) {
      return reply.code(401).send({ error: 'Invalid data' });
  }

  // Optionally: generate JWT or session here
  return reply.send({ message: 'Login successful' });
  // return reply.send({ message: 'Login successful', user: { id: user.id, nickname: user.nickname } })

}
