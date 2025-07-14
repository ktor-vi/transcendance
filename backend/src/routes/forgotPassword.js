export default async function forgotPwdRoutes(fastify) {
	fastify.get('/forgotPassword', async (req, reply) => {
		console.log("🔔 route GET /api/forgotPassword reached");
		
		reply.send({ success: true });

	});
}