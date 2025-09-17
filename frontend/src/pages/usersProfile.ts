import page from "page";
import { renderDmChat, initDmChat } from './dmChat';
import { backButton, setupBackButton } from '../components/backButton.js';
import { renderError } from '../components/renderError.js';

// Render user profile page
export async function renderUserProfile(ctx: any) {
	try {
		const userName = ctx.params.name;

		// Fetch user profile data
		const res = await fetch(`/api/user/${encodeURIComponent(userName)}`, { method: "GET" });
		if (!res.ok) {
			const errorData = await res.json();
			const error = new Error(errorData.error || "Unknown error");
			error.status = errorData.status || res.status;
			throw error;
		}

		const historyRes = await fetch(`/api/user/history/${encodeURIComponent(userName)}`, { method: "GET" });
		const userData = await res.json();

		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML = `
				<p class="text-white text-1xl">Error loading page</p>
				<h2 class="text-white text-9xl">404</h2>
				<p class="text-white text-2xl">User does not exist</p>
				<img src="/images/hellokittysad2.png" class="mx-auto w-48"></img>
			`;
			return;
		}

		const history = await historyRes.json();

		// Friendship button logic
		let buttonRequests = `<button id="friendshipButton">Send Friend Request</button>`;
		const us = await fetch("/api/profile", { method: "GET" });
		const usData = await us.json();

		if (userName === usData.name) buttonRequests = "";

		const alreadyFriends = await fetch(`/api/friends/isFriend/${encodeURIComponent(userName)}`, { method: "GET" });
		const alreadyFriendsData = await alreadyFriends.json();
		if (alreadyFriendsData.friendship) buttonRequests = `<button id="friendshipButton" disabled>Already Friends</button>`;

		// DM button for other users
		if (userName !== usData.name) {
			buttonRequests += `<button id="dmButton" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded ml-2">Send Private Message</button>`;
		}

		// HTML template
		const html = `
		<div style="display: flex; flex-direction: column; align-items: center;">
			<h1 style="text-align: center;">Profile of ${userName}</h1>
			${buttonRequests}
			<div id="userStatut"></div>
			<img src="${userData.picture}" alt="[profile picture]" style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;"/>
		</div>
		${!history.length ?
			`<p>History will appear after the user has played at least 1 match</p>` :
			`<table border="1" style="width: 100%; text-align: center;">
				<thead>
					<tr>
						<th>Type</th>
						<th>Player 1</th>
						<th>Player 2</th>
						<th>Score</th>
						<th>Winner</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					${history.map((entry: any) => `
						<tr>
							<td>${entry.type}</td>
							<td><a href='/user/${encodeURIComponent(entry.player_1)}' class="bg-transparent text-white m-0 p-2 text-left">${entry.player_1}</a></td>
							<td><a href='/user/${encodeURIComponent(entry.player_2)}' class="bg-transparent text-white m-0 p-2 text-left">${entry.player_2}</a></td>
							<td>${entry.scores}</td>
							<td><a href='/user/${encodeURIComponent(entry.winner)}' class="bg-transparent text-white m-0 p-2 text-left">${entry.winner}</a></td>
							<td>${entry.created_at}</td>
						</tr>
					`).join("")}
				</tbody>
			</table>`
		}
		${backButton()}
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
					alert(`Friend request sent to ${receiver}!`);
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
			statusWrapper.style.display = "flex";
			statusWrapper.style.alignItems = "center";
			statusWrapper.style.gap = "6px";

			const statusImg = document.createElement("img");
			statusImg.className = "w-9 h-9";

			const statusText = document.createElement("span");
			try {
				const statutRes = await fetch(`/api/user/${encodeURIComponent(userName)}/online`);
				if (!statutRes.ok) throw new Error(`Error with HTTP status`);
				const data = await statutRes.json();

				if (data.online) {
					statusText.textContent = "Online";
					statusImg.alt = "Online";
					statusImg.src = `/images/available.svg`;

		} else {
                    statusText.textContent = "Déconnecté.e";
                    statusImg.alt = "Déconnecté.e";
                    statusImg.src = `/images/disconnected.svg`;
                }
                statusWrapper.appendChild(statusImg);
                statusWrapper.appendChild(statusText);
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
