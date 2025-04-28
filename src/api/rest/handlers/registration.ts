import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'

interface RegisterBody {
  name: string
  email: string
  password: string
}
// <{ Body: RegisterBody }>

export async function registrationHandler(request: FastifyRequest, reply: FastifyReply) 
{
  const { name, email, password } = request.body as RegisterBody

  if (!name || !email || !password) {
    return reply.code(400).send({ error: 'Missing name, email or password' })
  }

  const hashedPassword = bcrypt.hashSync(password, 10)
  const db = request.server.sqlite

  try {
    const stmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)')
    const result = stmt.run(name, email, hashedPassword)
    const user_id = result.lastInsertRowid
    const ratingInsert = db.prepare('INSERT INTO ratings (user_id) VALUES (?)')
    ratingInsert.run(user_id)
    // the server generates a JWT containing the user's information (in a claim) and signs it with a secret key.
    //The server sends the JWT back to the user.
    return reply.code(201).send({ message: 'User registered successfully' })
  } catch (err: any) {
    return reply.code(400).send({ error: 'User already exists or invalid data', detail: err.message })
  }
}
