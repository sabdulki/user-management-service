import { FastifyRequest, FastifyReply } from 'fastify'
import UserCreateForm from '../../../../models/UserCreateForm';
import {generateJwtTokenPair} from '../../../../pkg/jwt/JwtGenerator';
import {otpLogic} from './login';
import { CACHE_KEY } from '../get/getRatingLeaders';
import app from '../../../../app';


export async function deleteLeaderboardCach(): Promise<boolean> {
	const radishClient = app.cache;
	const response = await radishClient.delete(CACHE_KEY);
	if (response.status != 200)
		return false;
	console.log("deleted! CACHE_KEY");
	return true;
}

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
	// delete radish top5_rating_leader
	status = 201;
	const deleteStatus = deleteLeaderboardCach();
	if (!deleteStatus)
		status = 500;
	return {userId, status};
}

function isFormDataValid(form: UserCreateForm): boolean {

	const nickname = app.storage.getUserByNickname(form.nickname);
	if (nickname != undefined)
		return false;
	const email = app.storage.getUserByEmail(form.email);
	if (email != undefined)
		return false;
	return true;
}

export async function registrationHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserCreateForm;
  try {
    form = await UserCreateForm.create(request.body);
  } catch (error: any) {
    return reply.code(400).send({ message: 'Invalid input data'});
  }
  // check if user with the same nickname or email exists 
  const isValid = isFormDataValid(form);
  if (!isValid)
	return reply.code(409).send();
  const uuid = await otpLogic({ form }, form.email);
  if (!uuid) // generation/saving in redis/sending to email failed
    return reply.code(400).send();
  return reply.code(200).send({"key": uuid});
}
