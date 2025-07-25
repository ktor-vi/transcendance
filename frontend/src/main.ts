// Importe la bibliothèque "page.js", un mini routeur client-side pour Single Page Applications (SPA)
import page from "page";
import { renderHome } from "./pages/home";
import { renderDashboard } from "./pages/dashboard";
import { renderKeyboardPlay } from "./pages/keyboardPlay";
import { renderProfile } from "./pages/profile";
import { renderRegister } from "./pages/register";
import { renderLogin } from "./pages/login";
import { renderForgotPwd } from "./pages/forgotPassword";
// 🔽 Récupère la référence à l'élément HTML avec l'ID "app"
// C'est dans cet élément que les pages seront affichées dynamiquement
const app = document.getElementById("app");

// Fonction utilitaire qui insère du HTML dans #app
function render(html: string) {
  if (app) app.innerHTML = html;
}

// Définition des routes avec page.js

// Route pour la page d'accueil ("/") → appelle renderHome() et injecte son HTML
page("/", () => render(renderHome()));

// Route pour le tableau de bord ("/dashboard") → appelle renderDashboard() et injecte son HTML
page("/dashboard", () => render(renderDashboard()));
page("/profile", () => 
	renderProfile());

page("/register", () => 
	renderRegister());

page("/login", () => 
	renderLogin());

page("/forgotPassword", () => 
	renderForgotPwd());
page("/keyboard-play", () => render(renderKeyboardPlay()))
// Lance le routeur (écoute les changements de l'URL sans recharger la page)
// a la page de l'index (/) on va donc "génerer" la homepage définie dans pages/home.ts


// page a été importé sur ce fichier. il sert à "écouter" et à gérer la navigation
// de notre appli sans recharger toute la page à chaque fois
page();

// document est la page sur laquelle on se trouve actuellement. ici, comme on est passé
// de index.html à main.ts, qui lui même a chargé home.ts, document = home.ts
// on va donc "surveiller" la page home.ts pour savoir si on a cliqué sur le bouton 
// pour se connecter avec Google, ou sur dashboard si on a cliqué sur un des boutons
document.addEventListener("click", (event) =>
{
	const target = event.target as HTMLElement;

	if (target?.id === "google-sign-in")
	{
		window.location.href = "/api/login/google";
	}

	if (target?.id === "logout")
	{
		fetch("/logout", { method: "POST" }).then(() =>
		{
			page.redirect("/");
		});
	}
});
