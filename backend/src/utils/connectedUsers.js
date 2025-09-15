const connectedUsers = new Map();

// Update user's last ping time
export function updateUserPing(userId) {
	connectedUsers.set(userId, Date.now());
}

// Check if user is online (active within last 40 seconds)
export function isUserOnline(userId) {
	const lastConnection = connectedUsers.get(userId);
	if (!lastConnection) return false;
	if (Date.now() - lastConnection > 40000) return false;
	return true;
}
