<?php
/* navbar.php – Barre de navigation GameBizarre + modale de connexion
   À inclure dans toutes les pages. Injecte la session en JS. */
require_once __DIR__ . "/auth.php";
$gbUser = currentUser();
$active = $active ?? '';
?>
<script>
  /* Session injectée par PHP — lue par auth.js (reste synchrone) */
  window.GB_SESSION = <?= json_encode($gbUser) ?: 'null' ?>;
</script>

<header class="navbar">
  <div class="navbar-brand">
    <span class="brand-star">★</span>
    <a href="/index.php" class="brand-name">GameBizarre</a>
  </div>
  <nav class="navbar-links">
    <a href="/index.php"      class="nav-link <?= $active==='accueil'?'active':'' ?>">Accueil</a>
    <a href="/jeux.php"       class="nav-link <?= $active==='jeux'?'active':'' ?>">Jeux</a>
    <a href="/actualites.php" class="nav-link <?= $active==='actu'?'active':'' ?>">Actualités</a>
    <a href="/messages.php"   class="nav-link <?= $active==='messages'?'active':'' ?>" id="navMessages">Messages</a>
  </nav>
  <div class="navbar-actions">
    <button class="btn-darkmode" id="darkModeToggle" title="Dark mode">☽</button>
    <?php if ($gbUser): ?>
      <div class="user-menu" id="userMenu">
        <a href="/profile.php" class="username-display" id="usernameDisplay">
          <?= htmlspecialchars($gbUser['username']) ?>
        </a>
        <button class="btn-logout" id="logoutBtn">Déconnexion</button>
      </div>
    <?php else: ?>
      <button class="btn-login" id="openAuthModal">Connexion</button>
    <?php endif; ?>
  </div>
</header>

<?php if (!$gbUser): ?>
<!-- ===== Modale d'authentification ===== -->
<div class="auth-modal-overlay hidden" id="authModal">
  <div class="auth-modal-box">
    <button class="auth-modal-close" id="closeAuthModal">✕</button>

    <div class="auth-modal-tabs">
      <button class="auth-modal-tab active" id="tabLogin">Connexion</button>
      <button class="auth-modal-tab" id="tabRegister">Inscription</button>
    </div>

    <!-- Connexion -->
    <form class="auth-modal-form" id="loginForm">
      <h2 class="auth-modal-title">Bon retour <span class="accent">✦</span></h2>
      <div class="form-group">
        <label>Pseudo ou email</label>
        <input type="text" name="identifier" placeholder="ton pseudo ou email" required />
      </div>
      <div class="form-group">
        <label>Mot de passe</label>
        <input type="password" name="password" placeholder="••••••••" required />
      </div>
      <p class="form-error hidden" id="loginError"></p>
      <button type="submit" class="btn-primary full-width">Se connecter</button>
    </form>

    <!-- Inscription -->
    <form class="auth-modal-form hidden" id="registerForm">
      <h2 class="auth-modal-title">Rejoindre <span class="accent">★</span></h2>
      <div class="form-group">
        <label>Pseudo</label>
        <input type="text" name="username" placeholder="Choisis un pseudo" required />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input type="email" name="email" placeholder="email@exemple.com" required />
      </div>
      <div class="form-group">
        <label>Mot de passe</label>
        <input type="password" name="password" placeholder="6 caractères min." required />
      </div>
      <div class="form-group">
        <label>Rôle</label>
        <select name="role">
          <option value="user">Utilisateur</option>
          <option value="journalist">Journaliste</option>
        </select>
      </div>
      <p class="form-error hidden" id="registerError"></p>
      <button type="submit" class="btn-primary full-width">Créer mon compte</button>
    </form>
  </div>
</div>
<?php endif; ?>
