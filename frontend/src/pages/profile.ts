import page from "page";
import { getUserStatut } from '../components/auth';
import { backButton, setupBackButton } from '../components/backButton.js';

// renderProfile permet de créer la page liée au profile
export async function renderProfile() {
	console.log("renderProfile called");
	try { //on tente de récupérer la route du backend
		const res = await fetch("/api/profile", { method: "GET" });

		if (!res.ok) {
			document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
			return ;
		}
		// quand on a récupéré la réponse du back (les infos de profile),
		// on les met dans userData puis dans le html qui sera injecté
		const userData = await res.json();

		if (!userData.picture || userData.picture.trim() === "") {
			userData.picture = "/uploads/default.jpg";
		}

		const historyRes = await fetch(`api/user/history/${encodeURIComponent(userData.name)}`, { method: "GET" });
		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML = "<p>Cet utilisateur n'existe pas</p>";
			return;
		}
		const history = await historyRes.json();

		const html = `
		<h1 style="text-align: center;">Profil</h1>
		<section style="
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 16px;
		min-height: 50vh;
		">
		<div style="display: flex; align-items: center; gap: 8px;">
		<label for="emailInput">Adresse mail :</label>
		<input type="text" id="emailInput" value="${userData.email}" disabled tabindex=-1/>
		</div>

		<div style="display: flex; align-items: center; gap: 8px;">
		<label for="nameInput">Pseudo :</label>
		<input type="text" id="nameInput" value="${userData.name}" />
			</div>

			<label for="changePicture">Photo de profil :</label>
			<div style="display: flex; align-items: center; gap: 8px;">
			<img src="${userData.picture}" alt="default" style="display: flex; align-items: center; width: 100px; height: 100px; object-fit: cover; border-radius: 50%;" />
			</div>
			<input id="changePicture" name="changePicture" type="file"/>
			
			<button id="save">Enregistrer les modifications</button>
			
			<table border="1" style="width: 100%; text-align: center;">
			${!history.length ?
				`<h1">L'historique apparaîtra quand tu auras fait au moins 1 match </p>`
			:
				`<h3>Historique des matchs</h3>
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
					${history.map((entry: any) => `
						<tr>
							<td>${entry.type}</td>
							<td>${entry.player_1}</td>
							<td>${entry.player_2}</td>
							<td>${entry.scores}</td>
							<td>${entry.winner}</td>
							<td>${new Date(entry.created_at).toLocaleString()}</td>
						</tr>
					`).join("")}
				</tbody>
				</table>`}
			${backButton()}
			</section>
			`;
			
			// injection du html
			document.getElementById("app")!.innerHTML = html;

		// créé le bouton de retour arriere
		setupBackButton();
		// va enregistrer si une modif d'information a été faite

		document.getElementById("save")?.addEventListener("click", async() => {
			const newName = (document.getElementById("nameInput") as HTMLInputElement).value;
			
			const fileData = new FormData();

			fileData.append("name", newName);

			const fileInput = document.getElementById("changePicture") as HTMLInputElement;
			
			if (fileInput.files && fileInput.files.length > 0) {
				fileData.append("changePicture", fileInput.files[0]);
			}

			const uploadRes = await fetch("/api/profile", {
			method: "POST",
			body: fileData
		});

			if (uploadRes.ok) {
				const updatedUserData = await uploadRes.json();
				alert("Profil mis à jour!");
			
				const img = document.querySelector("img[alt='default']");
				if (img && updatedUserData.picture) {
					img.src = `${updatedUserData.picture}?t=${Date.now()}`;
				}
			} else {
				let errorMsg = "Erreur lors de la mise à jour du profil.";
			
				try {
					const errorData = await uploadRes.json();
					if (errorData.error || errorData.message) {
						errorMsg = errorData.error || errorData.message;
					}
				} catch (err) {
					console.error("Erreur inattendue lors du parsing JSON :", err);
				}
			
				alert(errorMsg);
			}

		});
	}

	catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";

	}
}
