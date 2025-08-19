import fp from "fastify-plugin"; // importe fastify plugin 

export default fp(async function (fastify) {  // declare et exporte le plugin fastify 

  const clients = new Set(); //creer un set de client connectes chaque entree = une socket
	// mais cest une liste simple (pas de donnees associees ce qui a mon avis posera pb pour
	// l'associer a la DB alors utiliser peut etre Map (??)

  fastify.get("/chat", { websocket: true }, (socket, req) => { /* transforme la route GET en entrypoint de Websocket avec l'option websocket true au lieu de repondre en html ou json le serveur va faire une connexion http -> websocket
	  par ex si javais fait :
	   fastify.get("/hello", (req, reply) => {
  	   reply.send("Hello world");
	   });
	   -> cree une route HTTP GET classique si je fais GET /hello je recois hello world en html
	   alors que ici avec le plugin fastify websocket le front appelle (fichier -> srcs/pages/chat.ts) la socket "ws://mi-r4-p4 etc il envoie une requete http GET classique vers la loc chat avec un header special qui dit au serveur je veux faire un "upgrade" donc passer dune co basique http a une co websocket persistante 
	   1 - Envoi de la requete GET
	   	GET /chat HTTP/1.1
		Host: mi-r4-p4.s19.be:3000
		Upgrade: websocket
		Connection: Upgrade
		Sec-WebSocket-Key: abc123...
		Sec-WebSocket-Version: 13
	  
	  2 - Serveur Fastify grace a websocket:true repond 
	  	HTTP/1.1 101 Switching Protocols
		Upgrade: websocket
		Connection: Upgrade
		Sec-WebSocket-Accept: xyz987...
	La connexion devient bidirectionnellle, et persistante (pas besoin de refaire de requete a chaque fois, dimension "live"), base sur des messages pas du texte http
	Un canal est ouvert en continu, cote front c'est "open" je peux envoyer des msg, "ecouter" des msg, close si deco
	Cote serveur fastify jai mon "handler" : l'obj "socket" cest l'obj websocket cree par la lib "ws" de fastify il represente la connexion bi directionnelle entre notre serveur et CE client il ecoute, envoie, et surveille les fermetures une socket quoi
	ET req : cest la requete HTTP d'origine qui a demande l'upgrade cest comme un obj Fastify Request classic sauf quil est pimpe il sert a : identifier le client avec ses cookies ou sa session, recperer les ttoken d'auth dans les headers, voir lIP du client, anlayser l'URL ou les query params 
	- const cookies = req.cookies;
	- const authHeader = req.headers['authorization'];
	- const ip = req.socket.remoteAddress;
	- const { room } = req.query; // ex: ws://serveur/chat?room=42
	*/
    console.log("Miaou : client chat connecté"); // pour voir dans inspect sur la page et avoir des logs de debug
//     clients.add(socket);		// ajoute ce socket au set des clients connectes


//     socket.on("message", (raw) => { // ecoute chaque msg du client
//       let msg;
//       try {
//         msg = JSON.parse(raw); // parser au cas ou ca soit envoyer en format invalide de al part du front
//       } catch {
//         return;
//       }

//       if (msg.type === "chatMessage") { // reconnaissance du type chatMessage quon retrouve aussi comme id type dans le front
//         const payload = JSON.stringify({ // formate le payload en en contenu JSON pcq on veut plusieurs infos : type, user, content
//           type: "chatMessage",
//           user: msg.user ?? "Ta mere", // tous les clients qui ne sont pas toi portent ce nom 
// 	  //user: clients.get(socket), // ca je lai enleve pcq ca faisait tout bug on verra plus tard de toutes facons on doit se baser sur la DB et je sais pas si on peut link avec Set de base et get sutilise avec Map donc bon...
//           content: msg.content
//         });
//         for (const client of clients) { // broadcast a tous les clients sauf l'expediteur 
// 		if (client !== socket && client.readyState === 1) { // si le state de la WS est a 1 cest quelle bien OPEN (0 = connecting, 2= closing, 3 closed)
//       		     client.send(payload);
// 	   }
//         }
//       }
//     });

//     socket.on("close", () => {
//       clients.delete(socket); // si client deconnecte on le retire son socket du Set 
//       console.log("Mia-goodbye : client déconnecté");
//     });

//     socket.on("error", () => {
//       clients.delete(socket); // si erreur on supprime le client et sa socket, classic shit 
//     });
//   });
// });


console.log(
	`[CHAT] Nouvelle connexion WebSocket depuis ${req.socket.remoteAddress}`
  );
  console.log(`[CHAT] Headers de la requête:`, req.headers);

  clients.add(socket);
  console.log(
	`[CHAT] Client ajouté. Total: ${clients.size} clients connectés`
  );

  socket.on("message", (raw) => {
	console.log(`[CHAT] Message reçu:`, raw.toString());

	let msg;
	try {
	  msg = JSON.parse(raw);
	  console.log(`[CHAT] Message parsé:`, msg);
	} catch (err) {
	  console.error("[CHAT] Erreur de parsing JSON:", err);
	  return;
	}

	if (msg.type === "chatMessage") {
	  const payload = JSON.stringify({
		type: "chatMessage",
		user: msg.user ?? "Utilisateur",
		content: msg.content,
	  });

	  console.log(`[CHAT] Broadcasting à ${clients.size} clients:`, payload);

	  let broadcastCount = 0;
	  for (const client of clients) {
		if (client !== socket && client.readyState === 1) {
		  try {
			client.send(payload);
			broadcastCount++;
		  } catch (err) {
			console.error("[CHAT] Erreur envoi à un client:", err);
			clients.delete(client);
		  }
		}
	  }

	  console.log(`[CHAT] Message broadcasté à ${broadcastCount} clients`);
	} else {
	  console.log(`[CHAT] Type de message ignoré: ${msg.type}`);
	}
  });

  socket.on("close", (code, reason) => {
	clients.delete(socket);
	console.log(
	  `[CHAT] Client déconnecté (Code: ${code}, Raison: ${reason}). Clients restants: ${clients.size}`
	);
  });

  socket.on("error", (err) => {
	console.error("[CHAT] Erreur socket:", err);
	clients.delete(socket);
	console.log(
	  `[CHAT] Client supprimé après erreur. Clients restants: ${clients.size}`
	);
  });
});

console.log("[CHAT PLUGIN] Plugin chat enregistré avec succès");
});