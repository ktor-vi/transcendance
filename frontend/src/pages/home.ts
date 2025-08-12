export function renderHome()
{
	return `
	<section style="text-align:center; margin-top:2vh;">
		<img src="/images/HelloKitty.png" alt="default" style="display: block; margin: 0 auto; width: 15%;" />
		<h1 style="font-size: 4vh; margin-top: 2vh;">🍓 TRANSCENDANCE 🍓</h1>
		<h3>Made with love by vphilipp, rdendonc, jepatern, iait-ouf and kdegryse</h3>
		<div style="text-align:center; margin-top:2vh;">
			<button id="google-sign-in">Se connecter avec Google</button>
			<a href="login" data-nav>Se connecter</a>
			<a href="register" data-nav>S'inscrire</a>
		</div>
		<a href="forgotPassword" style="background: none; display: block; margin-top: 2vh;" data-nav>Mot de passe oublié</a>
	</section>
	<div class="whitespace-nowrap">
		<img src="/images/cloud1.svg" class="inline-block w-44 h-auto" />
		<img src="/images/cloud2.svg" class="inline-block w-44 h-auto" />
		<img src="/images/cloud4.svg" class="inline-block w-44 h-auto" />
	</div>

	`;
}
