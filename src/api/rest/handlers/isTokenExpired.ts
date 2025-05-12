import { FastifyRequest, FastifyReply } from 'fastify'
import JwtGenerator, {isTokenValid, TokenType}  from '../../../pkg/JwtGenerator';
import { access } from 'fs';

export async function isTokenExpired(request: FastifyRequest, reply: FastifyReply)
{
	try {
	  const decoded = await isTokenValid(request);
	  return reply.send({ valid: true, decoded });
	} catch (error: any) {
	  return reply.code(401).send({
		valid: false,
		error: error.name,
		message: error.message
	  });
	}
  };
  