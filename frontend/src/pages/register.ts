import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export function renderRegister() {
	const html = `
	<h1>Créer un compte</h1>
		<form id="registerForm">
			<input type="text" id="name" placeholder="Pseudo" required />
			<input type="email" id="email" placeholder="Email" required />
			<input type="password" id="password" placeholder="Mot de passe" required />
		<div>
			<label for="questions">Choisis une question</label>
			<select id="questions">
				<option></option>
				<option value="1">Quel est le nom de ton premier animal de compagnie ?</option>
				<option value="2">Quel est le premier jeu-vidéo auquel tu as joué ?</option>
				<option value="3">Quel est le prénom de votre meilleur·e ami·e d'enfance ?</option>
				<option value="4">Quel était le nom de votre école primaire ?</option>
				<option value="5">Quel était le prénom de votre instituteur·trice préféré·e ?</option>
			</select>
			<input type="text" id="response" placeholder="Réponse" required />
		</div>
			<button id="register" data-nav>S'inscrire</a>
		</form>
		
		${backButton()}
	`;

	document.getElementById("app")!.innerHTML = html;
	setupBackButton();
	document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const name = (document.getElementById("name") as HTMLInputElement).value;
		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;
		const question = (document.getElementById("questions") as HTMLInputElement).value;
		const response = (document.getElementById("response") as HTMLInputElement).value;

		const res = await fetch("api/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, password, question, response }),
		});
		if (res.status === 409) {
				const data = await res.json();
				alert(data.message);
				return ;
		}
		if (res.ok) {
			alert("Compte créé, tu peux maintenant te connecter!");
			// page.redirect("/api/home");
			
		} else {
			const err = await res.json();
			alert(err.error || "Erreur pendant l'inscription");
		}
	});
}