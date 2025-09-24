import page from "page";

async function getPicture() {
  const res = await fetch("/api/profile", { method: "GET" });
  const userData = await res.json();

  return userData.picture;
}
interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  picture?: string;
}

export function renderDashboard() {
  let currentUserProfile: UserProfile | null = null;
  let profileReady = false;
  fetch("api/session", { credentials: "include" })
    .then((res) => {
      if (!res.ok) throw new Error("Utilisateur non connecté");
      return res.json();
    })
    .then((user: UserProfile) => {
      currentUserProfile = user;
      profileReady = true;
    })
    .catch(() => {
      profileReady = true;
      window.location.href = "/";
    });
  getPicture().then((userPicture) => {
    const profileImg = document.querySelector<HTMLImageElement>(
      'a[href="/profile"] img'
    );
    if (profileImg) {
      profileImg.src = userPicture;
    }
  });

  return `
  <script></script>
    <section class="flex flex-col items-center text-center">
    	<div class="dashboard-buttons w-full flex items-center justify-between px-8">
				<h1 class="ml-8 text-4xl -mt-4">TRANSCENDENCE</h1>

				<img src="/images/hellokittycomputer.png" class="hellokitty-computer">
				<div class="flex space-x-6 mr-8 -mt-4">
					<a href="/users-list" data-nav class="button bg-rose-300 hover:bg-rose-400 h-8">Utilisateurs</a>
					<a href="/friends" data-nav class="button bg-orange-300 hover:bg-orange-400 h-8">Amitiés</a>
					</div>
					<a href="/profile" data-nav class="shrink-0">
						<img src="/images/default-profile.png" alt="Profil" class="w-28 h-28 -mt-4 rounded-full object-cover shadow-lg shrink-0">
					</a>
		</div>
		<div class="relative w-[350px]">
 			<img src="/images/rocket.png" alt="jolie fusée" class="h-[350px] w-full object-cover">
 			<h1 class="absolute top-[180px] left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl font-bold text-white drop-shadow-lg w-full">
				LANCE UNE PARTIE !
 			</h1>
			<a href="/pong" data-nav class="button bg-purple-400 hover:bg-purple-600 w-40 text-xl">JOUER</a>
		</div>

		<button id="logout" class="button bg-red-400 hover:bg-red-500 w-10 fixed bottom-16 left-16">
		</button>

		</section>
	`;
}
