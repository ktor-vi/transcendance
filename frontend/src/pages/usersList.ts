import page from "page";

import { backButton, setupBackButton } from '../components/backButton.js';

// renderProfile permet de créer la page liée au profile
export async function renderUsersList() {
	console.log("renderUsersList called");
	try { //on tente de récupérer la route du backend
		const res = await fetch("/api/usersList", { method: "GET" });
		
		if (!res.ok) {
			document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
			return;
		}
		// quand on a récupéré la réponse du back (les infos de profile),
		// on les met dans userData puis dans le html qui sera injecté
		const users = await res.json();
		
		const html = `
		<input type="text" id="searchInput" placeholder="Rechercher un utilisateur..." />
		<h1 style="text-align: center;">Liste des utilisateurs</h1>
		<ul id="userList" style="background: none;"></ul>
		${backButton()}
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

	} catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
	}
}

