import { openDb } from '../utils/db.js';
import path from 'path';
import fs from 'fs/promises';
import { mkdir } from 'fs/promises';
import { fileTypeFromBuffer } from "file-type";
import { v4 as uuidv4 } from 'uuid';

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
		let extension = "";
		let type = "";

		//ensuite nous devons lire la requête (data) qui est "découpée" en une variable
		// ici nommée part. La loop "for... of..." permet d'itérer au sein d'une variable
		for await (const part of data) { // await car data est asynchrone (cf. await req.parts())
			// si le part qu'on est en train de parser est bien un fichier
			// et son attribut name est bien = changePicture
			if (part.type === 'file' && part.fieldname === 'changePicture') {
				// on créé une variable vide chunks qui va stocker les chunk de la boucle
				const chunks = [];
				// on push tout dans nos chunks en vérifiant la taille
				let totalSize = 0;
				for await (const chunk of part.file) {
					totalSize += chunk.length;
					if (totalSize > (2 * 1024 * 1024)) {// 2MB max
						return reply.code(400).send({ error: 'Fichier trop volumineux (> 2MB)' });
					}
					chunks.push(chunk)
				}
				// fusionner les chunk du tableau
				picture = Buffer.concat(chunks);

				// vérification du type de fichier
				type = await fileTypeFromBuffer(picture);
				if (!type || !['image/jpeg', 'image/png', 'image/webp'].includes(type.mime)) {
					return reply.code(400).send({ error: 'Type de fichier non accepté' });
				}
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
			//suppression de l'ancien fichier pour ne pas surcharger le serveur inutilement
			let uploadDir = path.resolve('public/uploads');
			const oldPictureRow = await db.get('SELECT picture FROM users WHERE email = ?', userSession.email);
			const oldPicture = oldPictureRow.picture;

			if (oldPicture && oldPicture.startsWith('/uploads/')) {
				const fileName = oldPicture.replace('/uploads/', '');
				const filePath = path.join(uploadDir, fileName);

				await fs.unlink(filePath);
			}

			extension = type.ext;
			uploadDir = path.resolve('public/uploads');
			// création d'un nom généré aléatoirement
			const safeName = `${uuidv4()}.${extension}`;
			// on expose uniquement le dossier uploads
				await mkdir(uploadDir, { recursive: true });
				
				const filePath = path.join(uploadDir, safeName);
				await fs.writeFile(filePath, picture);
				// mise à jour dans la db
				await db.run('UPDATE users SET picture = ? WHERE email = ?', `/uploads/${safeName}`, userSession.email);
			}
			reply.send({ success: true });
		});
		
}
