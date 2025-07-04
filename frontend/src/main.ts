import page from "page";
import { renderHome } from "./pages/home";
import { renderDashboard } from "./pages/dashboard";
import { renderProfile } from "./pages/profile";
import { renderRegister } from "./pages/register";

// l'objet "document" est un objet natif du navigateur (api du navigateur)
// document est la page sur laquelle on se trouve actuellement
// ici on récupère donc index.html et on dit que app = à celle-ci (grace à la balise app qu'on avait placé dans index.html)
const app = document.getElementById("app");

function render(html: string) 
{
	if (app)
		app.innerHTML = html;
}

// a la page de l'index (/) on va donc "génerer" la homepage définie dans pages/home.ts
page("/", () =>
	render(renderHome()));

// idem si on se retrouve sur la page /dashboard
page("/dashboard", () => 
	render(renderDashboard()));

page("/profile", () => 
	renderProfile());

page("/register", () => 
	renderRegister());

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
	if (target?.id === "logout")
	{
		fetch("api/register", { method: "POST" });
	}
});
