import fastifyCors from '@fastify/cors';

// configure backend CORS to allow frontend requests
export default async function registerCors(fastify) {
	fastify.register(fastifyCors, {
		origin: [
			`https://${process.env.HOSTNAME}:5173`,
			`https://${process.env.HOSTNAME}:3000`
		], // allowed frontends
		methods: ['GET', 'POST', 'PUT', 'DELETE'],
		allowedHeaders: ['Content-Type', 'Authorization'],
		credentials: true
	});
}

