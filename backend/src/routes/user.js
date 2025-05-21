export default async function userRoutes(fastify) {
  fastify.get('/me', async (req, reply) => {
    const user = req.session.get('user');
    console.log('Session user:', req.session.get('user'));
    if (!user) {
      return reply.code(401).send({ error: 'Non connecté' });
    }
    return user;
  });
}
