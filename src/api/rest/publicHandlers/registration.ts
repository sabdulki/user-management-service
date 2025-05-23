import { FastifyRequest, FastifyReply } from 'fastify'
import UserCreateForm from '../../../models/UserCreateForm';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import {otpLogic} from './login';
import app from '../../../app';


export async function saveRegisteredUser(form: UserCreateForm): Promise<{userId: number | undefined, status: number}>{
	let userId = undefined;
	let status: number;
	const storage = app.storage;
	try {
	  userId = storage.userRegisterTransaction(form);
	} catch (err: any) {
	    if (err.message === 'UserAlreadyExists') {
			  console.log('User already exists');
			  status = 409;
			return {userId, status};
	    }
	    if (err.message === 'DatabaseFailure') {
			  console.log('DatabaseFailure');
			  status = 500;
			return {userId, status};
	    }
	    else {
			  console.log(`Invalid data: ${err}`);
			  status = 400;
			return {userId, status};
	    }
	}
	status = 201;
	return {userId, status};
}

export async function registrationHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserCreateForm;
  try {
    form = await UserCreateForm.create(request.body);
  } catch (error: any) {
    return reply.code(400).send({ message: 'Invalid input data'});
  }

  const uuid = await otpLogic({ form }, form.email);
  if (!uuid) // generation/saving in redis/sending to email failed
    return reply.code(400).send();
  return reply.code(200).send({"key": uuid});
}
