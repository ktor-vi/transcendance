export const getUserStatut = async () => {
	try {
		const res = await fetch('/api/me', {
			credentials: 'include',
		});

		if (!res.ok)
			return { loggedIn: false };
		const user = await res.json();
		return { loggedIn: true, user };
	} catch(err) {
		console.error('Erreur: fetch /me: ', err)
		return { loggedIn: false};
	}
}