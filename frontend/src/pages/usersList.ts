import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

// renderProfile permet de créer la page liée au profile
export async function renderUsersList() {
	console.log("renderUsersList called");
	try { //on tente de récupérer la route du backend
		const res = await fetch("/api/usersList", { method: "GET" });

		if (!res.ok) {
			document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
			return;
		}
		// quand on a récupéré la réponse du back (les infos de profile),
		// on les met dans userData puis dans le html qui sera injecté
		const users = await res.json();
		const listUsers = users
		.map((user: { name: string }) => `<li><a href="/user/${encodeURIComponent(user.name)}">${user.name}</a></li>`)
		.join("");

		const html = `
		<h1 style="text-align: center;">Liste des utilisateurs</h1>
		 	<ul>${listUsers}</ul>
			${backButton()}
		`;

		// injection du html
		document.getElementById("app")!.innerHTML = html;
		// créé le bouton de retour arriere
		setupBackButton();
		// va enregistrer si une modif d'information a été faite
	} catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
	}
}
