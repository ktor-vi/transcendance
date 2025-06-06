const sqlite3 = require('sqlite3').verbose(); //sqlite3 est un nom choisi, on "importe" ensuite sqlite3 avec require, verbose sert a avoir plus d'infos en cas d'erreurs

function errorHandling(err) // ma variable err va "stocker" l'eventuel erreur qu'il y aura dans la fonction Database (sinon elle sera null)
{
	if (err)
	{
		console.error("error when creating database");
	}
	else
	{
		console.log("database opened");
	}

}

// new sqlite3.Database(path, callback
const db = new sqlite3.Database('./data/users.sqlite3', errorHandling) //cree ma db dans un fichier que je place dans data

const createSQTable =
`
CREATE TABLE IF NOT EXISTS
	users
	(
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		name TEXT NOT NULL,
		pseudo TEXT NOT NULL,
		password TEXT NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
`;