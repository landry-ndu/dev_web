/* ============================================================
   auth-page.js – Logique des formulaires connexion/inscription
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const tabLogin    = document.getElementById('tabLogin');
  const tabRegister = document.getElementById('tabRegister');
  const loginForm   = document.getElementById('loginForm');
  const registerForm= document.getElementById('registerForm');

  tabLogin.addEventListener('click', () => {
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
  });

  tabRegister.addEventListener('click', () => {
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
  });

  /* Connexion */
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const err = document.getElementById('loginError');

    const result = Auth.login({ username, password });
    if (!result.ok) {
      err.textContent = result.error;
      err.classList.remove('hidden');
      return;
    }
    err.classList.add('hidden');
    window.location.href = 'index.html';
  });

  /* Inscription */
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('regUsername').value.trim();
    const email    = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const role     = document.getElementById('regRole').value;
    const err      = document.getElementById('registerError');
    const success  = document.getElementById('registerSuccess');

    const result = Auth.register({ username, email, password, role });
    if (!result.ok) {
      err.textContent = result.error;
      err.classList.remove('hidden');
      success.classList.add('hidden');
      return;
    }
    err.classList.add('hidden');
    success.textContent = 'Compte créé ! Tu peux te connecter.';
    success.classList.remove('hidden');
    registerForm.reset();
    setTimeout(() => {
      tabLogin.click();
      success.classList.add('hidden');
    }, 1500);
  });
});
