export function renderHome()
{
	return `
	<section class="flex flex-col items-center text-center mt-[2vh] space-y-4">
	<img src="/images/hellokittycomputer.png" class="hellokitty-computer">
		<h1 class="text-6xl">TRANSCENDENCE</h1>
		<h3>made with love by vphilipp, rdendonc, iait-ouf and kdegryse</h3>
			<div>
				<button class="button bg-purple-400 hover:bg-purple-600 m-8" id="google-sign-in">Se connecter avec Google</button>
				<a class="button bg-pink-400 hover:bg-pink-600 " href="login" data-nav>Se connecter</a>
				<a class="button bg-pink-400 hover:bg-pink-600" href="register" data-nav>S'inscrire</a>
			</div>
		<a href="forgotPassword" class="text-fuchsia-900 underline" data-nav>Mot de passe oublié</a>
	</section>
	`;
}
