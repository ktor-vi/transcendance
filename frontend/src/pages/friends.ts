import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderFriends() {

	const resRequests = await fetch("/api/requests", { method: "GET" });
		
		if (!resRequests.ok) {
			document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
			return;
		}

	let	requests = await resRequests.json();

	const resFriends = await fetch("/api/friends", { method: "GET" });

	const html = `
		<h1 style="text-align: center;">Demandes d'amis :</h1>
		${requests > 0 ? `<p id="requestsMsg">Vous avez ${requests} demande(s) d'amis</p>
		<a href="/friends/requests" data-nav class="inline-block mt-4 px-4 py-2">Voir les demandes</a>`
		: `<p>Vous n'avez aucune demande d'amis</p>`}
		<h1 style="text-align: center;">Liste d'amis</h1>
		<ul id="friendsList" style="background: none;"></ul>
		${backButton()}
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();

		const listFriends = document.getElementById("friendsList");
		const friendsData = await resFriends.json();
		const friends = friendsData.friends;

		console.log("Mes amis: ");
		console.log(friends);


		if (listFriends) {
			listFriends.innerHTML = "";
			for (const friend of friends) {
				const li = document.createElement("li");
				li.textContent = `${friend.friend_name}`;
				listFriends.appendChild(li);
			}
		}
}
