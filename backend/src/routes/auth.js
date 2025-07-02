import { fetchUserInfo } from '../utils/fetchUserInfo.js';

export default async function authRoutes(fastify) {
  fastify.get('/api/login/google/callback', async function (request, reply) {
    console.log('Session avant token:', request.session.get('state')); // devrait exister
    const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      console.log('Token obtenu:', token);
    const userInfo = await fetchUserInfo(token.access_token);
    console.log(userInfo);
    request.session.set('user', userInfo);
    console.log('Session après sauvegarde:', request.session.get('user'));
    const frontendUrl = `https://${process.env.HOSTNAME}:5173`;
    reply.redirect(`${frontendUrl}/dashboard?logged=1`);
  });

  fastify.post('/logout', async (req, reply) => {
    req.session.delete();
    reply.send({ success: true });
  });
}
