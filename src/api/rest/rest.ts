import { FastifyInstance } from 'fastify'
import { IHandler } from '../../pkg/handler/handler'
import { pingHandler } from './publicHandlers/ping'
import { registrationHandler } from './publicHandlers/registration'
import { loginHandler } from './publicHandlers/login'
import { getUserInfo } from './publicHandlers/getUser'
import { getUserInfoById } from './privateHandlers/getUserById'
import { refreshTokensPair } from './publicHandlers/refreshToken'
import { setUserRemoved } from './publicHandlers/setUserRemoved'
import { isTokenExpired } from './publicHandlers/isTokenExpired'
import { uploadAvatar } from './publicHandlers/uploadAvatar'
import { updateRating } from './privateHandlers/updateRating'
import { googleLoginExchange } from './publicHandlers/googleLogin'
import { updateUserNickname } from './publicHandlers/updateNickname'
import { updateUserPassword } from './publicHandlers/updatePassword'
import { verifyOtp } from './publicHandlers/verifyOtp'
import { deleteUser } from './publicHandlers/deleteUser'
import { getRatingLeaders } from './publicHandlers/getRatingLeaders'
import { inviteFriend } from './publicHandlers/inviteFriend'
import { acceptInvitation } from './publicHandlers/acceptInvitation'
import { rejectInvitation } from './publicHandlers/rejectInvitation'
import { getFriends } from './publicHandlers/getFriends'
import { deleteFriend } from './publicHandlers/deleteFriend'

const routes: IHandler[] = [
  //        PUBLIC
  // GET
  {
    method: 'GET', route: '/ping', handler: pingHandler
  },
  {
    method: 'GET', route: '/auth/api/rest/user', handler: getUserInfo
  },
  {
    method: 'GET', route: '/auth/api/rest/rating/leader', handler: getRatingLeaders
  },
  {
    method: 'GET', route: '/auth/api/rest/friends', handler: getFriends
  },
  // POST
  {
    method: 'POST', route: '/auth/api/rest/google/login', handler: googleLoginExchange
  },
  {
    method: 'POST', route: '/auth/api/rest/registration', handler: registrationHandler
  },
  {
    method: 'POST', route: '/auth/api/rest/login', handler: loginHandler
  },
  {
    method: 'POST', route: '/auth/api/rest/refresh', handler: refreshTokensPair
  },
  {
    method: 'POST', route: '/auth/api/rest/user/avatar', handler: uploadAvatar
  },
  {
    method: 'POST', route: '/auth/api/rest/verify_otp', handler: verifyOtp
  },
  {
    method: 'POST', route: '/auth/api/rest/friends/invite', handler: inviteFriend
  },
  
  // PATCH
  {
    method: 'PATCH', route: '/auth/api/rest/user/nickname', handler: updateUserNickname
  },
  {
    method: 'PATCH', route: '/auth/api/rest/user/password', handler: updateUserPassword
  },
  {
    method: 'PATCH', route: '/auth/api/rest/friends/invite/:invitationId/accept', handler: acceptInvitation
  },
  {
    method: 'PATCH', route: '/auth/api/rest/friends/invite/:invitationId/reject', handler: rejectInvitation
  },

  // DELETE
  {
    method: 'DELETE', route: '/auth/api/rest/user', handler: setUserRemoved
  },
  {
    method: 'DELETE', route: '/auth/api/rest/user/:userId', handler: deleteUser
  },
  {
    method: 'DELETE', route: '/auth/api/rest/friends/:userId', handler: deleteFriend
  },

  
  // internal
  {
    method: 'GET', route: '/auth/internal/user/:id', handler: getUserInfoById
  },
  {
    method: 'POST', route: '/auth/internal/rating/update', handler: updateRating
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


