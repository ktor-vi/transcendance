const connectedUsers = new Map();

export function updateUserPing(userId) {
	connectedUsers.set(userId, Date.now());
}

export function isUserOnline(userId) {
	// console.log(`userId DANS ISUSERONLINE = ${userId}`);
	const lastConnexion = connectedUsers.get(userId);
	// console.log(`last connexion = ${lastConnexion}`);

	if (!lastConnexion)
		return false;
	if (Date.now() - lastConnexion > 40000)
		return false;
	return true;
}

