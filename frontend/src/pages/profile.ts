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

		if (!userData.picture || userData.picture.trim() === "") {
			userData.picture = "/default.jpg";
		}
		
		const html = `
		<h1 style="text-align: center;">Profil</h1>
		<section style="
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		min-height: 50vh;
		">
			<div style="display: flex; align-items: center; gap: 8px;">
			<label for="nameInput">Pseudo :</label>
			<input type="text" id="nameInput" value="${userData.name}" />
			</div>

			<div style="display: flex; align-items: center; gap: 8px;">
			<label for="given_nameInput">Prénom :</label>
			<input type="text" id="given_nameInput" value="${userData.given_name}" />
			</div>

			<div style="display: flex; align-items: center; gap: 8px;">
			<label for="family_nameInput">Nom :</label>
			<input type="text" id="family_nameInput" value="${userData.family_name}" />
			</div>

			<div style="text-align: center;">
			<h3>Photo de profil :</h3>
			<img src="${userData.picture}" alt="default" style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;" />
			</div>

			<button id="save">Enregistrer les modifications</button>
			${backButton()}
		</section>
`;

		// injection du html
		document.getElementById("app")!.innerHTML = html;
		// créé le bouton de retour arriere
		setupBackButton();
		// va enregistrer si nouveau pseudo écrit
		document.getElementById("save")?.addEventListener("click", async() =>
		{
			const newName = (document.getElementById("nameInput") as HTMLInputElement).value;
			const newGivenName = (document.getElementById("given_nameInput") as HTMLInputElement).value;
			const newFamilyName = (document.getElementById("family_nameInput") as HTMLInputElement).value;
			// va faire une requete au back pour envoyer le nouveau pseudo
			const res = await fetch("/api/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ name: newName, given_name: newGivenName, family_name: newFamilyName }) //on transforme newName en json pour le backend
			});

			if (res.ok) {
				alert("Profil mis à jour!");
				// page.redirect("/profile");
			} else {
				alert("Erreur lors des modifications");
			}
		});
	}

	catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";

	}
}
