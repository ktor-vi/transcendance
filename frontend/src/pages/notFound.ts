import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export function renderNotFound() {
	const html =
	`
		<p class="text-white text-1xl">Erreur lors du chargement de la page</p>
		<h2 class="text-white text-9xl">404</h2>
		<p class="text-white text-2xl">Cette page n'existe pas</p>
		<img src="/images/hellokittysad3.png" class="mx-auto w-48"></img>
	`;

	document.getElementById("app")!.innerHTML = html;
	setupBackButton();
}