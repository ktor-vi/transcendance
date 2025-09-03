export function renderError(error: any, containerId: string = "app", defaultCode: number | string = 400) {
	let errorMessage: string;
	let errorCode: number | string;

	if (error instanceof Error) {
		errorMessage = error.message;
		errorCode = (error as any).status || defaultCode; // status ajouté côté front
	} else {
		errorMessage = String(error);
		errorCode = defaultCode;
	}
	let imageSrc = "../../images/hellokittysad1.png";
	if (errorCode === 401)
		imageSrc = "../../images/hellokittysad2.png";
	if (errorCode === 404)
		imageSrc = "../../images/hellokittysad3.png";
	const container = document.getElementById(containerId);
	if (container) {
		container.innerHTML = `
			<p class="text-white text-1xl">Erreur lors du chargement de la page</p>
			<h2 class="text-white text-9xl">${errorCode}</h2>
			<p class="text-white text-2xl">${errorMessage}</p>
			<img src=${imageSrc} class="mx-auto w-48"></img>
		`;
	}
}
