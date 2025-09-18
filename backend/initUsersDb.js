import sqlite3pkg from 'sqlite3';
const sqlite3 = sqlite3pkg.verbose();

console.log("Opening or creating users database...");

// open/create db file
const db = new sqlite3.Database('./data/users.sqlite3', (err) => {
	if (err) {
		console.error("Error opening users database");
		return;
	}
	console.log("Users database opened");

	// enable foreign keys
	db.run("PRAGMA foreign_keys = ON");

	// schema for users-related tables
	const createSQTable = `
	CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		email TEXT UNIQUE NOT NULL,
		name TEXT UNIQUE NOT NULL,
		password_hash TEXT,
		question TEXT,
		response_hash TEXT,
		picture TEXT,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE TABLE IF NOT EXISTS friends (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user1_id INTEGER NOT NULL,
		user2_id INTEGER NOT NULL,
		friends_since DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user1_id, user2_id)
	);

	CREATE TABLE IF NOT EXISTS requests (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		sender_id INTEGER NOT NULL,
		receiver_id INTEGER NOT NULL,
		status TEXT NOT NULL DEFAULT 'waiting',
		request_date DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS conversations (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		user1_id INTEGER NOT NULL,
		user2_id INTEGER NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
		FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
		UNIQUE(user1_id, user2_id)
	);

	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		conversation_id INTEGER NOT NULL,
		sender_id INTEGER NOT NULL,
		content TEXT NOT NULL,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
		FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
		FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
	);

	CREATE TABLE IF NOT EXISTS blockedUsers (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		blocked_id INTEGER NOT NULL,
		blocker_id INTEGER NOT NULL
	);`;

	// create tables
	db.exec(createSQTable, (err) => {
		if (err)
			console.error("Error creating tables:", err.message);
		else
			console.log("Users tables ready");

		// close db to avoid corruption/resource leaks
		db.close((err) => {
			if (err)
				console.error("Error closing users database");
			else
				console.log("Users database closed");
		});
	});
});

