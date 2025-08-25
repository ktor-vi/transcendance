import sqlite3pkg from 'sqlite3'

//sqlite3 est un nom choisi, on "importe" ensuite sqlite3 avec require, verbose sert a avoir plus d'infos en cas d'erreurs
const sqlite3 = sqlite3pkg.verbose();

console.log ("Opening or creating chat database...");

/** 
 * Print an error message if the creation of the database fail.
 * @param {any} err - contain the error, or NULL if no error
 */
function errorHandling(err){
	if (!err)
		return;
	console.error("error when creating chat database");
}

//cree la db chat
const db = new sqlite3.Database('./data/chat.sqlite3', errorHandling)

//setup de la base de donnees
const createConversationsTable =
`
CREATE TABLE IF NOT EXISTS
	conversations
	(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user1_id INTEGER NOT NULL,
    	user2_id INTEGER NOT NULL,
    	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    	updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user1_id) REFERENCES users(id),
		FOREIGN KEY (user2_id) REFERENCES users(id),
		UNIQUE(user1_id, user2_id)
	);
`;

const createPrivateMessagesTables =
`
CREATE TABLE IF NOT EXISTS
	messages
	(
    	id INTEGER PRIMARY KEY AUTOINCREMENT,
    	conversation_id INTEGER NOT NULL,
    	sender_id INTEGER NOT NULL,
    	content TEXT NOT NULL,
    	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    	is_read BOOLEAN DEFAULT FALSE,
		FOREIGN KEY (conversation_id) REFERENCES conversations(id),
		FOREIGN KEY (sender_id) REFERENCES users(id)
	);
`;

//execute les commandes sql definies precedemment
db.run(
	createConversationsTable,
	(err) => {
		if (!err)
			return;
		console.error("error when creating conversations table");
	}
)

db.run(
	createPrivateMessagesTables,
	(err) => {
		if (!err)
			return;
		console.error("error when creating messages tables");
	}
)

// la db est ouverte automatiquement a la creation,
// la fermer evite des potentielles corruptions de donnees, de la consommation inutiles de ressources, etc.
db.close(
	(err) => {
		if (err)
			console.error("error when closing chat tables");
		else
			console.log ("chat database closed");
	}
)
