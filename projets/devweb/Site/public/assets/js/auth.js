/* ============================================================
   auth.js – Session (via PHP) + modale connexion/inscription
   La session est injectée par navbar.php dans window.GB_SESSION
   → Auth.getCurrentUser() reste SYNCHRONE (pas de refonte des
     fichiers appelants).
   ============================================================ */

const Auth = (() => {
  function getCurrentUser() {
    return window.GB_SESSION || null;   /* {id, username, role} ou null */
  }
  function isLoggedIn()  { return !!getCurrentUser(); }
  function isJournalist() {
    const u = getCurrentUser();
    return u && (u.role === 'journalist' || u.role === 'admin');
  }
  function isAdmin() {
    const u = getCurrentUser();
    return u && u.role === 'admin';
  }
  return { getCurrentUser, isLoggedIn, isJournalist, isAdmin };
})();

/* ---- Modale d'authentification ---- */
function initAuthModal() {
  const modal     = document.getElementById('authModal');
  const openBtn   = document.getElementById('openAuthModal');
  const closeBtn  = document.getElementById('closeAuthModal');
  const tabLogin  = document.getElementById('tabLogin');
  const tabReg    = document.getElementById('tabRegister');
  const loginForm = document.getElementById('loginForm');
  const regForm   = document.getElementById('registerForm');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.remove('hidden'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', e => {
      if (e.target === modal) modal.classList.add('hidden');
    });
  }

  if (tabLogin && tabReg) {
    tabLogin.addEventListener('click', () => {
      tabLogin.classList.add('active'); tabReg.classList.remove('active');
      loginForm.classList.remove('hidden'); regForm.classList.add('hidden');
    });
    tabReg.addEventListener('click', () => {
      tabReg.classList.add('active'); tabLogin.classList.remove('active');
      regForm.classList.remove('hidden'); loginForm.classList.add('hidden');
    });
  }

  /* Connexion */
  loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('loginError');
    err.classList.add('hidden');
    const res = await fetch('/actions/login_action.php', {
      method: 'POST',
      body: new FormData(loginForm)
    }).then(r => r.json()).catch(() => ({ ok:false, error:'Erreur réseau' }));

    if (!res.ok) {
      err.textContent = res.error || 'Erreur';
      err.classList.remove('hidden');
      return;
    }
    location.reload();
  });

  /* Inscription */
  regForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('registerError');
    err.classList.add('hidden');
    const res = await fetch('/actions/register_action.php', {
      method: 'POST',
      body: new FormData(regForm)
    }).then(r => r.json()).catch(() => ({ ok:false, error:'Erreur réseau' }));

    if (!res.ok) {
      err.textContent = res.error || 'Erreur';
      err.classList.remove('hidden');
      return;
    }
    location.reload();
  });
}

/* ---- Déconnexion ---- */
function initLogout() {
  const btn = document.getElementById('logoutBtn');
  btn?.addEventListener('click', async () => {
    await fetch('/actions/logout_action.php', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    }).catch(() => {});
    window.location.href = '/index.php';
  });
}

/* ---- Dark mode ---- */
function initDarkMode() {
  const btn = document.getElementById('darkModeToggle');
  if (!btn) return;
  if (localStorage.getItem('gb_theme') === 'light') document.body.classList.add('light');
  btn.textContent = document.body.classList.contains('light') ? '☀' : '☽';
  btn.addEventListener('click', () => {
    document.body.classList.toggle('light');
    localStorage.setItem('gb_theme',
      document.body.classList.contains('light') ? 'light' : 'dark');
    btn.textContent = document.body.classList.contains('light') ? '☀' : '☽';
  });
}

/* ---- Badge messages non lus ---- */
async function initMessagesBadge() {
  if (!Auth.isLoggedIn()) return;
  const nav = document.getElementById('navMessages');
  if (!nav) return;
  async function refresh() {
    try {
      const r = await fetch('/api/messages.php?action=unread').then(r => r.json());
      nav.innerHTML = `Messages${r.unread ? ` <span class="badge">${r.unread}</span>` : ''}`;
    } catch {}
  }
  refresh();
  setInterval(refresh, 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  initAuthModal();
  initLogout();
  initDarkMode();
  initMessagesBadge();
});
