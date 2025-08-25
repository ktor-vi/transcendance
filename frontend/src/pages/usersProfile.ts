import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderUserProfile(ctx: any) {
	console.log("renderUserProfile called");
	try {
		const userName = ctx.params.name;
		const historyRes = await fetch(`api/user/history/${encodeURIComponent(userName)}`, { method: "GET" });
		
		const res = await fetch(`/api/user/${encodeURIComponent(userName)}`, { method: "GET" });
		const userData = await res.json();
		
		console.log("User FRONTEND = ");
		console.log(userData.email);

		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML = "<p>Cet utilisateur n'existe pas</p>";
			return;
		}
		const history = await historyRes.json();

		const us = await fetch("/api/profile", { method: "GET" });
		const usData = await us.json();
		let shouldShowButton = true;
		if (userName == usData.name)
			shouldShowButton = false;

		const html = `
		<div style="display: flex; flex-direction: column; align-items: center;">
			<h1 style="text-align: center;">Profile de ${userName}</h1>
			 ${shouldShowButton ? `<button id="friendshipButton">Envoyer une demande d'amitié</button>` : ""}
			<span id="userStatut"></span>
			<img 
			src="${userData.picture}" 
			alt="default" 
			style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;"/>
		</div>

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

		document.getElementById("friendshipButton")?.addEventListener("click", async() =>
		{
			try {
				const receiver = userName;
				const resRequest =
				await fetch("/api/friendshipButton", { 
					method: "POST",
					body: receiver
				});
			if (resRequest.status === 409) {
				const data = await resRequest.json();
				alert(data.message);
				return ;
			}
			else
				alert(`La demande a bien été envoyée à ${receiver} !`)

			} catch {
				console.error("Erreur lors de l'envoi de la requête");
			}
		});

		const statut = document.getElementById("userStatut");
		if (statut)
		{
			try {
				const statutRes = await fetch(`/api/user/${encodeURIComponent(userName)}/online`, { method: "GET" });
				if (!statutRes.ok)
				    throw new Error(`Error with http status`);
				const data = await statutRes.json();
				console.log("Réponse statut : ", data);
				
				if (data.online)
				    statut.textContent = "Connecté";
				else
				    statut.textContent = "Déconnecté";
				
			} catch (err) {
				console.error("Erreur avec le statut: ", err);
			}

		}
		setupBackButton();
	} catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur lors du chargement de la page</p>";
	}
}
