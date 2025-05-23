import { FastifyRequest, FastifyReply } from 'fastify'
import { UserLoginForm } from '../../../models/UserLoginForm';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import { randomInt, randomUUID } from 'crypto';
import Config from '../../../config/Config';
import RadishClient from '../../../pkg/client/client';
import UserBaseInfo from 'types/UserBaseInfo';
import { OtpManager } from './verifyOtp';
import UserCreateForm from '../../../models/UserCreateForm';

function generateOtp() : string {
  return randomInt(100000, 999999).toString(); // 6-значный код
}

function generateUuid() : string {
  return randomUUID();
}

async function sendOtpToEmail(otp: string, userEmail: string) : Promise<number> {
  
  const bodyContent = {
    email: userEmail,
    template: 'otp',
    data: {"code": otp}
  }

  const response = await fetch('http://localhost:5200/ess/api/rest/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyContent)
  });

  const data = await response.json() as { error?: string; status?: number; };
  if (response.status !== 202) {
    return 400;
  }

  return response.status;
}

export async function otpLogic(identifier: { userId?: number; form?: UserCreateForm }, userEmail: string) :  Promise<string | undefined> { // change name of function to more meaningful
  const OtpManagerInstance = OtpManager.getInstance();

  const otp = generateOtp();
  const uuid = generateUuid();
  const expireTime = 300; // 5 minutes
  if (!otp || !uuid)
    return undefined;

  const sendStatus = await sendOtpToEmail(otp, userEmail);
  if (sendStatus !== 202)
    return undefined;

  let saveStatus;
  if (identifier.userId) {
    const userId = identifier.userId;
    saveStatus = await OtpManagerInstance.saveUuidInRadish({ userId: identifier.userId }, uuid, otp, expireTime);
  }
  else if (identifier.form) {
    let form: UserCreateForm;
    saveStatus = await OtpManagerInstance.saveUuidInRadish({ form: identifier.form }, uuid, otp, expireTime);
  }
  else {
    console.log('Must provide either id or form');
    return undefined;
  }
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
  let user;
  try {
    user = request.server.storage.getUserByNickname(form.nickname) as UserBaseInfo;
  } catch (err: any) {
    return reply.code(401).send({message: `${err}, getUserByNickname `});
  }

  const userId = user.id;
  isValid = await form.authenticate();
  if (!isValid) {
    return reply.code(401).send({ error: 'Authentication failed' });
  }
  const userEmail = request.server.storage.getEmailById(userId);
  const uuid = await otpLogic({userId}, userEmail);
  if (!uuid) // generation/saving in redis/sending to email failed
    return reply.code(400).send();
  return reply.code(200).send({"key": uuid});
}





