import page from "page";
import { backButton, setupBackButton } from '../components/backButton.js';

export function renderNotFound() {
	// Render 404 page
	const html = `
		<p class="text-white text-1xl">Error loading page</p>
		<h2 class="text-white text-9xl">404</h2>
		<p class="text-white text-2xl">This page does not exist</p>
		<img src="/images/hellokittysad3.png" class="mx-auto w-48" />
	`;

	document.getElementById("app")!.innerHTML = html;
	setupBackButton();
}
