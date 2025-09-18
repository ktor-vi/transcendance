import page from "page";
import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderForgotPwd() {
	try {
		const html = `
		<h1 style="text-align: center;">Mot de passe oublié</h1>
		<form id="forgotForm"
			style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 50vh;">
			<input type="text" id="email" placeholder="Email" required />
			<label for="questions">Choose a security question</label>
			<select id="questions">
				<option></option>
				<option value="1">Quel est le nom de ton premier animal de compagnie ?</option>
				<option value="2">Quel est le premier jeu-vidéo auquel tu as joué ?</option>
				<option value="3">Quel est le prénom de votre meilleur·e ami·e d'enfance ?</option>
				<option value="4">Quel était le nom de votre école primaire ?</option>
				<option value="5">Quel était le prénom de votre instituteur·trice préféré·e ?</option>
			</select>
			<input type="text" id="response" placeholder="Réponse" required />
			<button type="submit">Send</button>
		</form>
		${backButton()}

		<form id="resetPwdSection" style="display:none;">
			<h2>Create a new password</h2>
			<input type="password" id="newPassword" placeholder="New password" required />
			<input type="password" id="newPasswordVerification" placeholder="Repeat" required />
			<button type="submitNewPwd">Reset password</button>
		</form>
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();

		// Handle forgot password form submission
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

			if (res.status === 400 || res.status === 401) {
				alert(data.message);
				return;
			}

			alert("Information verified. You can now reset your password.");
			(document.getElementById("resetPwdSection") as HTMLElement).style.display = "";
		});

		// Handle reset password form submission
		document.getElementById("resetPwdSection")?.addEventListener("submit", async (e) => {
			e.preventDefault();

			const email = (document.getElementById("email") as HTMLInputElement).value;
			const newPwd = (document.getElementById("newPassword") as HTMLInputElement).value;
			const newPwdVerif = (document.getElementById("newPasswordVerification") as HTMLInputElement).value;

			if (newPwd !== newPwdVerif) {
				alert("Passwords do not match");
				return;
			}

			const res = await fetch("api/resetPassword", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, newPwd }),
			});

			const data = await res.json();

			if (res.status === 401) {
				alert(data.message);
				return;
			}

			alert("Password successfully reset. You can now log in.");
			page("/");
		});

	} catch (err) {
		console.error("Error rendering forgot password page:", err);
	}
}

