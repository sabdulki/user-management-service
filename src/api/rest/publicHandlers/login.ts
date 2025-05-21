import { FastifyRequest, FastifyReply } from 'fastify'
import { UserLoginForm } from '../../../models/UserLoginForm';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import { randomInt, randomUUID } from 'crypto';
import Config from '../../../config/Config';
import RadishClient from '../../../pkg/client/client';
import UserBaseInfo from 'types/UserBaseInfo';
import { OtpManager } from './verifyOtp';

function generateOtp() : string {
  return randomInt(100000, 999999).toString(); // 6-значный код
}

function generateUuid() : string {
  return randomUUID();
}

async function sendOtpToEmail(otp: string, userEmail: string) : Promise<number> { // change name of function to more meaningful
  
  const bodyContent = {
    email: userEmail,
    template: 'otp', // if your backend expects this
    data: {"code": otp}
  }
  console.log ("bodyContent: ", bodyContent);
  const response = await fetch('http://localhost:5200/ess/api/rest/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyContent)
  });

  const data = await response.json() as { error?: string; status?: number; };
  // console.log("data: ", data);
  if (response.status !== 202) {
    return 400;
  }
  return response.status;

  //  if (!data.status)
  //   return 400; //error
  // return data.status;
}

async function otpLogic(userEmail: string) :  Promise<string | undefined> { // change name of function to more meaningful
  const OtpManagerInstance = OtpManager.getInstance();
  const otp = generateOtp();
  const uuid = generateUuid();
  if (!otp || !uuid)
    return undefined;
  const sendStatus = await sendOtpToEmail(otp, userEmail);
  console.log("sendStatus: ", sendStatus);

  if (sendStatus !== 202) // sending to email failed
    return undefined;
  console.log("after sendOtpToEmail");
  const expireTime = 120; // 2 minutes
  const saveStatus = await OtpManagerInstance.saveUuidInRadish(uuid, otp, expireTime);
  if (saveStatus !== 200) {// saving in redis failed
    console.log("saveUuidInRadish failed");
    return undefined;
  }
  return uuid;
}

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserLoginForm;
  let isValid: boolean;
  try {
    form = await UserLoginForm.create(request.body) as UserLoginForm;
  } catch (error: any) {
    return reply.code(400).send({ message: 'Invalid input data'});
  }
  console.log("form: ", form);
  let user;
  try {
    user = request.server.storage.getUserByNickname(form.nickname) as UserBaseInfo;
  } catch (err: any) {
    return reply.code(401).send({message: `${err}, getUserByNickname `});
  }
  // if (!request.server.storage.isUserAvailable(userId))
  //   return reply.code(404).send();
  const userId = user.id;

  isValid = await form.authenticate();
  if (!isValid) {
    return reply.code(401).send({ error: 'Authentication failed' });
  }
  // generate uuid and otp and send otp to ess, whait for response. 
  const userEmail = request.server.storage.getEmailById(userId);
  const uuid = await otpLogic(userEmail);
  console.log("after otpLogic");
  if (!uuid) // generation/saving in redis/sending to email failed
    return reply.code(400).send();
  return reply.code(200).send({"key": uuid});
  
  // try {
  //   const user = request.server.storage.getUserByNickname(form.nickname);
  //   const userId = user.id;
    
  //   const tokenPair = await generateJwtTokenPair({ userId });
  //   if (!tokenPair) {
  //     return reply.code(500).send();
  //   }
  //   return reply.code(200).send({
  //     accessToken: tokenPair.accessToken,
  //     refreshToken: tokenPair.refreshToken
  //   })
  // } catch (err: any) {
  //   if (err.message === 'Failed to get user') {
  //     return reply.code(409).send({ error: 'User already exists' }); // 409 Conflict
  //   }
  //   if (err.message === 'DatabaseFailure') {
  //     return reply.code(500).send({ error: 'Database error' });
  //   }
  //   return reply.code(400).send({ error: 'Invalid data', detail: err.message });
  // }
}





