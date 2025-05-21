import { FastifyRequest, FastifyReply } from 'fastify'
import { UserLoginForm } from '../../../models/UserLoginForm';
import {generateJwtTokenPair} from '../../../pkg/jwt/JwtGenerator';
import { randomInt, randomUUID } from 'crypto';
import Config from 'config/Config';
import RadishClient from 'pkg/client/client';

// function generateOtp() : string {
//   return randomInt(100000, 999999).toString(); // 6-значный код
// }

// function generateUuid() : string {
//   return randomUUID();
// }

// async function sendOtpToEmail(otp: string) : Promise<number> { // change name of function to more meaningful

// }

// async function saveUuidInRadish(uuid: string, otp: string, expireTime: number) : Promise<number> {
//   const instance = Config.getInstance();
//   const host = instance.getRadishHost();
//   const port = instance.getRadishPort();

//   const radishClient = new RadishClient({ host, port}); // создавать новый инстанс Радиша????
//   const response = await radishClient.set(`uuid-${uuid}`, `${otp}`, expireTime);
//   if (response.status !== 200)
//     return 500;
//   return 200;
// }

// async function otpLogic() :  Promise<string | undefined> { // change name of function to more meaningful
//   const otp = generateOtp();
//   const uuid = generateUuid();
//   if (!otp || !uuid)
//     return undefined;
//   const sendStatus = await sendOtpToEmail(otp);
//   if (sendStatus !== 200) // sending to email failed
//     return undefined;
//   const expireTime = 120; // 2 minutes
//   const saveStatus = await saveUuidInRadish(uuid, otp, expireTime);
//   if (saveStatus !== 200) // saving in redis failed
//     return undefined;
//   return uuid;
// }

export async function loginHandler(request: FastifyRequest, reply: FastifyReply) 
{
  let form: UserLoginForm;
  let isValid: boolean;
  try {
    form = await UserLoginForm.create(request.body) as UserLoginForm;
  } catch (error: any) {
    return reply.code(400).send({ message: 'Invalid input data'});
  }

  const user = request.server.storage.getUserByNickname(form.nickname);
    const userId = user.id;
  if (!request.server.storage.isUserAvailable(userId))
    return reply.code(404).send();

  isValid = await form.authenticate();
  if (!isValid) {
    return reply.code(401).send({ error: 'Authentication failed' });
  }
  // generate uuid and otp and send otp to ess, whait for response. 
  // const uuid = otpLogic();
  // if (!uuid) // generation/saving in redis/sending to email failed
  //   return reply.code(400).send();
  // return reply.code(200).send({ uuid : `${uuid}`})
  
  try {
    const user = request.server.storage.getUserByNickname(form.nickname);
    const userId = user.id;
    
    const tokenPair = await generateJwtTokenPair({ userId });
    if (!tokenPair) {
      return reply.code(500).send();
    }
    return reply.code(200).send({
      accessToken: tokenPair.accessToken,
      refreshToken: tokenPair.refreshToken
    })
  } catch (err: any) {
    if (err.message === 'Failed to get user') {
      return reply.code(409).send({ error: 'User already exists' }); // 409 Conflict
    }
    if (err.message === 'DatabaseFailure') {
      return reply.code(500).send({ error: 'Database error' });
    }
    return reply.code(400).send({ error: 'Invalid data', detail: err.message });
  }
}





