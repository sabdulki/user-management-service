import { FastifyRequest, FastifyReply } from 'fastify'
import {isTokenValid}  from '../../../pkg/jwt/JwtGenerator';

export async function isTokenExpired(request: FastifyRequest, reply: FastifyReply)
{
	try {
	  const decoded = await isTokenValid(request);
	  if (!decoded)
	  	return reply.send({ valid: true, decoded });
	} catch (error: any) {
	  return reply.code(401).send({
		valid: false,
		error: error.name,
		message: error.message
	  });
	}
  };
  