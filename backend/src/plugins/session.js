//Plugin permettant de gérer les sessions utilisateur avec les cookies (on obtient les cookies après s'être connecté avec google)
import secureSession from '@fastify/secure-session';

export default async function registerSession(fastify) {
	//cle secrete du .env pour chiffrer les cookies
	const key = Buffer.from(process.env.SESSION_KEY_BASE64, 'base64');

	//enregistrement du plugin
	fastify.register(secureSession, {
		key,
		cookieName: 'sessionid',
		cookie: {
			path: '/',
			httpOnly: true,
			sameSite: 'none', // Pour eviter le csrf
			secure: true,
			domain: undefined,
			maxAge: 24 * 60 * 60 * 1000 // 24 heures
		}
	});
}


//TOUT CECI PERMETS DE :
// stocker une donnée dans la session
// request.session.set('user', { id: 123 });

// la lire
// const user = request.session.get('user');

// la supprimer
// request.session.delete();
