import page from "page";
import { getUserStatut } from '../components/auth';
import { backButtonArrow, setupBackButton } from '../components/backButton.js';


// renderProfile permet de créer la page liée au profile
export async function renderProfile() {
	console.log("renderProfile called");
	try { //on tente de récupérer la route du backend
		const res = await fetch("/api/profile", { method: "GET" });
		
		if (!res.ok) {
			document.getElementById("app")!.innerHTML = 
			`
				<p class="text-white text-1xl">Erreur lors du chargement de la page</p>
				<h2 class="text-white text-9xl">401</h2>
				<p class="text-white text-2xl">Vous devez vous connecter</p>
				<img src="/images/hellokittyangry.png" class="mx-auto w-64 -mt-10"></img>
			`
			return ;
		}
		// quand on a récupéré la réponse du back (les infos de profile),
		// on les met dans userData puis dans le html qui sera injecté
		const userData = await res.json();
		console.log("IMAGE DE PROFILE QUI SERA CHARGEE = ");
		console.log(userData.picture);
		
		if (!userData.picture || userData.picture.trim() === "") {
			userData.picture = "/uploads/default.jpg";
		}
		
		
		const historyRes = await fetch(`api/user/history/${encodeURIComponent(userData.name)}`, { method: "GET" });
		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML = 
			`
			<p class="text-white text-1xl">Erreur lors du chargement de la page</p>
			<h2 class="text-white text-9xl">404</h2>
				<p class="text-white text-2xl">Cet utilisateur n'existe pas</p>
				<img src="/images/hellokittysad2.png" class="mx-auto w-48"></img>
				`;
				return;
			}
			const historyData = await historyRes.json();
			const history = historyData.history;
			const wins = historyData.wins;
			const plays = historyData.plays;
			const ratio = historyData.ratio;
			
			const html = `
				<section class="flex flex-col items-center text-center">
				<div class="self-start ml-16 mt-12">
				${backButtonArrow()}
				</div>
					
				<h1 class="text-4xl mb-4">PROFIL</h1>
					
				<input class="hidden" id="changePicture" name="changePicture" type="file"/>
				<label class="mb-4" for="changePicture">
				<img id="profilePicture" src="${userData.picture}" alt="[default]" 
					 class="flex items-center w-[150px] h-[150px] object-cover rounded-full shadow-lg"/>
				</label>
					
				<input class="mb-4" type="text" id="nameInput" value="${userData.name}" />
				<input class="mb-4 bg-[#DBDBDB]/60" type="text" id="emailInput" value="${userData.email}" disabled tabindex=-1/>
					
				<button class="mb-12 button bg-purple-300 hover:bg-purple-400" id="save" disabled>
				Enregistrer les modifications
				</button>
					
				${!history.length ? `
				<p class="text-xl">Les stats et l'historique <br>apparaîtront quand tu auras fait au moins 1 match </p>
				<img class="w-48" src="/images/hellokittytired.png" alt="Hello Kitty fatiguée"/>
				` : `
				<div class="stats-history">
					<div id="stats">
					<h1>STATS</h1>
					<table class="stats-table w-[270px] mx-auto">
						<tbody>
							<tr>
								<th class="pr-4 text-right font-bold">Victoires</th>
								<td class="text-left">${wins}</td>
							</tr>
							<tr>
								<th class="pr-4 text-right font-bold">Parties jouées</th>
								<td class="text-left">${plays}</td>
							</tr>
							<tr>
								<th class="pr-4 text-right font-bold">Ratio de victoires</th>
								<td class="text-left">${ratio}%</td>
							</tr>
						</tbody>
					</table>

					</div>
				
					<h1 class="mt-4 mb-4">HISTORIQUE</h1>
					<table class="history-table mb-16">
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
						<tr class="h-12 border-b-2 border-white">
							<td>${entry.type}</td>
							<td>${entry.player_1}</td>
							<td>${entry.player_2}</td>
							<td>${entry.scores}</td>
							<td>${entry.winner}</td>
							<td>${entry.created_at}</td>
						</tr>
						`).join("")}
					</tbody>
					</table>
				</div>
				`}
			</section>

		`;
					
		// injection du html
		document.getElementById("app")!.innerHTML = html;

		// créé le bouton de retour arriere
		setupBackButton();

		const saveBtn = document.getElementById("save") as HTMLButtonElement;
		const fileInput = document.getElementById("changePicture") as HTMLInputElement;
		const nameInput = document.getElementById("nameInput") as HTMLInputElement;

		// va enregistrer si une modif d'information a été faite
		function checkChanges() {
			const newName = nameInput.value;
			let nameChanged = false;
			let pictureChanged = false;

			if (newName != userData.name)
				nameChanged = true;
			else
				nameChanged = false;

			if (fileInput.files && fileInput.files.length > 0)
				pictureChanged = true;
			else
				pictureChanged = false;

			if (nameChanged || pictureChanged)
				saveBtn.disabled = false;
			else
				saveBtn.disabled = true;
		}
		
		nameInput.addEventListener("input", checkChanges);
		fileInput.addEventListener("change", checkChanges);

		document.getElementById("save")?.addEventListener("click", async() => {
			const newName = (document.getElementById("nameInput") as HTMLInputElement).value;
			const fileData = new FormData();

			fileData.append("name", newName);

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
			
				const img = document.getElementById("profilePicture") as HTMLImageElement | null;
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
		document.getElementById("app")!.innerHTML = "<p>Vous devez vous connecter</p>";
	}
}
