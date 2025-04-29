import { FastifyRequest, FastifyReply } from 'fastify'
import { UserLoginForm } from '../../../models/UserLoginForm';
import bcrypt from 'bcryptjs'

interface LoginBody {
	nickname: string
	password: string
}
  
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) 
{
  const { nickname, password } = request.body as { nickname: string, password: string };
  const form = new UserLoginForm(nickname, password, request.server.storage);

  const user = await form.authenticate();
  if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
  }

  // Optionally: generate JWT or session here
  return reply.send({ message: 'Login successful' });
  // return reply.send({ message: 'Login successful', user: { id: user.id, nickname: user.nickname } })

}
