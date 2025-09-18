import page from "page";
import { getUserStatut } from '../components/auth';
import { backButtonArrow, setupBackButton } from '../components/backButton.js';

// Render the user profile page
export async function renderProfile() {
	try {
		// Fetch profile data
		const res = await fetch("/api/profile", { method: "GET" });

		if (!res.ok) {
			// Display error if user not logged in
			document.getElementById("app")!.innerHTML = `
				<p class="text-white text-1xl">Error loading page</p>
				<h2 class="text-white text-9xl">401</h2>
				<p class="text-white text-2xl">You must log in</p>
				<img src="/images/hellokittyangry.png" class="mx-auto w-64 -mt-10" />
			`;
			return;
		}

		const userData = await res.json();

		// Fallback to default picture if missing
		if (!userData.picture || userData.picture.trim() === "") {
			userData.picture = "/uploads/default.jpg";
		}
		
		
		const historyRes = await fetch(`api/user/history/${encodeURIComponent(userData.name)}`, { method: "GET" });
		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML = 
			`
			<section class="flex flex-col items-center text-center">
			<div class="mt-16">
			<p class="text-white text-1xl">Erreur lors du chargement de la page</p>
			<h2 class="text-white text-9xl">404</h2>
				<p class="text-white text-2xl">Cet utilisateur n'existe pas</p>
				<img src="/images/hellokittysad2.png" class="mx-auto w-48"></img>
			</div>
			</section>
			`;
				return;
			}
			const historyData = await historyRes.json();
			const history = historyData.history;
			const wins = historyData.wins;
			const plays = historyData.plays;
			const ratio = historyData.ratio;
			
			const html = `
				<script>0</script>
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
				<input class="mb-4 bg-[#DBDBDB]/60" type="text" id="emailInput" value="${
          userData.email
        }" disabled tabindex=-1/>
					
				<button class="mb-12 button bg-purple-300 hover:bg-purple-400" id="save" disabled>
				Enregistrer les modifications
				</button>
					
				${
          !history.length
            ? `
				<p class="text-xl">Les stats et l'historique <br>apparaîtront quand tu auras fait au moins 1 match </p>
				<img class="w-48" src="/images/hellokittytired.png" alt="Hello Kitty fatiguée"/>
				`
            : `
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
					<table class="history-table mb-24">
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
						${history
              .map(
                (entry: any) => `
						<tr class="h-12 border-b-2 border-white">
							<td>${entry.type}</td>
							<td>
							<a href='/user/${encodeURIComponent(entry.player_1)}'>${entry.player_1}</a>
							</td>
							<td>
							<a href='/user/${encodeURIComponent(entry.player_2)}'>${entry.player_2}</a>
							</td>
							<td>${entry.scores}</td>
							<td>
							<a href='/user/${encodeURIComponent(entry.winner)}'>${entry.winner}</a>
							</td>
							<td>${entry.created_at}</td>
						</tr>
						`
              )
              .join("")}
					</tbody>
					</table>
				</div>
				`
        }
			</section>

		`;

		// Inject HTML
		document.getElementById("app")!.innerHTML = html;
		setupBackButton();

		const saveBtn = document.getElementById("save") as HTMLButtonElement;
		const fileInput = document.getElementById("changePicture") as HTMLInputElement;
		const nameInput = document.getElementById("nameInput") as HTMLInputElement;

		// Enable save button if changes are detected
		function checkChanges() {
			const nameChanged = nameInput.value !== userData.name;
			const pictureChanged = fileInput.files && fileInput.files.length > 0;
			saveBtn.disabled = !(nameChanged || pictureChanged);
		}

		nameInput.addEventListener("input", checkChanges);
		fileInput.addEventListener("change", checkChanges);

		// Handle profile update
		document.getElementById("save")?.addEventListener("click", async () => {
			const newName = nameInput.value;
			const formData = new FormData();
			formData.append("name", newName);
			if (fileInput.files && fileInput.files.length > 0) {
				formData.append("changePicture", fileInput.files[0]);
			}

			const uploadRes = await fetch("/api/profile", { method: "POST", body: formData });

			if (uploadRes.ok) {
				const updatedUserData = await uploadRes.json();
				alert("Profile updated successfully!");
				const img = document.getElementById("profilePicture") as HTMLImageElement | null;
				if (img && updatedUserData.picture) {
					img.src = `${updatedUserData.picture}?t=${Date.now()}`;
				}
			} else {
				let errorMsg = "Error updating profile.";
				try {
					const errorData = await uploadRes.json();
					if (errorData.error || errorData.message) {
						errorMsg = errorData.error || errorData.message;
					}
				} catch (err) {
					console.error("Unexpected JSON parsing error:", err);
				}
				alert(errorMsg);
			}
		});
	} catch (error) {
		console.error("Error loading profile:", error);
		document.getElementById("app")!.innerHTML = "<p>You must log in</p>";
	}
}
