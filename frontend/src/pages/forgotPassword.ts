import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderForgotPwd() {
	console.log("ForgotPassword called");
	try {
		const html =
		`<h1 style="text-align: center;">Mot de passe oublié</h1>
		<form id="forgotForm"
			style="
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 16px;
			min-height: 50vh;">

			<input type="text" id="email" placeholder="Email" required />
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
			<button type="submit">Envoyer</button>
		</form>

		<form id="resetPwdSection" style="display:none;">
		<h2>Créer un nouveau mot de passe</h2>
			<input type="password" id="newPassword" placeholder="Nouveau mot de passe" required />
			<input type="password" id="newPasswordVerification" placeholder="Répéter" required />
			<button type="submitNewPwd">Réinitialiser le mot de passe</button>
		</form>
		`;

		document.getElementById("app")!.innerHTML = html;
		
		document.getElementById("forgotForm")?.addEventListener("submit", async (e) => {
		e.preventDefault();

			const email = (document.getElementById("email") as HTMLInputElement).value;
			const question = (document.getElementById("questions") as HTMLInputElement).value;
			const response = (document.getElementById("response") as HTMLInputElement).value;

			const res = await fetch("api/forgotPassword", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, question, response }),
			});

			const data = await res.json();

			if (res.status === 401 || res.status === 400) {
				alert(data.message);
				return ;
			} else {
				alert("Infos ok");
				(document.getElementById("resetPwdSection") as HTMLElement).style.display = "";
				// page("/");
			}
		});
	
			document.getElementById("resetPwdSection")?.addEventListener("submit", async (e) => {
			e.preventDefault();

			const email = (document.getElementById("email") as HTMLInputElement).value;
			const newPwd = (document.getElementById("newPassword") as HTMLInputElement).value;
			const newPwdVerif = (document.getElementById("newPasswordVerification") as HTMLInputElement).value;

			if (newPwd != newPwdVerif) {
				alert("Les mots de passe ne correspondent pas");
				return ;
			}

			const res = await fetch("api/resetPassword", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, newPwd }),
			});

			const data = await res.json();

			if (res.status === 401) {
				alert(data.message);
				return ;
			} else {
				alert("Ton mot de passe a bien été réinitialisé, tu peux maintenant te connecter");
				page("/");
			}
		});

	}

	catch {

	}
}
