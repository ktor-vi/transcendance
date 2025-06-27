import oauthPlugin from '@fastify/oauth2';

export default async function registerOAuth(fastify)
{
	fastify.register(oauthPlugin,
	{
		name: 'googleOAuth2',
		scope: ['profile', 'email'],
		credentials:
		{
			client:
			{
				id: process.env.GCLOUD_ID,
				secret: process.env.GCLOUD_SECRET
			},
			auth: oauthPlugin.GOOGLE_CONFIGURATION
		},
		startRedirectPath: '/api/login/google',
		callbackUri: 'http://localhost:3000/api/login/google/callback'
	});
}