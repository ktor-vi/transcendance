// toujours importer les modules qu'on veut utiliser dans les fichiers
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// on met openDb en asynchrone car la fonction open est asynchrone
export async function openDb()
{
	return open({	
	filename: './data/users.sqlite3',
		driver: sqlite3.Database // sqlite3 = un objet, Database = une classe. Cette ligne indique a sqlite quel type de connexion utiliser pour gerer la db
	});
}

export async function openDbHistory()
{
	return open({	
	filename: './data/history.sqlite3',
		driver: sqlite3.Database // sqlite3 = un objet, Database = une classe. Cette ligne indique a sqlite quel type de connexion utiliser pour gerer la db
	});
}