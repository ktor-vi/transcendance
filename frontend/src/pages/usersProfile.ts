import page from "page";

import { backButtonArrow, setupBackButton } from '../components/backButton.js';
import { renderError } from '../components/renderError.js';
import { renderDmChat, initDmChat } from './dmChat';

interface CustomError {
  status?: number;
}
// Render user profile page
export async function renderUserProfile(ctx: any) {
	try {
		const userName = ctx.params.name;

		// Fetch user profile data
		const res = await fetch(`/api/user/${encodeURIComponent(userName)}`, { method: "GET" });
		if (!res.ok) {
			const errorData = await res.json();
			const error = new Error(errorData.error || "Unknown error") as CustomError;
			error.status = errorData.status || res.status;
			throw error;
		}

		const historyRes = await fetch(`/api/user/history/${encodeURIComponent(userName)}`, { method: "GET" });
		const userData = await res.json();

		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML =
			`
			<section class="flex flex-col items-center text-center">
			<div class="mt-16">
			<p class="text-white text-1xl">Erreur lors du chargement de la page</p>
			<h2 class="text-white text-9xl">404</h2>
				<p class="text-white text-2xl">Cet utilisateur n'existe pas</p>
				<img src="/images/hellokittysad2.png" class="mx-auto w-48"></img>
			</div>
			</section>
			`;
			return;
		}
		const historyData = await historyRes.json();
		const history = historyData.history;
		const wins = historyData.wins;
		const plays = historyData.plays;
		const ratio = historyData.ratio;

		let buttonRequests = `<button class="button bg-purple-300 hover:bg-purple-400" id="friendshipButton">Envoyer une demande d'amitié</button>`;

		const us = await fetch("/api/profile", { method: "GET" });
		const usData = await us.json();

		if (userName === usData.name) buttonRequests = "";

		const alreadyFriends = await fetch(`/api/friends/isFriend/${encodeURIComponent(userName)}`, { method: "GET" });
		const alreadyFriendsData = await alreadyFriends.json();
		const friendship = alreadyFriendsData.friendship;

		if (friendship == true)
			buttonRequests = `<button id="friendshipButton disabled">Vous êtes déjà amis</button>`;

		if (userName !== usData.name) {
			buttonRequests += `<button id="dmButton" class="button bg-indigo-400 hover:bg-indigo-500 mb-4 mt-4 text-xs h-8">ENVOYER UN MESSAGE</button>`;
		}


			const html = `
				<script>0</script>
			 <section class="flex flex-col items-center text-center">
			<div class="self-start ml-16 mt-12">
				${backButtonArrow()}
			</div>
				<h1 class="text-4xl mb-4">${userName}</h1>
				${buttonRequests}
				<div class="flex items-center gap-4" id="userStatut"></div>
					<img 
					src="${userData.picture}"
					alt="[photo de profil]"
					class="flex items-center w-[150px] h-[150px] object-cover rounded-full shadow-lg"
				/>

			${
        !history.length
          ? `<p class="mt-8 text-xl">Les stats et l'historique <br>apparaîtront quand ${userName} aura fait au moins 1 match </p>
				<img class="w-48" src="/images/hellokittytired.png" alt="Hello Kitty fatiguée"/>`
          : `
				<div id="stats">
				<h1 class="text-2xl mt-8 mb-4">STATS</h1>
  					<table class="stats-table w-[270px] mx-auto">
						<tbody>
							<tr>
								<th class="pr-4 text-right font-bold">Victoires</th>
								<td class="text-left">${wins}</td>
							</tr>
							<tr>
								<th class="pr-4 text-right font-bold">Parties jouées</th>
								<td class="text-left">${plays}</td>
							</tr>
							<tr>
								<th class="pr-4 text-right font-bold">Ratio de victoires</th>
								<td class="text-left">${ratio}%</td>
							</tr>
						</tbody>
					</table>
				</div>
					<h1 class="text-2xl mt-8 mb-4">HISTORIQUE</h1>
					<table class="history-table mb-24">
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
						${history
              .map(
                (entry: any) => `
						<tr class="h-12 border-b-2 border-white">
							<td>${entry.type}</td>
							<td>
							<a href='/user/${encodeURIComponent(entry.player_1)}'>${entry.player_1}</a>
							</td>
							<td>
							<a href='/user/${encodeURIComponent(entry.player_2)}'>${entry.player_2}</a>
							</td>
							<td>${entry.scores}</td>
							<td>
							<a href='/user/${encodeURIComponent(entry.winner)}'>${entry.winner}</a>
							</td>
							<td>${entry.created_at}</td>
						</tr>
						`
              )
              .join("")}
					</tbody>
					</table>
				`
      }
				</section>
			`;

		document.getElementById("app")!.innerHTML = html;

		// Friendship button click
		document.getElementById("friendshipButton")?.addEventListener("click", async () => {
			try {
				const receiver = userName;
				const resRequest = await fetch("/api/friendshipButton", { method: "POST", body: receiver });
				if (resRequest.status !== 200) {
					const data = await resRequest.json();
					alert(data.message);
				} else {
					alert(`Demande d'ami envoyée à ${receiver}!`);
				}
			} catch {
				console.error("Error sending request");
			}
		});

		// DM button click
		const dmButton = document.getElementById("dmButton");
		if (dmButton) {
			dmButton.addEventListener("click", async () => {
				const app = document.getElementById("app");
				if (!app) return;

				try {
					const res = await fetch(`/api/user/${encodeURIComponent(userName)}`);
					const userData = await res.json();
					const receiverId = userData.id;

					const meRes = await fetch("/api/me");
					const meData = await meRes.json();
					const senderId = meData.id;

					app.innerHTML = renderDmChat(userName);
					initDmChat(receiverId, senderId);
				} catch (error) {
					console.error("DM initialization error:", error);
					alert("Error opening private chat");
				}
			});
		}

		// Display user online status
		const statusContainer = document.getElementById("userStatut");
		if (statusContainer) {
			const statusWrapper = document.createElement("span");
			const statusImg = document.createElement("img");
			statusImg.className = "w-9 h-9";

			const statusText = document.createElement("span");
			try {
				const statutRes = await fetch(`/api/user/${encodeURIComponent(userName)}/online`);
				if (!statutRes.ok) throw new Error(`Error with HTTP status`);
				const data = await statutRes.json();

					statusImg.alt = data.online ? "Connecté.e" : "Déconnecté.e";
					statusImg.src = data.online ? "/images/available.svg" : "/images/disconnected.svg";
					statusText.textContent = data.online ? "Connecté.e" : "Déconnecté.e";

					// ajouter l'image et le texte dans le conteneur
					statusWrapper.appendChild(statusImg);
					statusWrapper.appendChild(statusText);
					statusWrapper.className = "inline-flex items-center gap-2 text-white mt-4";

					// puis ajouter le conteneur dans le DOM
					statusContainer.appendChild(statusWrapper);

			} catch (err) {
					console.error("Erreur avec le statut: ", err);
			}
		}
			setupBackButton();
		} catch (error: any) {
			renderError(error);
	}
}
