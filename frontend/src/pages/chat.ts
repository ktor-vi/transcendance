export function renderChat() {

	setTimeout(() => { // attend que la page charge pour executer le code (et oui le JS est asynchrone lol)
		//const socket = new WebSocket(`ws://${import.meta.env.VITE_HOSTNAME}:3000/chat`); // avec var env
		const socket = new WebSocket(`wss://mi-r4-p4.s19.be:3000/chat`); // sans var env avec la valeur direct pour debug mais a enlever
	
		socket.addEventListener("open", () => { // verifie que la socket est bien en mode "open" 
			console.log("[CHAT] Connecté au serveur");
		});
		
		socket.addEventListener("message", (event) => { // verifie que cest bien un msg de type chatMessage comme on la vu dans le back
			try {
			const data = JSON.parse(event.data);
			if (data.type === "chatMessage") {
				addMessage(`${data.user}: ${data.content}`);
			}
			} catch {
				console.error("Invalid msg:", event.data);
			}
		});
	
	socket.addEventListener("close", () => { // si cest deconnecte on a un msg dans la console pour debug
		console.log("[CHAT] Déconnecté du serveur");
	});
	
	socket.addEventListener("error", (err) => { // si erreur socket msg dans la console aussi
		console.error("[CHAT] Erreur WebSocket:", err);
	});

	function sendMessage() {
		const message = input.value.trim(); // trim les espaces en recuperant l'input

		if (!message) return; // si vide, return

		const payload = { type: "chatMessage", content: message }; 
		socket.send(JSON.stringify(payload)); // on retrouve la meme chose que dans le back quasiment :
		// recuperation du payload et transformation en obj JSON

		addMessage(`Moi: ${message}`); // affiche l'envoi avec le "moi" puisque client
		
		input.value = ""; // vide l'input apres l'envoi
	}
	
	// creation de la zone de txt + du bouton send comme HTML elememnt (on le precise a typescript)
	const input = document.getElementById("chatInput") as HTMLInputElement;
	const btn = document.getElementById("sendBtn") as HTMLButtonElement;
	

	function addMessage(msg : string) { // fctn qui prend le msg en parametre
		const node = document.createElement("p"); // creation d'un element "p" paragraph html
		node.textContent = msg; // rempli le texte avec le "msg : string" 
		node.classList.add("text-violet-400", "py-1"); // petit style mauve + padding vertical
		document.getElementById("chatMessages")?.appendChild(node); 
		// html de base -> <div id="chatMessages"></div> 
		// puis apres appendChild(node) -> <div id="chatMessages"><p>Salut !</p></div>
		// le DOM : Document Object Model est la version "vivante" dune page HTML je peux donc la modifier de facon dynamique

	}

	btn.addEventListener("click", sendMessage); // si on clique on send

	input.addEventListener("keypress", (e) => { // si on press send
		if (e.key === "Enter") { // ... et si uniquement cest entree, on send
			sendMessage();
		}
	});
	}, 0);
// rendering chat basic HTML :  je devrais surement le mettre dans un fichier a part mais pour le moment je sais pas encore comment bien faire ca
return `<h1>Miiiiaou</h1>
    <div class="flex flex-col h-[90vh] max-h-screen px-4 py-2">  
    <h1 class="text-xl font-bold mb-2">Live Chat</h1>

    <!-- Zone des messages -->
    <div id="chatMessages" class="flex-1 overflow-y-auto border rounded p-4 bg-white shadow-inner mb-4">
      <!-- Les messages apparaîtront ici -->
      <!-- <p class="text-cyan-400 py-1"> Text msg </p> -->
    </div>

    <!-- Barre d'envoi -->
    <div class="flex items-center border rounded p-2 bg-white shadow">
      <input
        id="chatInput"
        type="text"
        placeholder="Écris un message..."
        class="flex-1 px-4 py-2 border rounded mr-2 focus:outline-none focus:ring focus:border-blue-300"
      />
      <button
        id="sendBtn"
        class="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 rounded"
      >
        Envoyer
      </button>
    </div>
  </div>`;




// Tu peux ignorer cette partie ci-dessous enfin c'etait un essai de joli rendering mais on va devoir trouve une unite dans ce quon fait donc cest peut etre a la poubelle !



/*	return `<body class="m-0 p-0 h-screen w-screen bg-pastel-bg font-retro flex">
  <div class="flex flex-1 h-full w-full rounded-none bg-gradient-to-b from-white to-pastel-lilac/30 shadow-lg border border-white/60 overflow-hidden">

    <!-- Sidebar à gauche -->
    <aside class="w-64 bg-gradient-to-b from-pastel-pink/50 to-pastel-mint/40 border-r border-white/50 p-4 overflow-y-auto">
      <h2 class="text-lg font-bold text-pastel-dark mb-3">Conversations</h2>
      <ul class="space-y-3">
        <li class="flex items-center gap-3 bg-white/60 rounded-full p-2 cursor-pointer hover:shadow-md">
          <img src="https://www.youloveit.com/uploads/posts/2024-01/1704794040_youloveit_com_cute_hello_kitty_art3.jpg" class="w-10 h-10 rounded-full border border-white shadow" />
          <span class="text-pastel-dark">Rachel</span>
        </li>
        <li class="flex items-center gap-3 bg-white/60 rounded-full p-2 cursor-pointer hover:shadow-md">
          <img src="https://www.youloveit.com/uploads/posts/2024-01/1704794040_youloveit_com_cute_hello_kitty_art8.jpg" class="w-10 h-10 rounded-full border border-white shadow" />
          <span class="text-pastel-dark">Victor</span>
        </li>
      </ul>
    </aside>

    <!-- Zone conversation à droite -->
    <main class="flex-1 flex flex-col">
      
      <!-- Header -->
      <header class="flex items-center justify-between px-4 py-2 bg-gradient-to-b from-pastel-lilac/40 to-white border-b border-white/50 shadow-inner">
        <div class="flex items-center gap-3">
          <img src="https://www.youloveit.com/uploads/posts/2024-01/1704794040_youloveit_com_cute_hello_kitty_art3.jpg" class="w-12 h-12 rounded-full border-2 border-white shadow" />
          <div>
            <h3 class="text-pastel-dark font-semibold">Rachel</h3>
            <p class="text-xs text-pastel-dark/60">En ligne</p>
          </div>
        </div>
        <div class="flex gap-2">
          <button class="p-2 rounded-full bg-pastel-mint hover:brightness-105 shadow"><span>👤</span></button>
          <button class="p-2 rounded-full bg-pastel-coral hover:brightness-105 shadow"><span>🚫</span></button>
          <button class="p-2 rounded-full bg-pastel-pink hover:brightness-105 shadow"><span>🏓</span></button>
        </div>
      </header>

      <!-- Messages -->
      <div id="chatMessages" class="flex-1 overflow-y-auto p-4 space-y-3 bg-white/70">
        <div class="flex items-start gap-2">
          <img src="https://www.youloveit.com/uploads/posts/2024-01/1704794040_youloveit_com_cute_hello_kitty_art3.jpg" class="w-8 h-8 rounded-full border border-white shadow" />
          <div class="bg-gradient-to-r from-pastel-mint to-pastel-coral rounded-2xl px-4 py-2 shadow">
            Coucou !
          </div>
        </div>
        <div class="flex items-start gap-2 justify-end">
          <div class="bg-gradient-to-r from-pastel-pink to-pastel-lilac rounded-2xl px-4 py-2 shadow">
            WESH ! 😊
          </div>
          <img src="https://www.youloveit.com/uploads/posts/2024-01/1704793982_youloveit_com_cute_hello_kitty_art5.jpg" class="w-8 h-8 rounded-full border border-white shadow" />
        </div>
      </div>

      <!-- Zone saisie -->
      <form class="flex items-center gap-3 p-3 bg-gradient-to-t from-pastel-lilac/30 to-white border-t border-white/50">
        <input
          id="chatInput"
          type="text"
          placeholder="Écris un message..."
          class="flex-1 p-3 rounded-full border border-pastel-lilac/40 bg-white/90 focus:outline-none"
        />
        <button
          id="sendBtn"
          class="px-4 py-2 rounded-full bg-pastel-violet text-white shadow hover:brightness-105"
        >
          Envoyer
        </button>
      </form>

    </main>
  </div>
</body>
`;*/
}
