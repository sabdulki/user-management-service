import { FastifyInstance } from 'fastify'
import { IHandler } from '../../pkg/handler/handler'
import { registrationHandler } from './publicHandlers/auth/registration'
import { loginHandler } from './publicHandlers/auth/login'
import { getUserInfo } from './publicHandlers/get/getUser'
import { getUserInfoById } from './privateHandlers/getUserById'
import { refreshTokensPair } from './publicHandlers/refreshToken'
import { setUserRemoved } from './publicHandlers/delete/setUserRemoved'
import { uploadAvatar } from './publicHandlers/update/uploadAvatar'
import { updateRating } from './privateHandlers/updateRating'
import { googleLoginExchange } from './publicHandlers/auth/googleLogin'
import { updateUserNickname } from './publicHandlers/update/updateNickname'
import { updateUserPassword } from './publicHandlers/update/updatePassword'
import { verifyOtp } from './publicHandlers/auth/verifyOtp'
import { deleteUser } from './publicHandlers/delete/deleteUser'
import { getRatingLeaders } from './publicHandlers/get/getRatingLeaders'
import { inviteFriend } from './publicHandlers/friends/inviteFriend'
import { acceptInvitation } from './publicHandlers/friends/acceptInvitation'
import { rejectInvitation } from './publicHandlers/friends/rejectInvitation'
import { getFriends } from './publicHandlers/friends/getFriends'
import { deleteFriend } from './publicHandlers/friends/deleteFriend'
import { getInvitations } from './publicHandlers/friends/getInvitations'
import { getUserById } from './publicHandlers/get/getUserById'

const routes: IHandler[] = [
  //        PUBLIC
  // GET
  {
    method: 'GET', route: '/auth/api/rest/user', handler: getUserInfo
  },
  {
    method: 'GET', route: '/auth/api/rest/user/:userId', handler: getUserById
  },
  {
    method: 'GET', route: '/auth/api/rest/rating/leader', handler: getRatingLeaders
  },
  {
    method: 'GET', route: '/auth/api/rest/friends', handler: getFriends
  },
  {
    method: 'GET', route: '/auth/api/rest/friends/invite', handler: getInvitations
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


