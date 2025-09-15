import page from "page";

import { backButton, backButtonArrow, setupBackButton } from '../components/backButton.js';
import { renderError } from '../components/renderError.js';

export async function renderFriends() {
	try
	{
		const resRequests = await fetch("/api/requests", { method: "GET" });

			if (!resRequests.ok) {
				const errorData = await resRequests.json();
				const error = new Error(errorData.error || "Erreur inconnue");
				error.status = errorData.status || resRequests.status;
				throw error;
		}

		let	requests = await resRequests.json();

		const resFriends = await fetch("/api/friends", { method: "GET" });
		if (!resFriends.ok)	{
				const errorData = await resFriends.json();
				const error = new Error(errorData.error || "Erreur inconnue");
				error.status = errorData.status || resFriends.status;
				throw error;
		}
		const friendsData = await resFriends.json();
		const totalFriends = friendsData.total;	

		const html = `
			<section class="flex flex-col items-center text-center">
				 <div class="self-start ml-16 mt-12">
    				${backButtonArrow()}
 				 </div>
				<h1 class="text-4xl mt-4 mb-4">DEMANDES D'AMIS</h1>
 				${requests > 0 ?
					`<h3 id="requestsMsg">Vous avez ${requests} demande(s) d'amis</h3>
					<a class="button bg-purple-300 hover:bg-purple-400 mt-4 h-8 w-60 text-xs" href="/friends/requests" data-nav>Voir les demandes</a>`
					: `<h3>Vous n'avez aucune demande d'amis</h3>`
				}
				<h1 class="text-4xl mt-16">LISTE D'AMIS</h1>
				${totalFriends === 0 ?
					`<h3 class="mt-4">Vous n'avez pas d'amis</h3>
					<img class="w-60" src="/images/hellokittysad1.png" alt=":-("></img>
					`
					: `<ul class="w-3/4 mx-auto" id="friendsList"></ul>`
				}
			</section>
			`;

			document.getElementById("app")!.innerHTML = html;
			setupBackButton();

			const listFriends = document.getElementById("friendsList");
			const friends = friendsData.friends;



			if (listFriends) {
				listFriends.innerHTML = "";

				const header: HTMLLIElement = document.createElement("li");
				header.className = "columns-title mt-4";

				const h1: HTMLSpanElement = document.createElement("span");
				h1.textContent = "NOM";
				h1.className = "text-left";

				const h2: HTMLSpanElement = document.createElement("span");
				h2.textContent = "STATUT";
				h2.className = "text-center";

				const h3: HTMLSpanElement = document.createElement("span");
				h3.textContent = "AMI.E.S DEPUIS LE";
				h3.className = "text-right";

				header.appendChild(h1);
				header.appendChild(h2);
				header.appendChild(h3);
				listFriends.appendChild(header);

				for (const friend of friends) {
					const li = document.createElement("li");
					li.className = "grid grid-cols-[1fr_auto_1fr] items-center p-2 border-b-2 border-white";

					const span1 = document.createElement("a");
					span1.href = `/user/${encodeURIComponent(friend.friend_name)}`;
					span1.textContent = `${friend.friend_name}`;
					span1.className = "bg-transparent font-bold m-0 p-2 text-left";

					const statusContainer = document.createElement("div");
					statusContainer.className = "flex items-center gap-2 justify-center";

					const status = document.createElement("img");
					const statusText = document.createElement("span");
					statusText.className = "text-white";
					try {
						const statutRes = await fetch(`/api/user/${encodeURIComponent(friend.friend_name)}/online`, { method: "GET" });

						if (!statutRes.ok)
							throw new Error(`Error with http status`);
						const data = await statutRes.json();
						console.log("Réponse statut : ", data);

						if (data.online)
						{
							status.src = `public/images/available.svg`;
							status.alt = "Connecté.e";
							statusText.textContent = "Connecté.e";
						}
						else
						{
							status.src = `public/images/disconnected.svg`;
							status.alt = "Déconnecté.e";
							statusText.textContent = "Déconnecté.e";
						}
						statusContainer.appendChild(status);
						statusContainer.appendChild(statusText);
					} catch (err) {
						console.error("Erreur avec le statut: ", err);
					}
					status.className = "w-7 shrink-0";

					const span2 = document.createElement("span");
					span2.textContent = `${friend.friends_since}`;
					span2.className = "text-right text-white";

					li.appendChild(span1);
					li.appendChild(statusContainer);
					li.appendChild(span2);

					listFriends.appendChild(li);
				}
			}
	} catch (error: any) {
		renderError(error);
	}
}
