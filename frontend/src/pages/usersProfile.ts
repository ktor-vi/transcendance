import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderUserProfile(ctx: any) {
	console.log("renderUserProfile called");
	try {
		const userName = ctx.params.name;
		const historyRes = await fetch(`/api/user/history/${encodeURIComponent(userName)}`, { method: "GET" });
	
		const res = await fetch(`/api/user/${encodeURIComponent(userName)}`, { method: "GET" });
		if (!res.ok)
		{
			const errorData = await res.json();
			console.log(errorData.message);
			throw new Error(errorData.message || "Erreur inconnue");
		}
		const userData = await res.json();
		
		console.log("User FRONTEND = ");
		console.log(userData.email);

		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML = "<p>Cet utilisateur n'existe pas</p>";
			return;
		}
		const history = await historyRes.json();

		let buttonRequests = `<button id="friendshipButton">Envoyer une demande d'amitié</button>`;

		const us = await fetch("/api/profile", { method: "GET" });
		const usData = await us.json();
		if (userName == usData.name)
			buttonRequests = ""

		const alreadyFriends = await fetch(`/api/friends/isFriend/${encodeURIComponent(userName)}`, { method: "GET" });
		const alreadyFriendsData = await alreadyFriends.json();
		const friendship = alreadyFriendsData.friendship;

		if (friendship == true)
			buttonRequests = `<button id="friendshipButton disabled">Vous êtes déjà amis</button>`;

			const html = `
			<div style="display: flex; flex-direction: column; align-items: center;">
				<h1 style="text-align: center;">Profile de ${userName}</h1>
				 ${buttonRequests}
				<div id="userStatut"></div>
				<img 
				src="${userData.picture}"
				alt="[photo de profil]" 
				style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;"/>
			</div>

			${!history.length ?
				`<p>L'historique apparaîtra quand la personne aura fait au moins 1 match </p>`
			:
				`<table border="1" style="width: 100%; text-align: center;">
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
								<td>
									<a href='/user/${encodeURIComponent(entry.player_1)}' class="bg-transparent text-white m-0 p-2 text-left">${(entry.player_1)}</a>
								</td>
								<td>
									<a href='/user/${encodeURIComponent(entry.player_2)}' class="bg-transparent text-white m-0 p-2 text-left">${(entry.player_2)}</a>
								</td>
								<td>${entry.scores}</td>
								<td>
									<a href='/user/${encodeURIComponent(entry.winner)}' class="bg-transparent text-white m-0 p-2 text-left">${(entry.winner)}</a>
								</td>
								<td>${entry.created_at}</td>
							</tr>
						`).join("")}
					</tbody>
					</table>
				`
			}
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

					if (resRequest.status != 200) {
						const data = await resRequest.json();
						alert(data.message);
						return ;
					} else
						alert(`La demande a bien été envoyée à ${receiver} !`)
			} catch {
				console.error("Erreur lors de l'envoi de la requête");
			}
		});

			const statusContainer = document.getElementById("userStatut");

		if (statusContainer) {
			// créer un conteneur pour aligner l'image et le texte horizontalement
			const statusWrapper = document.createElement("span");
			statusWrapper.style.display = "flex";
			statusWrapper.style.alignItems = "center";
			statusWrapper.style.gap = "6px"; // petit écart entre image et texte

			const statusImg = document.createElement("img");
			statusImg.className = "w-9 h-9"; // largeur/hauteur de l'image

			const statusText = document.createElement("span");

			try {
					const statutRes = await fetch(`/api/user/${encodeURIComponent(userName)}/online`);
					if (!statutRes.ok)
						throw new Error(`Error with HTTP status`);

					const data = await statutRes.json();
					console.log("Réponse statut : ", data);

					if (data.online) {
							statusText.textContent = "Connecté.e";
							statusImg.alt = "Connecté.e";
							statusImg.src = `/images/available.svg`;
					} else {
							statusText.textContent = "Déconnecté.e";
							statusImg.alt = "Déconnecté.e";
							statusImg.src = `/images/disconnected.svg`;
					}

					// ajouter l'image et le texte dans le conteneur
					statusWrapper.appendChild(statusImg);
					statusWrapper.appendChild(statusText);

					// puis ajouter le conteneur dans le DOM
					statusContainer.appendChild(statusWrapper);

			} catch (err) {
					console.error("Erreur avec le statut: ", err);
			}
		}
			setupBackButton();
		} catch (error: any) {
			console.error("Erreur lors du chargement du profil :", error);
			document.getElementById("app")!.innerHTML = 
			`
				<p>Erreur lors du chargement de la page</p>
				<h2 class="text-white text-4xl">${error.message || error}</h2>
				<img src="/images/hellokittysad2.png" class="mx-auto w-48"></img>
			`
			;
	}
}
