import sqlite3pkg from "sqlite3";
const sqlite3 = sqlite3pkg.verbose();
const db = new sqlite3.Database("./data/users.sqlite3");

// Get or create a conversation between two users
export function getOrCreateConversation(user1Id, user2Id) {
	return new Promise((resolve, reject) => {
		// always order user1 < user2 to respect UNIQUE(user1_id, user2_id)
		const [a, b] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

		// Check if conversation exists
		db.get(
			`SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?`,
			[a, b],
			(err, row) => {
				if (err) {
					return reject(err);
				}
				if (row) {
					// Conversation already exists
					resolve(row.id);
				} else {
					// Create new conversation
					db.run(
						`INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)`,
						[a, b],
						function (err) {
							if (err) {
								return reject(err);
							}
							resolve(this.lastID); // ID of the new conversation
						}
					);
				}
			}
		);
	});
}

