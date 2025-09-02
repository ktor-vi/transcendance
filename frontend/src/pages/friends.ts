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
	const friendsData = await resFriends.json();
	const totalFriends = friendsData.total;	

	const html = `
		<h1 style="text-align: center;">Demandes d'amis :</h1>
 		${requests > 0 ?
			`<p id="requestsMsg">Vous avez ${requests} demande(s) d'amis</p>
			<a href="/friends/requests" data-nav class="inline-block mt-4 px-4 py-2">Voir les demandes</a>`
			: `<p>Vous n'avez aucune demande d'amis</p>`
		}
		<h1 style="text-align: center;">Liste d'amis</h1>
		${totalFriends === 0 ?
			`<p>Vous n'avez pas d'amis</p>
			<img src="/images/hellokittysad1.png" alt=":-(" class="w-20 mx-auto"></img>
			`
			: `<ul id="friendsList" style="background: none;"></ul>`
		}
		${backButton()}
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();

		const listFriends = document.getElementById("friendsList");
		const friends = friendsData.friends;


		
		if (listFriends) {
			listFriends.innerHTML = "";
			
			const header: HTMLLIElement = document.createElement("li");
			header.className = "grid grid-cols-[1fr_auto_1fr] items-center p-2 border-b font-bold";

			const h1: HTMLSpanElement = document.createElement("span");
			h1.textContent = "Nom";
			h1.className = "text-left";

			const h2: HTMLSpanElement = document.createElement("span");
			h2.textContent = "Statut";
			h2.className = "text-center";

			const h3: HTMLSpanElement = document.createElement("span");
			h3.textContent = "Ami depuis le";
			h3.className = "text-right";

			header.appendChild(h1);
			header.appendChild(h2);
			header.appendChild(h3);
			listFriends.appendChild(header);

			for (const friend of friends) {
				const li = document.createElement("li");
				li.className = "grid grid-cols-[1fr_auto_1fr] items-center p-2 border-b";

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
}
