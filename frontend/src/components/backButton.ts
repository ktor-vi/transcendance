import page from "page";
import { resetDashboard } from "../pages/pong";


// &lt = le caractère "<"
// backButton renvoie simplement le html du bouton
export function backButton() {
	return '<button class="back-button" id="goBack">Retour</button>'
}

export function backButtonArrow() {
	return '<button class="back-button-arrow" id="goBack">Retour</button>'
}

// setupBackButton sert à "surveiller" si on clique sur le bouton
// et agir en conséquences
// on chope l'élément html ayant la balise "goBack", et si on clique dessus
// on renvoie simplement à history.back(), qui vient de l'api native de javaScript
// le ? vérifie si l'élément existe (sinon getElementById renvoie null)
export function setupBackButton() {
	document.getElementById("goBack")?.addEventListener("click", (e) => {
		e.preventDefault();

		const currentPath = window.location.pathname;

		if (currentPath == "/friends/requests")
		{
			page("/friends");
			return ;
		}
		if (currentPath === "/tournament" || currentPath === "/keyboard-play")
		{
			page("/pong");
			return ;
		}
		if (currentPath.startsWith("/user/"))
		{
			page("/users-list");
			return ;
		}
		if (currentPath === ("/pong"))
			resetDashboard();
		page("/dashboard");
	});
}