import page from "page";

export async function renderProfile() {
	try {
		const res = await fetch("/profile", { method: "GET" });
		
		if (!res.ok) {
			document.getElementById("app")!.innerHTML = "<p>Erreur</p>";
			return ;
		}

		const userData = await res.json();
		const html =  `
			<h1>Profil</h1>
			<h3>Name : ${userData.name}</h3>
			<h3>Given_Name : ${userData.given_name}</h3>
			<h3>Family_Name : ${userData.family_name}</h3>
			<h3>Profile Picture :</h3>
			<img src="${userData.picture}" alt="Photo de profil" />
			<br>
			<button id="test">< Go back</button>
			</section>
			`;

		document.getElementById("app")!.innerHTML = html;
	}
	catch (error) {
		console.error("Erreur lors du chargement du profil :", error);
		document.getElementById("app")!.innerHTML = "<p>Erreur</p>";

	}
}