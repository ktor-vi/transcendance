import page from "page";

// chatButton renvoie simplement le html du bouton
export function chatButton(name: string) {
	return `<button id="goChat">Chat with ${name} </button>`
}

// setupChatButton sert à "surveiller" si on clique sur le bouton
// et agir en conséquences
// on chope l'élément html ayant la balise "goChat", et si on clique dessus
// on renvoie simplement à history.back(), qui vient de l'api native de javaScript
// le ? vérifie si l'élément existe (sinon getElementById renvoie null)
export function setupChatButton(name: string) {
	document.getElementById("goChat")?.addEventListener("click", () => {
		page(`/chat/${name}`);
	});
}
