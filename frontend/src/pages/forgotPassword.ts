import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderForgotPwd() {
	console.log("ForgotPassword called");
	try {
		const res = await fetch("/api/forgotPassword", { method: "GET" });

		if (!res.ok) {
			document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
			return ;
		} else {
			const html =
			`<h1 style="text-align: center;">Mot de passe oublié</h1>
			<form id"forgotForm"
			style="
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 16px;
			min-height: 50vh;
			">
					<input type="text" id="email" placeholder="Email" required />
					<label for="questions">Choisis une question</label>
					<select id="questions">
						<option></option>
						<option id="1">Quel est le nom de ton premier animal de compagnie ?</option>
						<option id="2">Quel est le premier jeu-vidéo auqel tu as joué ?</option>
						<option id="3">Quel est le prénom de votre meilleur·e ami·e d'enfance ?</option>
						<option id="4">Quel était le nom de votre école primaire ?</option>
						<option id="5">Quel était le prénom de votre instituteur·trice préféré·e ?
					</select>
					<input type="text" id="response" placeholder="Réponse" required />
				</form>
			<button>Envoyer</button>
			`;

		document.getElementById("app")!.innerHTML = html;
			
		}


	}
	catch {

	}
}
