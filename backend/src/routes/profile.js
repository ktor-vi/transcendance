import { openDb } from '../utils/db.js';
import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';

export default async function profileRoutes(fastify)
{
  fastify.get('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}

		const db = await openDb();
		const user = await db.get('SELECT * FROM users WHERE email = ?', userSession.email);
	
		return reply.send(user);
  });

  fastify.put('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		// le body = le nouveau nom passé depuis la requete enovoyee du frontend
		const { name, given_name, family_name } = req.body;

		const db = await openDb();
		await db.run('UPDATE users SET name = ?, given_name = ?, family_name = ? WHERE email = ?', name, given_name, family_name, userSession.email);
	
		reply.send({ success: true });
  });

	fastify.post('/profile', async (req, reply) => {
		const userSession = req.session.get('user');

		if (!userSession) {
			return reply.code(401).send({ error: 'Non connecté' });
		}
		// le body = le nouveau nom passé depuis la requete enovoyee du frontend

		// parts vient de fastify/multipart et sert à "parser" la requête contenant texte/ fichier (image)
		const data = await req.parts();
		// ces variables vont récupérer les infos de la requête
		let name = "";
		let given_name = "";
		let family_name = "";
		let picture = null;

		//ensuite nous devons lire la requête (data) qui est "découpée" en une variable
		// ici nommée part. La loop "for... of..." permet d'itérer au sein d'une variable
		for await (const part of data) { // await car data est asynchrone (cf. await req.parts())
			// si le part qu'on est en train de parser est bien un fichier
			// et son attribut name est bien = changePicture
			if (part.type === 'file' && part.fieldname === 'changePicture') {
				// on créé une variable vide chunks qui va stocker les chunk de la boucle
				const chunks = [];
				// on push tout dans nos chunks
				for await (const chunk of part.file) {
					chunks.push(chunk)
				}
				// fusionner les chunk du tableau
				picture = Buffer.concat(chunks);
				// on importe fs qui permet de lire/ écrire des fichiers

				const uploadDir = path.resolve('./public/uploads');

				await mkdir(uploadDir, { recursive: true });
				// on upload l'image dans le dossier public/uploads avec comme nom l'email de l'user
				await fs.writeFile(`./public/uploads/${userSession.email}.jpg`, picture)

			} else {
				if (part.fieldname === 'name')
					name = part.value;
				if (part.fieldname === 'given_name')
					given_name = part.value;
				if (part.fieldname === 'family_name')
					family_name = part.value;
			}
		}
			const db = await openDb();
			// mise à jour de la DB avec les infos text
			await db.run('UPDATE users SET name = ?, given_name = ?, family_name = ? WHERE email = ?', name, given_name, family_name, userSession.email);
			// mise à jour de la pp
			if (!picture) {
				"LA PHOTO N A PAS ETE UPLOAD DANS LA DB";
			}
			if (picture) {
				await db.run('UPDATE users SET picture = ? WHERE email = ?', `/uploads/${userSession.email}.jpg`, userSession.email);
			} else {
				console.log("Y A PAS DE NEW PHOTO");
			}
		reply.send({ success: true });
	});

}
