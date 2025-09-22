// main.ts
import page from "page";
import "./style.css";
import { renderHome } from "./pages/home";
import { renderDashboard } from "./pages/dashboard";
import { renderPong } from "./pages/pong";
import { renderNotFound } from "./pages/notFound";
import { renderKeyboardPlay } from "./pages/keyboardPlay";
import { renderProfile } from "./pages/profile";
import { renderUsersList } from "./pages/usersList";
import { renderUserProfile } from "./pages/usersProfile";
import { renderFriends } from "./pages/friends";
import { renderFriendsRequests } from "./pages/friendsRequests";
import { renderRegister } from "./pages/register";
import { renderLogin } from "./pages/login";
import { renderForgotPwd } from "./pages/forgotPassword";
import { renderChat } from "./pages/chat";
import { renderTournamentPage } from "./pages/tournament";
import { startPingLoop } from "./components/pingLoop";
import { getUserStatut } from "./components/auth";

// Start ping loop if user is logged in
document.addEventListener("DOMContentLoaded", async () => {
  (async () => {
    const res = await getUserStatut();
    if (res.loggedIn) startPingLoop();
    else console.log("No user logged in"); // informational
  })();

  const app = document.getElementById("app");

  // Utility to render HTML in #app
  function render(html: string) {
    if (app) app.innerHTML = html;
  }

  // Define SPA routes
  page("/", () => render(renderHome()));

  // Route pour le tableau de bord ("/dashboard") → appelle renderDashboard() et injecte son HTML
  page("/dashboard", () => render(renderDashboard()));

  page("/pong", () => renderPong());

  page("/profile", () => renderProfile());

  page("/users-list", () => renderUsersList());

  page("/friends", () => renderFriends());

  page("/friends/requests", () => renderFriendsRequests());

  page("/user/:name", (ctx) => renderUserProfile(ctx));

  page("/register", () => renderRegister());

  page("/login", () => renderLogin());

  page("/forgotPassword", () => renderForgotPwd());
  page("/keyboard-play", () => render(renderKeyboardPlay()));
  page("/tournament", () => renderTournamentPage());
  page("/chat", () => render(renderChat()));
  page("*", () => renderNotFound());
  page(); // start page.js router

  // Global click handlers for Google sign-in and logout
  document.addEventListener("click", (event) => {
    const target = event.target as HTMLElement;

    if (target?.id === "google-sign-in") {
      window.location.href = "/api/login/google";
    }

    if (target?.id === "logout") {
		fetch("/api/logout", { method: "POST", credentials: "include" }).then(() => page.redirect("/"));
    }
  });
});
