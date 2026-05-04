/* ============================================================
   auth.js – Gestion utilisateurs via localStorage
   Chargé sur toutes les pages pour gérer la session.
   ============================================================ */

const Auth = (() => {
  const USERS_KEY = 'gb_users';
  const SESSION_KEY = 'gb_session';

  function getUsers() {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  }

  function saveUsers(users) {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  function getCurrentUser() {
    const s = localStorage.getItem(SESSION_KEY);
    return s ? JSON.parse(s) : null;
  }

  function register({ username, email, password, role }) {
    const users = getUsers();
    if (users.find(u => u.username === username)) {
      return { ok: false, error: 'Ce pseudo est déjà pris.' };
    }
    if (users.find(u => u.email === email)) {
      return { ok: false, error: 'Cet email est déjà utilisé.' };
    }
    if (password.length < 6) {
      return { ok: false, error: 'Le mot de passe doit faire au moins 6 caractères.' };
    }
    const user = { username, email, password, role: role || 'user' };
    users.push(user);
    saveUsers(users);
    return { ok: true };
  }

  function login({ username, password }) {
    const users = getUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (!user) return { ok: false, error: 'Pseudo ou mot de passe incorrect.' };
    localStorage.setItem(SESSION_KEY, JSON.stringify({ username: user.username, role: user.role }));
    return { ok: true, user };
  }

  function logout() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isLoggedIn() {
    return !!getCurrentUser();
  }

  function isJournalist() {
    const u = getCurrentUser();
    return u && u.role === 'journalist';
  }

  return { register, login, logout, getCurrentUser, isLoggedIn, isJournalist };
})();

/* Met à jour la navbar selon l'état de connexion */
function updateNavAuth() {
  const authBtn   = document.getElementById('authBtn');
  const userMenu  = document.getElementById('userMenu');
  const userDisp  = document.getElementById('usernameDisplay');
  const logoutBtn = document.getElementById('logoutBtn');

  if (!authBtn) return;

  const user = Auth.getCurrentUser();
  if (user) {
    authBtn.classList.add('hidden');
    userMenu.classList.remove('hidden');
    if (userDisp) userDisp.textContent = user.username;
  } else {
    authBtn.classList.remove('hidden');
    userMenu.classList.add('hidden');
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      Auth.logout();
      window.location.href = 'index.html';
    });
  }
}

/* Dark mode */
function initDarkMode() {
  const btn = document.getElementById('darkModeToggle');
  if (!btn) return;

  const saved = localStorage.getItem('gb_theme');
  if (saved === 'light') document.body.classList.add('light');

  btn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('gb_theme', document.body.classList.contains('light') ? 'light' : 'dark');
    btn.textContent = document.body.classList.contains('light') ? '☀' : '☽';
  });

  btn.textContent = document.body.classList.contains('light') ? '☀' : '☽';
}

document.addEventListener('DOMContentLoaded', () => {
  updateNavAuth();
  initDarkMode();
});
