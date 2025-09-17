import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';
import { renderError } from "../components/renderError.js";

// renderProfile permet de créer la page liée au profile
export async function renderUsersList() {
	console.log("renderUsersList called");
	try { //on tente de récupérer la route du backend
		const res = await fetch("/api/usersList", { method: "GET" });
		
		if (!res.ok) {
				const errorData = await res.json();
				const error = new Error(errorData.error || "Erreur inconnue");
				error.status = errorData.status || res.status;
				throw error;
			}
		// quand on a récupéré la réponse du back (les infos de profile),
		// on les met dans userData puis dans le html qui sera injecté
		const users = await res.json();
		
		const html = `
		<section class="flex flex-col items-center text-center">
		
		<input type="text" id="searchInput" class="mt-16 mb-8" placeholder="Rechercher un utilisateur..." />
		<h1 class="text-2xl">Liste des utilisateurs</h1>
		<ul id="userList""></ul>
		${backButton()}
		</section>
		`;
	
		// injection du html
		document.getElementById("app")!.innerHTML = html;
		// créé le bouton de retour arriere
		setupBackButton();
		// va enregistrer si une modif d'information a été faite
		
		const listUsers = document.getElementById("userList");
		const searchInput = document.getElementById("searchInput") as HTMLInputElement;
		
		function displaySearch(filteredUsers: any[]) {
			listUsers.innerHTML = "";
			for (const user of filteredUsers) {
				const li = document.createElement("li");
				const a = document.createElement("a");
				const status = document.createElement("img");
				a.href = `/user/${encodeURIComponent(user.name)}`;
				a.className = "link-user";
				a.textContent = user.name;
				li.appendChild(a);
				listUsers.appendChild(li);
			}
		}
			displaySearch(users);

		searchInput.addEventListener("input", () => {
			const search = searchInput.value.toLowerCase();
			const filterd = users.filter(user => user.name.toLowerCase().includes(search));
			displaySearch(filterd);
			
		});

	} catch (error: any) {
		renderError(error);
	}
}

