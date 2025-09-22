import page from "page";

import { backButtonArrow, setupBackButton } from '../components/backButton.js';
import { renderError } from '../components/renderError.js';

export async function renderFriendsRequests() {
	
	try {
			const resRequests = await fetch("/api/friends/requests", { method: "GET" });
			if (!resRequests.ok) {
				const errorData = await resRequests.json();
				const error = new Error(errorData.error || "Erreur inconnue");
				// error.status = errorData.status || resRequests.status;
				throw error;
			}
		
			const html = `
				<script>0</script>
			<section class="flex flex-col items-center text-center">
				 <div class="self-start ml-16 mt-12">
					${backButtonArrow()}
				 </div>
				<h1 class="text-4xl mt-4 mb-4">DEMANDES D'AMIS</h1>
				<ul class="w-3/4 mx-auto" id="requestsList" style="background: none;"></ul>
			</section>
			`;
		
			document.getElementById("app")!.innerHTML = html;
			setupBackButton();
		
		
			const listRequests = document.getElementById("requestsList");
			const requestsData = await resRequests.json();
		
			console.log("data = ");
			console.log(requestsData);
		
			if (listRequests) {
				listRequests.innerHTML = "";
				for (const line of requestsData) {
					const li = document.createElement("li");
					li.className = "grid grid-cols-[1fr_auto_1fr] items-center p-2 border-b-2 border-white";
		
					const span1 = document.createElement("span");
					span1.textContent = `${line.sender_name}`;
					span1.className ="text-left";
		
					const span2 = document.createElement("span");
					span2.textContent = `${line.request_date}`;
					span2.className = "text-center text-fuchsia-900";
		
					const divButtons = document.createElement("div");
					divButtons.className = "text-right";
		
					const accept = document.createElement("button");
					accept.className = "icons-btn";
					accept.innerHTML = `<img src="/images/ok-svgrepo-com.svg" alt="Accepter" class="w-10">`;
					accept.addEventListener("click", async () => {
						try {
							const resAccept = await fetch("/api/friends/requests/accept", { 
								method: "POST",
								headers: {"Content-Type": "application/json"},
								body: JSON.stringify({ sender_name: line.sender_name }),
							});
							if (resAccept.status === 409) {
								const data = await resAccept.json();
								alert(data.message);
								li.remove();
								return ;
							}
							if (!resAccept) {
								const error = new Error("Erreur");
								// error.status = "404";
								throw error;
							}
							alert(`Vous avez accepté la demande d'amitié de ${line.sender_name}`)
							li.remove();
						} catch (error: any) {
							renderError(error);
						}
					});
		
					const decline = document.createElement("button");
					decline.className = "icons-btn";
					decline.innerHTML = `<img src="/images/cancel-svgrepo-com.svg" alt="Refuser" class="w-10">`;
					decline.addEventListener("click", async () => {
						try {
							const resDecline = await fetch("/api/friends/requests/decline", { 
							method: "POST",
							headers: {"Content-Type": "application/json"},
							body: JSON.stringify({ sender_name: line.sender_name }),
							});
							if (resDecline.status === 409) {
								const data = await resDecline.json();
								alert(data.message);
								li.remove();
								return ;
							}
							if (!resDecline) {
								const error = new Error("Erreur");
								// error.status = "404";
								throw error;
							}
							alert(`Vous avez décliné la demande d'amitié de ${line.sender_name}`)
							li.remove();
							} catch (error: any) {
							renderError(error);
						}
					});
		
					divButtons.appendChild(accept);
					divButtons.appendChild(decline);
		
					li.appendChild(span1);
					li.appendChild(span2);
					li.appendChild(divButtons);
		
					listRequests.appendChild(li);
				}
			}
	} catch (error : any) {
		renderError(error);
	}
}