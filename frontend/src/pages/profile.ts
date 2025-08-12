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
			userData.picture = "/default.jpg";
		}

		
		
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

			<div style="display: flex; align-items: center; gap: 8px;">
			<label for="given_nameInput">Prénom :</label>
			<input type="text" id="given_nameInput" value="${userData.given_name}" />
			</div>
			
			<div style="display: flex; align-items: center; gap: 8px;">
			<label for="family_nameInput">Nom :</label>
			<input type="text" id="family_nameInput" value="${userData.family_name}" />
			</div>
			
			<label for="changePicture">Photo de profil :</label>
			<input id="changePicture" name="changePicture" type="file"/>
			<div style="display: flex; align-items: center; gap: 8px;">
			<img src="${userData.picture}" alt="default" style="display: flex; align-items: center; width: 100px; height: 100px; object-fit: cover; border-radius: 50%;" />
			</div>
			
			<button id="save">Enregistrer les modifications</button>
			<span id="userStatut"></span>
			${backButton()}
			</section>
			`;
			
			// injection du html
			document.getElementById("app")!.innerHTML = html;
			
			const resStatut = await getUserStatut();
			let statut;
			if (resStatut.loggedIn)
				statut = "Connecté";
			else
				statut = "Non connecté";
			const statutElement = document.getElementById("userStatut");
			if (statutElement)
				statutElement.textContent = statut;
		// créé le bouton de retour arriere
		setupBackButton();
		// va enregistrer si une modif d'information a été faite

		document.getElementById("save")?.addEventListener("click", async() => {
			const newName = (document.getElementById("nameInput") as HTMLInputElement).value;
			const newGivenName = (document.getElementById("given_nameInput") as HTMLInputElement).value;
			const newFamilyName = (document.getElementById("family_nameInput") as HTMLInputElement).value;
			
			const fileData = new FormData();

			fileData.append("name", newName);
			fileData.append("given_name", newGivenName);
			fileData.append("family_name", newFamilyName);


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
