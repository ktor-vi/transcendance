import './style.css'
const button = document.getElementById("google-sign-in");

if (button) {
  button.addEventListener("click", async () => {
    try {
      console.log("bite");
      window.location.href = "/api/login/google"; // Pas de fetch !
    } catch (error) {
      console.error("Erreur lors de la requête :", error);
    }
  });
}
