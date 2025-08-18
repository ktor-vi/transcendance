import { fetchUserInfo } from '../utils/fetchUserInfo.js';
import { openDb } from '../utils/db.js';

export default async function authRoutes(fastify)
{	
	// GET pour connextion avec Google Authentification
	fastify.get('/api/login/google/callback', async function (request, reply)
	{
		const { token } = await this.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
		const userInfo = await fetchUserInfo(token.access_token);

		request.session.set('user', userInfo);

		// ouvrir et récupérer la db avec ma fonction openDB (db.js)
		const db = await openDb();
		// mettre l'adresse mail de l'user récupée par Google dans la db
		const result = await db.run(
			`INSERT OR IGNORE INTO users (email, name, picture) VALUES (?, ?, ?)`,
			userInfo.email,
			userInfo.name,
			userInfo.picture
		);
		
		if (result.changes > 0) {
			console.log(`NOUVEL UTILISATEUR CRÉÉ : ${userInfo.name}`);
		}
		else
			console.log("L'utilisateur existait déjà dans la base de données.")

		reply.redirect(`https://${process.env.HOSTNAME}:5173/dashboard?logged=1`);
	});


	// POST pour le logout
	fastify.post('/logout', async (req, reply) =>
	{
		req.session.delete();
		reply.send({ success: true });
	});

	// POST pour une nouvelle inscription
	// fastify.post('/api/register', async (req, reply) => {
		
	// })
}

