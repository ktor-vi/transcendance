// main.js
import './style.css';
import { createBabylonScene } from './components/BabylonScene';


const canvas = document.getElementById('renderCanvas');

async function fetchUser() {
  try {
    const res = await fetch('/me', {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Utilisateur non connecté');
    }

    const user = await res.json();
    console.log('Utilisateur connecté :', user);

    const welcomeEl = document.getElementById('welcome');
    if (welcomeEl) {
      welcomeEl.innerText = `Bienvenue ${user.name || user.email || 'utilisateur'} !`;
    }

  } catch (err) {
    console.error('Erreur lors du chargement du profil :', err);
    window.location.href = '/';
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const justLoggedIn = new URLSearchParams(window.location.search).get('logged') === '1';
  if (justLoggedIn) {
    setTimeout(() => {
      fetchUser();
      window.history.replaceState({}, document.title, '/dashboard');
      if (canvas) {
        createBabylonScene(canvas);
      }
    }, 500);
  } else {
    fetchUser();
  }
});

const logoutBtn = document.getElementById('logout');
logoutBtn?.addEventListener('click', async () => {
  await fetch('/logout', { method: 'POST' });
  window.location.href = '/';
});
