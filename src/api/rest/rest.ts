import { FastifyInstance } from 'fastify'
import { IHandler } from '../../pkg/handler/handler'
import { pingHandler } from './publicHandlers/ping'
import { registrationHandler } from './publicHandlers/registration'
import { loginHandler } from './publicHandlers/login'
import { getUserInfo } from './publicHandlers/getUser'
import { getUserInfoById } from './privateHandlers/getUserById'
import { refreshTokensPair } from './publicHandlers/refreshToken'
import { removeUser } from './publicHandlers/deleteUser'
import { isTokenExpired } from './publicHandlers/isTokenExpired'
import { uploadAvatar } from './publicHandlers/uploadAvatar'
import { googleLoginCallbackHandler } from './publicHandlers/googleLogin'
import { updateRating } from './privateHandlers/updateRating'

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
  },
  // internal
  {
    method: 'GET',
    route: '/auth/internal/user/:id',
    handler: getUserInfoById
  },
  {
    method: 'POST',
    route: '/auth/internal/rating/update',
    handler: updateRating
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
