import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderFriends() {

	const res = await fetch("/api/requests", { method: "GET" });
		
		if (!res.ok) {
			document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
			return;
		}

let	requests = await res.json();

const html = `
		<h1 style="text-align: center;">Liste d'amis</h1>
		<h1 style="text-align: center;">Demandes d'amis :</h1>
		${requests > 0 ? `<p id="requestsMsg">Vous avez ${requests} demande(s) d'amis</p>` : `<p>Vous n'avez aucune demande d'amis</p>`}
		${backButton()}
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();
}
