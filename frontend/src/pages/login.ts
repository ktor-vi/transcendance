import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export function renderLogin() {
	const html = `
	<section class="flex flex-col items-center text-center">
	<img src="/images/hellokittycomputer.png" class="hellokitty-computer">
		<h1 class="text-4xl">CONNECTEZ-VOUS</h1>
		<form class="flex flex-col items-center text-center mt-4" id="loginForm">
			<input class="mt-4" type="email" id="email" placeholder="Email" required/>
			<input class="mt-4" type="password" id="password" placeholder="Mot de passe" required/>
		<div class="mt-8">
			<button class="button bg-purple-400 hover:bg-purple-600" id="login" data-nav>Se connecter</button>
		</div>
		</form>
		${backButton()}
		</section>
	`;

	document.getElementById("app")!.innerHTML = html;
	setupBackButton();
	document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
		e.preventDefault();
		const email = (document.getElementById("email") as HTMLInputElement).value;	const password = (document.getElementById("password") as HTMLInputElement).value;

		const res = await fetch("api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});
		if (res.status === 401) {
				const data = await res.json();
				alert(data.message);
				return ;
		} else {
			page("/dashboard");
		}
	});
}