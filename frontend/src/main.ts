import page from "page";
import { renderHome } from "./pages/home";
import { renderDashboard } from "./pages/dashboard";

const app = document.getElementById("app");

function render(html: string) {
  if (app) app.innerHTML = html;
}

page("/", () => render(renderHome()));
page("/dashboard", () => render(renderDashboard()));

page();

document.addEventListener("click", (e) => {
  const target = e.target as HTMLElement;

  if (target?.id === "google-sign-in") {
    window.location.href = "/api/login/google";
  }

  if (target?.id === "logout") {
    fetch("/logout", { method: "POST" }).then(() => {
      page.redirect("/");
    });
  }
});
