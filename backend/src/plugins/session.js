// session.js
// Plugin pour gérer les sessions utilisateur avec cookies sécurisés
import secureSession from '@fastify/secure-session';

export default async function registerSession(fastify) {
  // Clé secrète pour chiffrer les cookies, issue de ton .env
  if (!process.env.SESSION_KEY_BASE64) {
    throw new Error("SESSION_KEY_BASE64 doit être défini dans le .env");
  }
  const key = Buffer.from(process.env.SESSION_KEY_BASE64, 'base64');

  // Enregistrement du plugin
  fastify.register(secureSession, {
    key,
    cookieName: 'sessionid',
    cookie: {
      path: '/',
      httpOnly: true,
      sameSite: 'none', // Pour éviter les attaques CSRF
      secure: true,     // Mettre false en dev si pas HTTPS
      maxAge: 24 * 60 * 60, // 24 heures en secondes
    },
  });

  // Démo d'utilisation (à supprimer ou adapter selon ton app)
  fastify.decorateRequest('getUser', function() {
    return this.session.get('user');
  });
  fastify.decorateRequest('setUser', function(user) {
    this.session.set('user', user);
  });
  fastify.decorateRequest('deleteUser', function() {
    this.session.delete('user');
  });
}

/*
UTILISATION DANS TES ROUTES / WS :

// Stocker une donnée
request.session.set('user', { id: 123 });

// Récupérer une donnée
const user = request.session.get('user');
const userId = user?.id;

// Supprimer une donnée
request.session.delete('user');
*/

