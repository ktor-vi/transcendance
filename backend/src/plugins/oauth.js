import oauthPlugin from '@fastify/oauth2';

export default async function registerOAuth(fastify) {
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  
  fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: process.env.GCLOUD_ID,
        secret: process.env.GCLOUD_SECRET
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/login/google',
    callbackUri: `${baseUrl}/api/login/google/callback`
  });
}
