import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

export async function renderFriendsRequests() {
	
		const html = `
		<h1 style="text-align: center;">Demandes d'amis :</h1>
		<ul id="requestsList" style="background: none;"></ul>
		${backButton()}
		`;

		document.getElementById("app")!.innerHTML = html;
		setupBackButton();

		const resRequests = await fetch("/api/friends/requests", { method: "GET" });

		const listRequests = document.getElementById("requestsList");
		const requestsData = await resRequests.json();

		console.log("data = ");
		console.log(requestsData);

		if (listRequests) {
			listRequests.innerHTML = "";
			for (const line of requestsData) {
				const li = document.createElement("li");
				li.className = "flex items-center justify-between p-2 border-b";

				const span1 = document.createElement("span");
				span1.textContent = `${line.sender_name}`;

				const span2 = document.createElement("span");
				span2.textContent = `${line.request_date}`;

				const divButtons = document.createElement("div");

				const accept = document.createElement("button");
				accept.className = "icons-btn";
				accept.innerHTML = `<img src="/images/ok-svgrepo-com.svg" alt="Accepter" class="w-10">`;

				const decline = document.createElement("button");
				decline.className = "icons-btn";
				decline.innerHTML = `<img src="/images/cancel-svgrepo-com.svg" alt="Refuser" class="w-10">`;


				divButtons.appendChild(accept);
				divButtons.appendChild(decline);

				li.appendChild(span1);
				li.appendChild(span2);
				li.appendChild(divButtons);

				listRequests.appendChild(li);
			}
		}


}