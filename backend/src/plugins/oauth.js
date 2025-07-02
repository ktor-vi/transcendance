import oauthPlugin from '@fastify/oauth2';

// Configure Fastify pour permettre aux utilisateurs de se connecter via Google grâce à l'OAuth
export default async function registerOAuth(fastify) {
  fastify.register(oauthPlugin, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'], // Les differentes infos qu'on va demander à Google
    credentials: {
      client: {
        id: process.env.GCLOUD_ID,
        secret: process.env.GCLOUD_SECRET
      },
      auth: oauthPlugin.GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/login/google', // Quand l'utilisateur visite cette route, il est redirigé vers Google pour autoriser l'accès à son compte.
    callbackUri: `https://${process.env.HOSTNAME}:3000/api/login/google/callback`, // C’est l’URL de retour : Google redirige l'utilisateur ici après qu'il a autorisé l'application.
  });
}
