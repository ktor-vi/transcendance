import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderUserProfile(ctx: any) {
	console.log("renderUserProfile called");
	try {
		const userName = ctx.params.name;
		const historyRes = await fetch(`api/user/${encodeURIComponent(userName)}`, { method: "GET" });

		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML = "<p>Cet utilisateur n'existe pas</p>";
			return;
		}
		const history = await historyRes.json();

		const html = `
		<h1 style="text-align: center;">Profile de ${userName}</h1>
		<table border="1" style="width: 100%; text-align: center;">
			<thead>
				<tr>
					<th>Type</th>
					<th>Joueur 1</th>
					<th>Joueur 2</th>
					<th>Score</th>
					<th>Vainqueur</th>
					<th>Date</th>
				</tr>
			</thead>
			<tbody>
				${history.map((entry: any) => `
					<tr>
						<td>${entry.type}</td>
						<td>${entry.player_1}</td>
						<td>${entry.player_2}</td>
						<td>${entry.scores}</td>
						<td>${entry.winner}</td>
						<td>${new Date(entry.created_at).toLocaleString()}</td>
					</tr>
				`).join("")}
			</tbody>
			</table>
			${backButton()}
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();
	} catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
	}
}
