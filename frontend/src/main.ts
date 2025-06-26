// Importe la bibliothèque "page.js", un mini routeur client-side pour Single Page Applications (SPA)
import page from "page";
import { renderHome } from "./pages/home";
import { renderDashboard } from "./pages/dashboard";

// 🔽 Récupère la référence à l'élément HTML avec l'ID "app"
// C'est dans cet élément que les pages seront affichées dynamiquement
const app = document.getElementById("app");

// Fonction utilitaire qui insère du HTML dans #app
function render(html: string) {
  if (app) app.innerHTML = html;
}

// Définition des routes avec page.js

// Route pour la page d'accueil ("/") → appelle renderHome() et injecte son HTML
page("/", () => render(renderHome()));

// Route pour le tableau de bord ("/dashboard") → appelle renderDashboard() et injecte son HTML
page("/dashboard", () => render(renderDashboard()));

// Lance le routeur (écoute les changements de l'URL sans recharger la page)
page();

// 🖱️ Gestion globale des clics sur le document
document.addEventListener("click", (e) => {
  // Cast explicite de la cible de l’événement comme élément HTML
  const target = e.target as HTMLElement;

  // Si l'utilisateur clique sur le bouton de connexion Google
  if (target?.id === "google-sign-in") {
    // Redirige vers l'API backend qui déclenche l'authentification Google
    window.location.href = "/api/login/google";
  }

  // Si l'utilisateur clique sur le bouton de déconnexion
  if (target?.id === "logout") {
    // Envoie une requête POST au backend pour déconnecter l'utilisateur
    fetch("/logout", { method: "POST" }).then(() => {
      // Une fois la session supprimée, redirige vers la page d’accueil
      page.redirect("/");
    });
  }
});
