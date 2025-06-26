import { fetchUserInfo } from '../utils/fetchUserInfo.js';

export default async function authRoutes(fastify) {
  fastify.get('/api/login/google/callback', async function (request, reply) {
    const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    const userInfo = await fetchUserInfo(token.access_token);

    request.session.set('user', userInfo);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    reply.redirect(`${frontendUrl}/dashboard?logged=1`);
  });

  fastify.get('/api/login/google/callback', async function (request, reply) {
    const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
    const userInfo = await fetchUserInfo(token.access_token);

    request.session.set('user', userInfo);
    reply.redirect('http://localhost:5173/dashboard?logged=1');
  });

  fastify.post('/logout', async (req, reply) => {
    req.session.delete();
    reply.send({ success: true });
  });
}
