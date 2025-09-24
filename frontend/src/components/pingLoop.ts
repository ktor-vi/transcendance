let pingInterval: NodeJS.Timeout | null = null;

// Starts periodic ping to keep session alive
export function startPingLoop() {
	if (pingInterval) return;

	pingInterval = setInterval(async () => {
		try {
			await fetch('/api/ping', { method: 'POST', credentials: 'include' });
		} catch (err) {
			console.error('Ping error:', err); // important error
		}
	}, 20000); // ping every 20 seconds
}
