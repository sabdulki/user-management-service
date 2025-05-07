import { FastifyRequest, FastifyReply } from 'fastify'
import JwtGenerator from '../../../pkg/JwtGenerator';

export function verifyToken(request: FastifyRequest, reply: FastifyReply)
{
	const token = request.headers.authorization?.replace('Bearer ', '');
	if (!token) {
	  return reply.code(400).send({ error: 'No token provided' });
	}
  
	try {
	  const instance = JwtGenerator.getInstance();
	  const decoded = instance.verifyToken(token);
	  return reply.send({ valid: true, decoded });
	} catch (error: any) {
	  return reply.code(401).send({
		valid: false,
		error: error.name,
		message: error.message
	  });
	}
  };
  