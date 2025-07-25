import page from "page";

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
					alert("Profil à jour!");

					const profileRes = await fetch("/api/profile");

					if (profileRes.ok) {
						const updatedUserData = await profileRes.json();
						const img = document.querySelector("img[alt='default']");
						if (img) {
							img.src = `${updatedUserData.picture}?t=${Date.now()}`;
						}
					} else {
						alert("Erreur lors de la récupération des modifications");
					}
					} else {
					let errorRes = "Erreur lors de l'upload des modifications";
					try {
						const errorData = await uploadRes.json();
						if (errorData.error) {
							errorRes = errorData.error;
						}
					} catch (err) {
						console.log("Erreur innatendue: ", err);
					}
					alert(errorRes);
				}
		});
	}

	catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";

	}
}
