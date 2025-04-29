import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'

interface LoginBody {
	nickname: string
	password: string
}
  
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) 
{
  //TODO: create user login form
  const { nickname, password } = request.body as LoginBody

  if (!nickname || !password) {
	  return reply.code(400).send({ error: 'Missing nickname or password' })
  }
  // const db = request.server.sqlite
  // // class User instead
  // const user = db.prepare('SELECT * FROM users WHERE nickname = ?').get(nickname)
  // if (!user) {
	//   return reply.status(404).send({ message: 'User not found' })
  // }
  // const isValid = await bcrypt.compare(password, user.password) // user.password — хэш в БД
  // if (!isValid) {
	//   return reply.status(401).send({ message: 'Invalid password' })
  // }
  // return reply.send({ message: 'Login successful', user: { id: user.id, nickname: user.nickname } })

}
