import { FastifyRequest, FastifyReply } from 'fastify'
import UserCreateForm from '../../../models/UserCreateForm';


export async function registrationHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserCreateForm;
  try {
    form = await UserCreateForm.create(request.body);
  } catch (error) {
    return reply.code(400).send('Invalid input data');
  }

  const storage = request.server.storage;

  try {
    storage.userRegisterTransaction(form);
    return reply.code(201).send({ message: 'User registered successfully' })
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
