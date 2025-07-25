import page from "page";

// &lt = le caractère "<"
// backButton renvoie simplement le html du bouton
export function backButton() {
	return '<button id="goBack">&lt Go back</button>'
}

// setupBackButton sert à "surveiller" si on clique sur le bouton
// et agir en conséquences
// on chope l'élément html ayant la balise "goBack", et si on clique dessus
// on renvoie simplement à history.back(), qui vient de l'api native de javaScript
// le ? vérifie si l'élément existe (sinon getElementById renvoie null)
export function setupBackButton() {
	document.getElementById("goBack")?.addEventListener("click", () => {
		if (window.location.pathname === "/profile") {
      		page("/dashboard");
    	} else {
			page.back();
		}
	});
	
}