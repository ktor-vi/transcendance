import fastifyCors from '@fastify/cors';

export default async function registerCors(fastify) {
  fastify.register(fastifyCors, {
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });
}
