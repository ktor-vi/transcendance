import page from "page";

export function renderRegister() {
	const html = `
	<h1>Créer un compte</h1>
		<form id="registerForm">
			<input type="text" id="name" placeholder="Pseudo" required />
			<input type="email" id="email" placeholder="Email" required />
			<input type="password" id="password" placeholder="Mot de passe" required />
			<button type="submit">S'inscrire</button>
		</form>
	`;

	document.getElementById("app")!.innerHTML = html;
	document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
		e.preventDefault();
		console.log("🟢 submit handler fired !!!!!!");
		const name = (document.getElementById("name") as HTMLInputElement).value;
		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;

		const res = await fetch("/register", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ name, email, password }),
		});
		console.log("🟢 submit handler returned !!!!!!");
		if (res.ok) {
			alert("Compte créé, tu peux maintenant te connecter!");
			// page.redirect("/");
		} else {
			const err = await res.json();
			alert(err.error || "Erreur pendant l'inscription");
		}
	});
}