import { FastifyRequest, FastifyReply } from 'fastify'
import { UserLoginForm } from '../../../../models/UserLoginForm';
import { randomInt, randomUUID } from 'crypto';
import UserBaseInfo from 'types/UserBaseInfo';
import { OtpManager } from './verifyOtp';
import UserCreateForm from '../../../../models/UserCreateForm';
import Config from '../../../../config/Config';

function generateOtp() : string {
  return randomInt(100000, 999999).toString(); // 6-значный код
}

function generateUuid() : string {
  return randomUUID();
}

export function getEssUrl(): string {
  const emailSenderServiceHost = Config.getInstance().getEssHost();
  const emailSenderServicePort = Config.getInstance().getEssPort();
  const emailSenderServiceAddress = `${emailSenderServiceHost}:${emailSenderServicePort}`;
  const url = 'http://' + emailSenderServiceAddress + '/ess/api/rest/email/send';
  return url;
}

export interface emailBodyContent {
  email: string,
  template: string,
  data: {}
}

export async function sendToEmail(bodyContent: emailBodyContent) : Promise<number> {

  const url = getEssUrl();

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(bodyContent)
  });

  const data = await response.json() as { error?: string; status?: number; };
  if (response.status !== 202) {
    console.log("error data: ", data);
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

  const bodyContent = {
    email: userEmail,
    template: 'otp',
    data: {"code": otp}
  }
  const sendStatus = await sendToEmail(bodyContent);
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
  if (!user) {
    return reply.code(404).send({message: "User not found"});
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





