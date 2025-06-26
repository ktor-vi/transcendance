import fastifyCors from '@fastify/cors';

// Ce code configure le CORS du backend,
// ce qui est essentiel pour permettre au frontend (souvent sur un autre port)
// d’appeler le backend sans être bloqué par le navigateur.
//
// En gros il authorise les requetes provenant de l'adresse http://localhost:5173 (frontend)
export default async function registerCors(fastify) {
  fastify.register(fastifyCors, {
    origin: ['http://localhost:5173'], // Autorise uniquement ce frontend à faire des requêtes vers ton backend.
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });
}
