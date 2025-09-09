import page from "page";
import { renderDmChat } from "./dmChat";
import { backButton, setupBackButton } from '../components/backButton.js';
import { renderError } from '../components/renderError.js';

export async function renderUserProfile(ctx: any) {
    console.log("renderUserProfile called");
    try {
        const userName = ctx.params.name;
        const res = await fetch(`/api/user/${encodeURIComponent(userName)}`, { method: "GET" });
        if (!res.ok)
        {
            const errorData = await res.json();
            const error = new Error(errorData.error || "Erreur inconnue");
            error.status = errorData.status || res.status;
            throw error;
        }

        const historyRes = await fetch(`/api/user/history/${encodeURIComponent(userName)}`, { method: "GET" });
    
        const userData = await res.json();
        
        console.log("User FRONTEND = ");
        console.log(userData.email);

        if (!historyRes.ok) {
            document.getElementById("app")!.innerHTML =
            `
                <p class="text-white text-1xl">Erreur lors du chargement de la page</p>
                <h2 class="text-white text-9xl">404</h2>
                <p class="text-white text-2xl">Cet utilisateur n'existe pas</p>
                <img src="/images/hellokittysad2.png" class="mx-auto w-48"></img>
            `;
            return;
        }
        const history = await historyRes.json();

        // --- GESTION DES BOUTONS ---
        let buttonRequests = `<button id="friendshipButton">Envoyer une demande d'amitié</button>`;

        const us = await fetch("/api/profile", { method: "GET" });
        const usData = await us.json();
        if (userName == usData.name)
            buttonRequests = "";

        const alreadyFriends = await fetch(`/api/friends/isFriend/${encodeURIComponent(userName)}`, { method: "GET" });
        const alreadyFriendsData = await alreadyFriends.json();
        const friendship = alreadyFriendsData.friendship;

        if (friendship == true)
            buttonRequests = `<button id="friendshipButton" disabled>Vous êtes déjà amis</button>`;

        // --- AJOUT DU BOUTON TESTER DM ---
        // On ajoute ce bouton seulement si ce n'est pas le profil de l'utilisateur connecté
        if (userName !== usData.name) {
            buttonRequests += `<button id="dmButton">Tester DM</button>`;
        }

        const html = `
        <div style="display: flex; flex-direction: column; align-items: center;">
            <h1 style="text-align: center;">Profile de ${userName}</h1>
            ${buttonRequests}
            <div id="userStatut"></div>
            <img 
            src="${userData.picture}"
            alt="[photo de profil]" 
            style="width: 100px; height: 100px; object-fit: cover; border-radius: 50%;"/>
        </div>

        ${!history.length ?
            `<p>L'historique apparaîtra quand la personne aura fait au moins 1 match </p>`
        :
            `<table border="1" style="width: 100%; text-align: center;">
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
                    ${history.map((entry: any) => `
                        <tr>
                            <td>${entry.type}</td>
                            <td>
                                <a href='/user/${encodeURIComponent(entry.player_1)}' class="bg-transparent text-white m-0 p-2 text-left">${(entry.player_1)}</a>
                            </td>
                            <td>
                                <a href='/user/${encodeURIComponent(entry.player_2)}' class="bg-transparent text-white m-0 p-2 text-left">${(entry.player_2)}</a>
                            </td>
                            <td>${entry.scores}</td>
                            <td>
                                <a href='/user/${encodeURIComponent(entry.winner)}' class="bg-transparent text-white m-0 p-2 text-left">${(entry.winner)}</a>
                            </td>
                            <td>${entry.created_at}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>`
        }
        ${backButton()}
        `;

        document.getElementById("app")!.innerHTML = html;

        // --- GESTION DU BOUTON D'AMI ---
        document.getElementById("friendshipButton")?.addEventListener("click", async() =>
        {
            try {
                const receiver = userName;
                const resRequest =
                await fetch("/api/friendshipButton", {
                    method: "POST",
                    body: receiver
                });

                if (resRequest.status != 200) {
                    const data = await resRequest.json();
                    alert(data.message);
                    return ;
                } else
                    alert(`La demande a bien été envoyée à ${receiver} !`)
            } catch {
                console.error("Erreur lors de l'envoi de la requête");
            }
        });

        // --- BOUTON TESTER DM ---
	/*const dmButton = document.getElementById("dmButton");
	if (dmButton) {
    // On crée la WebSocket une seule fois et on la réutilise
    let socket: WebSocket | null = null;

    const createSocket = (receiverId: string) => {
        // Si la socket existe déjà et est ouverte, on la réutilise
        if (socket && socket.readyState === WebSocket.OPEN) return socket;

        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        // Ajout du receiverId dans la query string
        const dmSocketUrl = `${protocol}//${host}/dm?receiverId=${encodeURIComponent(receiverId)}`;

        socket = new WebSocket(dmSocketUrl);

        socket.addEventListener('open', () => {
            console.log("WebSocket connectée pour DM avec receiverId =", receiverId);
        });

        socket.addEventListener('message', (event) => {
            const msg = JSON.parse(event.data);
            console.log("Message reçu via DM WS:", msg);
        });

        socket.addEventListener('close', (event) => {
            console.log("WS DM fermée", event.code, event.reason);
        });

        socket.addEventListener('error', (err) => console.error("WS DM erreur:", err));

        return socket;
    };

    dmButton.addEventListener("click", () => {
        const receiverId = userName; // ou la variable qui contient l'ID du destinataire
        const ws = createSocket(receiverId);

        const sendDM = () => {
            ws.send(JSON.stringify({
                type: "dmMessage",
                to: receiverId,
                content: "Test DM !"
            }));
        };

        if (ws.readyState === WebSocket.OPEN) {
            sendDM();
        } else {
            ws.addEventListener('open', sendDM, { once: true });
        }
    });
}*/

	const dmButton = document.getElementById("dmButton");
	if (dmButton) {
  	dmButton.addEventListener("click", () => {
    const app = document.getElementById("app");
    if (app) {
	            app.innerHTML = renderDmChat(userName); // on passe bien le destinataire
    }
  });
}

	
        // --- GESTION STATUT UTILISATEUR ---
        const statusContainer = document.getElementById("userStatut");
        if (statusContainer) {
            const statusWrapper = document.createElement("span");
            statusWrapper.style.display = "flex";
            statusWrapper.style.alignItems = "center";
            statusWrapper.style.gap = "6px";

            const statusImg = document.createElement("img");
            statusImg.className = "w-9 h-9";

            const statusText = document.createElement("span");

            try {
                const statutRes = await fetch(`/api/user/${encodeURIComponent(userName)}/online`);
                if (!statutRes.ok)
                    throw new Error(`Error with HTTP status`);

                const data = await statutRes.json();
                console.log("Réponse statut : ", data);

                if (data.online) {
                    statusText.textContent = "Connecté.e";
                    statusImg.alt = "Connecté.e";
                    statusImg.src = `/images/available.svg`;
                } else {
                    statusText.textContent = "Déconnecté.e";
                    statusImg.alt = "Déconnecté.e";
                    statusImg.src = `/images/disconnected.svg`;
                }

                statusWrapper.appendChild(statusImg);
                statusWrapper.appendChild(statusText);
                statusContainer.appendChild(statusWrapper);

            } catch (err) {
                console.error("Erreur avec le statut: ", err);
            }
        }

        setupBackButton();
    } catch (error: any) {
        renderError(error);
    }
}

