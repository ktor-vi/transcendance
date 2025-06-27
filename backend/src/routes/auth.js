import { fetchUserInfo } from '../utils/fetchUserInfo.js';
import { openDb } from '../utils/db.js';

export default async function authRoutes(fastify)
{
	fastify.get('/api/login/google/callback', async function (request, reply)
	{
		const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
		const userInfo = await fetchUserInfo(token.access_token);

		request.session.set('user', userInfo);

		// ouvrir et récupérer la db
		const db = await openDb();
		// mettre l'adresse mail de l'user récupée par Google dans la db
		const result = await db.run(
			`INSERT OR IGNORE INTO users (email, name) VALUES (?, ?)`,
			userInfo.email,
			userInfo.name
		);
		console.log('Résultat de l\'insertion du profil dans sqlite: ', result);

		reply.redirect('http://localhost:5173/dashboard?logged=1');
	});


	fastify.post('/logout', async (req, reply) =>
	{
		req.session.delete();
		reply.send({ success: true });
	});
}
