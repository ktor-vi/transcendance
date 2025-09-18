import page from "page";
import { backButton, setupBackButton } from '../components/backButton.js';

export function renderLogin() {
	// Render login form
	const html = `
		<h1>Login</h1>
		<form id="loginForm">
			<input type="email" id="email" placeholder="Email" required/>
			<input type="password" id="password" placeholder="Password" required/>
			<button id="login" data-nav>Sign In</button>
		</form>
		${backButton()}
	`;

	document.getElementById("app")!.innerHTML = html;
	setupBackButton();

	// Handle login form submit
	document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
		e.preventDefault();

		const email = (document.getElementById("email") as HTMLInputElement).value;
		const password = (document.getElementById("password") as HTMLInputElement).value;

		const res = await fetch("api/login", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ email, password }),
		});

		if (res.status === 401) {
			const data = await res.json();
			alert(data.message);
			return;
		} else {
			// Navigate to dashboard on successful login
			page("/dashboard");
		}
	});
}

