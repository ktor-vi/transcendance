import page from "page";
import { backButton, setupBackButton } from '../components/backButton.js';
import { renderError } from "../components/renderError.js";


interface User {
		id: number;
		name: string;
}

interface CustomError {
  status?: number;
}
// Render the user list page
export async function renderUsersList() {
	try {
		// Fetch the user list from backend
		const res = await fetch("/api/usersList", { method: "GET" });
		if (!res.ok) {
			const errorData = await res.json();
			const error = new Error(errorData.error || "Unknown error")as CustomError;
			error.status = errorData.status || res.status;
			throw error;
		}

		const users = await res.json();

		// Inject HTML template
		const html = `
			<script>0</script>
		<section class="flex flex-col items-center text-center">
		
		<input type="text" id="searchInput" class="mt-16 mb-8" placeholder="Rechercher un utilisateur..." />
		<h1 class="text-2xl">Liste des utilisateurs</h1>
		<ul id="userList""></ul>
		${backButton()}
		</section>
		`;
		document.getElementById("app")!.innerHTML = html;

		// Setup back button
		setupBackButton();

		const listUsers = document.getElementById("userList");
		const searchInput = document.getElementById("searchInput") as HTMLInputElement;

		// Display filtered users
		function displaySearch(filteredUsers: any[]) {
			if(!listUsers)
				return;
			listUsers.innerHTML = "";
			for (const user of filteredUsers) {
				const li = document.createElement("li");
				const a = document.createElement("a");
				a.href = `/user/${encodeURIComponent(user.name)}`;
				a.className = "link-user";
				a.textContent = user.name;
				li.appendChild(a);
				listUsers.appendChild(li);
			}
		}

		displaySearch(users);

		// Filter list on input
		searchInput.addEventListener("input", () => {
			const search = searchInput.value.toLowerCase();
			const filtered = users.filter((user: User) => user.name.toLowerCase().includes(search));
			displaySearch(filtered);
		});

	} catch (error: any) {
		renderError(error);
	}
}
