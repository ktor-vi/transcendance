import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

// renderProfile permet de créer la page liée au profile
export async function renderProfile() {
	console.log("renderProfile called");
	try { //on tente de récupérer la route du backend
		const res = await fetch("/api/profile", { method: "GET" });

		if (!res.ok) {
			document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
			return ;
		}
		// quand on a récupéré la réponse du back (les infos de profile),
		// on les met dans userData puis dans le html qui sera injecté
		const userData = await res.json();
		const html =  `
			<h1>Profil</h1>
			<h3>Pseudo : </h3>
			<input type="text" id="nameInput" value="${userData.name}" />
			<button id="saveName">Enregistrer</button>
			<h3>Prénom : ${userData.given_name}</h3>
			<h3>Nom de famille : ${userData.family_name}</h3>
			<h3>Photo de profile :</h3>
			<img src="${userData.picture}" alt="Photo de profil" />
			<br>
			${backButton()}
			</section>
			`;
		// injection du html
		document.getElementById("app")!.innerHTML = html;
		// créé le bouton de retour arriere
		setupBackButton();
		// va enregistrer si nouveau pseudo écrit
		document.getElementById("saveName")?.addEventListener("click", async() => {
			const newName = (document.getElementById("nameInput") as HTMLInputElement).value;
			// va faire une requete au back pour envoyer le nouveau pseudo
			const res = await fetch("/api/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ name: newName }) //on transforme newName en json pour le backend
			});

			if (res.ok) {
				alert("Pseudo mis à jour!");
				// page.redirect("/profile");
			} else {
				alert("Erreur lors du changement de pseudo");
			}
		});
	}

	catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";

	}
}