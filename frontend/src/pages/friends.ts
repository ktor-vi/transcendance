import page from "page";
import { backButton, setupBackButton } from '../components/backButton.js';
import { renderError } from '../components/renderError.js';

export async function renderFriends() {
	try {
		//  Fetch pending friend requests
		const resRequests = await fetch("/api/requests", { method: "GET" });
		if (!resRequests.ok) {
			const errorData = await resRequests.json();
			const error = new Error(errorData.error || "Unknown error");
			error.status = errorData.status || resRequests.status;
			throw error;
		}
		const requests = await resRequests.json();

		//  Fetch friends list
		const resFriends = await fetch("/api/friends", { method: "GET" });
		if (!resFriends.ok) {
			const errorData = await resFriends.json();
			const error = new Error(errorData.error || "Unknown error");
			error.status = errorData.status || resFriends.status;
			throw error;
		}
		const friendsData = await resFriends.json();
		const totalFriends = friendsData.total;

		//  Render main HTML
		const html = `
			<h1 style="text-align: center;">Friend Requests:</h1>
 			${requests > 0 ?
				`<p id="requestsMsg">You have ${requests} friend request(s)</p>
				<a href="/friends/requests" data-nav class="inline-block mt-4 px-4 py-2">View requests</a>`
				: `<p>You have no friend requests</p>`
			}
			<h1 style="text-align: center;">Friends List</h1>
			${totalFriends === 0 ?
				`<p>You have no friends</p>
				<img src="/images/hellokittysad1.png" alt="No friends" class="w-20 mx-auto"></img>`
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

			//  Render table header
			const header: HTMLLIElement = document.createElement("li");
			header.className = "grid grid-cols-[1fr_auto_1fr] items-center p-2 border-b font-bold";

			const h1 = document.createElement("span");
			h1.textContent = "Name";
			h1.className = "text-left";

			const h2 = document.createElement("span");
			h2.textContent = "Status";
			h2.className = "text-center";

			const h3 = document.createElement("span");
			h3.textContent = "Friends since";
			h3.className = "text-right";

			header.appendChild(h1);
			header.appendChild(h2);
			header.appendChild(h3);
			listFriends.appendChild(header);

			//  Render each friend
			for (const friend of friends) {
				const li = document.createElement("li");
				li.className = "grid grid-cols-[1fr_auto_1fr] items-center p-2 border-b";

				const span1 = document.createElement("a");
				span1.href = `/user/${encodeURIComponent(friend.friend_name)}`;
				span1.textContent = friend.friend_name;
				span1.className = "bg-transparent font-bold m-0 p-2 text-left";

				const statusContainer = document.createElement("div");
				statusContainer.className = "flex items-center gap-2 justify-center";

				const status = document.createElement("img");
				const statusText = document.createElement("span");
				statusText.className = "text-white";

				try {
					//  Fetch online status for each friend
					const statusRes = await fetch(`/api/user/${encodeURIComponent(friend.friend_name)}/online`, { method: "GET" });
					if (!statusRes.ok) throw new Error("Failed to fetch status");
					const data = await statusRes.json();

					if (data.online) {
						status.src = `public/images/available.svg`;
						status.alt = "Online";
						statusText.textContent = "Online";
					} else {
						status.src = `public/images/disconnected.svg`;
						status.alt = "Offline";
						statusText.textContent = "Offline";
					}
				} catch (err) {
					status.src = `public/images/disconnected.svg`;
					status.alt = "Offline";
					statusText.textContent = "Offline";
				}

				status.className = "w-7 shrink-0";
				statusContainer.appendChild(status);
				statusContainer.appendChild(statusText);

				const span2 = document.createElement("span");
				span2.textContent = friend.friends_since;
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

