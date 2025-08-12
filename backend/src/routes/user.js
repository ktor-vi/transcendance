import { isUserOnline } from '../utils/connectedUsers.js'

export default async function userRoutes(fastify) {
  // On déclare une route GET sur le chemin '/me'
  // Cela signifie que lorsqu’un client envoie une requête GET à l'URL '/me', la fonction callback est exécutée.
	fastify.get('/me', async (req, reply) => {
		console.log('Cookies reçus:', req.headers.cookie);
		// On tente de récupérer les informations de l'utilisateur stockées dans la session via req.session.
		const user = req.session.get('user');
			// On affiche dans la console les données de l'utilisateur récupérées dans la session.
		console.log('Session user:', req.session.get('user'));
		// Si aucun utilisateur n'est trouvé dans la session (donc l'utilisateur n'est pas connecté),
		// on retourne une réponse HTTP avec le code 401 (Non autorisé) et un message d'erreur.
		if (!user) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
			// Si un utilisateur est trouvé dans la session, on le retourne tel quel.
		// Cela permet au frontend de récupérer les informations du profil de l'utilisateur actuellement connecté.
		return user;
	});

	fastify.get('/user/:name/online', async (req, reply) => {
		const online = isUserOnline(req.params.name);
		console.log(`userId DANS FESTIFY GET = ${req.params.name}`);
		return ({ online });
	});
}
