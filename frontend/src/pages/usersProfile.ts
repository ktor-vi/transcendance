import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderUserProfile(ctx: any) {
	console.log("renderUserProfile called");
	try {
		const userName = ctx.params.name;
		const res = await fetch(`api/user/${encodeURIComponent(userName)}`, { method: "GET" });

		if (!res.ok) {
			document.getElementById("app")!.innerHTML = "<p>Cet utilisateur n'existe pas</p>";
			return;
		}
		const user = await res.json();

		const html = `
		<h1 style="text-align: center;">Profile de ${user.name}</h1>
			${backButton()}
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();
	} catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
	}
}
