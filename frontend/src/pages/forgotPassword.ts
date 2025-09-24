import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderForgotPwd() {
	try {
		
		const html = `
			<script>0</script>
		<section class="flex flex-col items-center text-center">
		<img src="/images/hellokittycomputer.png" class="hellokitty-computer">
		<h1 class="text-4xl">Mot de passe oublié</h1>
		<form class="flex flex-col items-center text-center mt-8 space-y-4" id="forgotForm">
			<input type="text" id="email" placeholder="Email" required />
			<label for="questions" class="text-lg">Choisis une question</label>
			<div class="flex flex-col space-y-4">
			<select id="questions" class="form-field">
				<option></option>
				<option value="1">Quel est le nom de ton premier animal de compagnie ?</option>
				<option value="2">Quel est le premier jeu-vidéo auquel tu as joué ?</option>
				<option value="3">Quel est le prénom de votre meilleur·e ami·e d'enfance ?</option>
				<option value="4">Quel était le nom de votre école primaire ?</option>
				<option value="5">Quel était le prénom de votre instituteur·trice préféré·e ?</option>
			</select>
			</div>
			<input type="text" id="response" placeholder="Réponse" required />
			<button class="button bg-purple-400 hover:bg-purple-600" type="submit">Envoyer</button>
			</form>
			${backButton()}

		<form id="resetPwdSection" style="display:none;" class="mb-20 flex flex-col items-center text-center mt-8 space-y-4">
		<h1 class="text-4xl">Créer un nouveau mot de passe</h1>
			<input type="password" id="newPassword" placeholder="Nouveau mot de passe" required />
			<input type="password" id="newPasswordVerification" placeholder="Répéter" required />
			<button class="button bg-purple-400 hover:bg-purple-600 mb-16" type="submitNewPwd">Réinitialiser le mot de passe</button>
		</form>
		</section>
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();
		
		
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
