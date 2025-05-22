import { FastifyRequest, FastifyReply } from 'fastify'
import UserCreateForm from '../../../models/UserCreateForm';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import {otpLogic} from './login';

export async function registrationHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserCreateForm;
  try {
    form = await UserCreateForm.create(request.body);
  } catch (error: any) {
    return reply.code(400).send({ message: 'Invalid input data'});
  }
  // temporarily save these f=valus into cash in redis, 
  // only ofter confirming otp sabe to db
  const storage = request.server.storage;
  let userId: number;
  try {
    userId = storage.userRegisterTransaction(form);
  } catch (err: any) {
      if (err.message === 'UserAlreadyExists') {
        return reply.code(409).send({ error: 'User already exists' }); // 409 Conflict
      }
      if (err.message === 'DatabaseFailure') {
        return reply.code(500).send({ error: 'Database error' });
      }
      else {
        return reply.code(400).send({ error: 'Invalid data', detail: err.message });
      }
  }

  const userEmail = storage.getEmailById(userId);
  const uuid = await otpLogic(userId, userEmail);
  console.log("after otpLogic");
  if (!uuid) // generation/saving in redis/sending to email failed
    return reply.code(400).send();
  return reply.code(200).send({"key": uuid});

  // const tokenPair = await generateJwtTokenPair({userId});
  // if (!tokenPair) {
  //   return reply.code(500).send();
  // }

  // return reply.code(201).send({
  //     accessToken: tokenPair.accessToken,
  //     refreshToken: tokenPair.refreshToken
  // })
    //testing
    // console.log('Access Token:', tokenPair.accessToken);
    // console.log('Refresh Token:', tokenPair.refreshToken);
    // const decoded = await instance.verifyToken(tokenPair.accessToken, TokenType.Access);
    // console.log('Decoded payload:', decoded);
  //   return reply.code(201).send({
  //     accessToken: tokenPair.accessToken,
  //     refreshToken: tokenPair.refreshToken
  //   })
  // } catch (err: any) {
  // if (err.message === 'UserAlreadyExists') {
  //   return reply.code(409).send({ error: 'User already exists' }); // 409 Conflict
  // }
  // if (err.message === 'DatabaseFailure') {
  //   return reply.code(500).send({ error: 'Database error' });
  // }
  // // Fallback error
  // return reply.code(400).send({ error: 'Invalid data', detail: err.message });
  // }
}
