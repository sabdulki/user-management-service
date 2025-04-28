import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'

interface LoginBody {
	name: string
	password: string
  }
  
export async function loginHandler(request: FastifyRequest, reply: FastifyReply) 
{
  const { name, password } = request.body as LoginBody

  if (!name || !password) {
	  return reply.code(400).send({ error: 'Missing name or password' })
  }
  const db = request.server.sqlite
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(name)
  if (!user) {
	  return reply.status(404).send({ message: 'User not found' })
  }
  const isValid = await bcrypt.compare(password, user.password) // user.password — хэш в БД
  if (!isValid) {
	  return reply.status(401).send({ message: 'Invalid password' })
  }
  return reply.send({ message: 'Login successful', user: { id: user.id, username: user.username } })

}
