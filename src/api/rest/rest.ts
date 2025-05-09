import { FastifyInstance } from 'fastify'
import { IHandler } from '../../pkg/handler/handler'
import { pingHandler } from './handlers/ping'
import { registrationHandler } from './handlers/registration'
import { loginHandler } from './handlers/login'
import { getUserInfo } from './handlers/getUser'
import { getUserInfoById } from './handlers/getUserById'
import { refreshTokensPair } from './handlers/refreshToken'
import { deleteUserById } from './handlers/deleteUserById'
// import { verifyToken } from './handlers/isTokenValid'
import { isTokenValid } from 'pkg/JwtGenerator'

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
  {
    method: 'GET',
    route: '/user',
    handler: getUserInfo
  },
  {
    method: 'GET',
    route: '/user/:userId',
    handler: getUserInfoById
  },
  // {
  //   method: 'GET',
  //   route: '/verify-token',
  //   handler: isTokenValid
  // },
  {
    method: 'POST',
    route: '/refresh',
    handler: refreshTokensPair
  },
  {
    method: 'DELETE',
    route: '/user/delete/:userId',
    handler: deleteUserById
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
