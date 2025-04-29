import { FastifyRequest, FastifyReply } from 'fastify'
import bcrypt from 'bcryptjs'
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { ValidationError } from 'class-validator';
import { UserCreateForm } from '../../../models/UserCreateForm';

interface RegisterBody {
  nickname: string
  email: string
  password: string
}
// <{ Body: RegisterBody }>

export async function registrationHandler(request: FastifyRequest, reply: FastifyReply) 
{
  const form = await UserCreateForm.create(request.body) as UserCreateForm;

  const storage = request.server.storage;
  try {
    const userId = storage.insertUserData(form.nickname, form.email, form.hashedPassword);
    storage.insertBasicRatingForUser(userId);

    // the server generates a JWT containing the user's information (in a claim) and signs it with a secret key.
    //The server sends the JWT back to the user.
    return reply.code(201).send({ message: 'User registered successfully' })
  } catch (err: any) {
    return reply.code(400).send({ error: 'User already exists or invalid data', detail: err.message })
  }
}
