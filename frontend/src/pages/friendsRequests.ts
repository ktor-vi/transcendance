import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderFriendsRequests() {
	
		const html = `
		<h1 style="text-align: center;">Demandes d'amis :</h1>
		${backButton()}
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();

}