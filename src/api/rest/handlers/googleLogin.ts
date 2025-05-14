import { FastifyRequest, FastifyReply } from 'fastify'
import app from 'fastify'

type GoogleUser = {
    id: string
    email: string
    name: string
    picture: string
  }
  

// User logs into Google and gives permission.
export async function googleLoginHandler(request: FastifyRequest, reply: FastifyReply) 
{
    const token = await request.server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)

    const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
        Authorization: `Bearer ${token.access_token}`
        }
    })

    const googleUser = await userInfoRes.json() as GoogleUser;

    // Extract email or id
    const email = googleUser.email;

    // Check if user exists in DB
    const storage = request.server.storage;
    const user = storage.getUserByEmail(email);

    if (!user) {
        // create a new user
        user = await db.createUser({
        email,
        username: googleUser.name || email,
        avatar: googleUser.picture,
        provider: 'google'
        })
    }

    // Generate JWT
    const jwt = app.jwt.sign({ id: user.id })

    // Option 1: return JWT as JSON
    // return reply.send({ token: jwt })

    // Option 2: redirect to frontend with token as query param
    return reply.redirect(`http://localhost:5173/auth/callback?token=${jwt}`)
}