export function renderHome()
{
	return `
	<section class="flex flex-col items-center text-center mt-[2vh] space-y-4">
	<img src="/images/hellokittycomputer.png" class="hellokitty-computer">
		<h1 class="text-6xl">TRANSCENDENCE</h1>
		<h3>made with love by vphilipp, rdendonc, iait-ouf and kdegryse</h3>
			<div>
				<button id="google-sign-in">Se connecter avec Google</button>
				<a href="login" data-nav>Se connecter</a>
				<a href="register" data-nav>S'inscrire</a>
			</div>
		<a href="forgotPassword" data-nav>Mot de passe oublié</a>
	</section>
	`;
}
