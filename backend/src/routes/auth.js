import { fetchUserInfo } from '../utils/fetchUserInfo.js';

export default async function authRoutes(fastify) {
  // Root route for debugging - shows available endpoints
  fastify.get('/', async (request, reply) => {
    return {
      message: 'Transcendance Backend API',
      endpoints: {
        'GET /': 'This endpoint',
        'GET /api/login/google/callback': 'OAuth callback',
        'GET /me': 'Get current user',
        'POST /api/logout': 'Logout'
      },
      frontend: process.env.FRONTEND_URL || 'https://localhost:443'
    };
  });

  fastify.get('/api/login/google/callback', async function (request, reply) {
    try {
      console.log('OAuth callback received');
      const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
      console.log('Token received:', token ? 'Yes' : 'No');
      
      const userInfo = await fetchUserInfo(token.access_token);
      console.log('User info fetched:', userInfo);

      request.session.set('user', userInfo);
      console.log('Session set, user:', request.session.get('user'));
      
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      console.log('Redirecting to:', `${frontendUrl}/dashboard?logged=1`);
      reply.redirect(`${frontendUrl}/dashboard?logged=1`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      reply.code(500).send({ error: 'OAuth callback failed' });
    }
  });

  fastify.post('/api/logout', async (req, reply) => {
    req.session.delete();
    reply.send({ success: true });
  });
}
