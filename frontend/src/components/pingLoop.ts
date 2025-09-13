let pingInterval: NodeJS.Timeout | null = null; // protection démarrage en boucle

export function startPingLoop() {
	console.log("Démarrage des pings...\n");
	if (pingInterval)
		return ;
	pingInterval = setInterval(async () => {
		try {
			await fetch('/api/ping', {
					method: 'POST',
					credentials: 'include',
				});
		} catch (err) {
			console.error('Erreur de ping: ', err);
		}
	}, 20000); // on va ping toutes les 20 secondes
}