import page from "page";

// Returns back button HTML
export function backButton() {
	return '<button class="back-button" id="goBack">Retour</button>'
	return '<button class="back-button" id="goBack">Retour</button>'
}

export function backButtonArrow() {
	return '<button class="back-button-arrow" id="goBack">Retour</button>'
}

export function backButtonArrow() {
	return '<button class="back-button-arrow" id="goBack">Retour</button>'
}

// Sets up back button click handler
export function setupBackButton() {
	document.getElementById("goBack")?.addEventListener("click", (e) => {
		e.preventDefault();

		if (window.history.length > 1) {
			window.history.back(); // normal browser back
		} else {
			page("/dashboard"); // fallback if no history
		}
	});
}
