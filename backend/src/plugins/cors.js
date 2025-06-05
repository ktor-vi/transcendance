import fastifyCors from '@fastify/cors';

export default async function registerCors(fastify) {
  const allowedOrigins = [
    'http://localhost:5173',
    'https://localhost:5173',
    process.env.FRONTEND_URL
  ].filter(Boolean);

  fastify.register(fastifyCors, {
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });
}
