import { FastifyInstance } from 'fastify'
import { IHandler } from '../../pkg/handler/handler'
import { pingHandler } from './handlers/ping'
import { registrationHandler } from './handlers/registration'
import { loginHandler } from './handlers/login'
import { getUserInfo } from './handlers/getUser'
import { getUserInfoById } from './handlers/getUserById'
import { refreshTokensPair } from './handlers/refreshToken'
import { removeUser } from './handlers/deleteUser'
import { isTokenExpired } from './handlers/isTokenExpired'
import { uploadAvatar } from './handlers/uploadAvatar'
import { googleLoginCallbackHandler } from './handlers/googleLogin'

const routes: IHandler[] = [
  {
    method: 'GET',
    route: '/ping',
    handler: pingHandler
  },
  {
    method: 'POST',
    route: '/auth/api/rest/registration',
    handler: registrationHandler
  },
  {
    method: 'POST',
    route: '/auth/api/rest/login',
    handler: loginHandler
  },
  // {
  //   method: 'POST',
  //   route: '/auth/api/rest/verify_otp',
  //   handler: verifyOtp
  // },
  // {
  //   method: 'GET',
  //   route: '/auth/api/rest/google/login',
  //   // handler: googleLoginHandler
  // },
  {
    method: 'GET',
    route: '/auth/api/rest/google/login/callback',
    handler: googleLoginCallbackHandler
  },
  {
    method: 'GET',
    route: '/auth/api/rest/user',
    handler: getUserInfo
  },
  {
    method: 'GET',
    route: '/auth/api/rest/user/:userId',
    handler: getUserInfoById
  },
  // {
  //   method: 'GET',
  //   route: '/auth/api/rest/isTokenExpired', has to be snake case!!!!
  //   handler: isTokenExpired
  // },
  {
    method: 'POST',
    route: '/auth/api/rest/refresh',
    handler: refreshTokensPair
  },
  {
    method: 'POST',
    route: '/auth/api/rest/user/avatar',
    handler: uploadAvatar
  },
  {
    method: 'DELETE',
    route: '/auth/api/rest/user',
    handler: removeUser
  }

]

export async function registerRestRoutes(app: FastifyInstance) {
  for (const route of routes) {
    app.route({
      method: route.method,
      url: route.route,
      handler: route.handler
    })
  }
}
