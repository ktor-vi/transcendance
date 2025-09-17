import page from "page";
import { getUserStatut } from '../components/auth';
import { backButton, setupBackButton } from '../components/backButton.js';

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

		// Fetch match history
		const historyRes = await fetch(`api/user/history/${encodeURIComponent(userData.name)}`, { method: "GET" });
		if (!historyRes.ok) {
			document.getElementById("app")!.innerHTML = `
				<p class="text-white text-1xl">Error loading page</p>
				<h2 class="text-white text-9xl">404</h2>
				<p class="text-white text-2xl">User not found</p>
				<img src="/images/hellokittysad2.png" class="mx-auto w-48" />
			`;
			return;
		}
		const history = await historyRes.json();

		// Build profile HTML
		const html = `
			<h1 style="text-align: center;">Profile</h1>
			<section style="
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;
				gap: 16px;
				min-height: 50vh;
			">
				<div style="display: flex; align-items: center; gap: 8px;">
					<label for="emailInput">Email:</label>
					<input type="text" id="emailInput" value="${userData.email}" disabled tabindex=-1/>
				</div>

				<div style="display: flex; align-items: center; gap: 8px;">
					<label for="nameInput">Username:</label>
					<input type="text" id="nameInput" value="${userData.name}" />
				</div>

				<label for="changePicture">Profile Picture:</label>
				<div style="display: flex; align-items: center; gap: 8px;">
					<img id="profilePicture" src="${userData.picture}" alt="[default]" style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;" />
				</div>
				<input id="changePicture" name="changePicture" type="file"/>

				<button id="save" disabled>Save Changes</button>

				<table border="1" style="width: 100%; text-align: center;">
					${!history.length 
						? `<p>History will appear after at least one match</p>` 
						: `
							<h3>Match History</h3>
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
										<td>${entry.player_1}</td>
										<td>${entry.player_2}</td>
										<td>${entry.scores}</td>
										<td>${entry.winner}</td>
										<td>${entry.created_at}</td>
									</tr>
								`).join("")}
							</tbody>
						`}
				</table>

				${backButton()}
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
