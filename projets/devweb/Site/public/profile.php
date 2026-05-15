<?php
require_once __DIR__ . "/../includes/auth.php";
requireLogin();              /* page protégée */
$active = '';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GameBizarre – Profil</title>
  <link rel="stylesheet" href="/assets/css/style.css" />
  <link rel="stylesheet" href="/assets/css/animations.css" />
  <link rel="stylesheet" href="/assets/css/social.css" />
</head>
<body>

  <?php include __DIR__ . "/../includes/navbar.php"; ?>

  <main class="page-main" id="profileMain">
    <section class="profile-banner">
      <div class="profile-avatar-wrap">
        <img class="profile-avatar" id="profileAvatar" src="" alt="avatar" />
        <button class="avatar-edit-btn hidden" id="avatarEditBtn" title="Changer photo">✎</button>
      </div>
      <div class="profile-info">
        <h1 class="profile-username" id="profileUsername"></h1>
        <p class="profile-bio" id="profileBio"></p>
        <p class="profile-meta" id="profileMeta"></p>
        <div class="profile-actions" id="profileActions"></div>
      </div>
    </section>

    <section class="edit-profile hidden" id="editProfile">
      <h3 class="section-title-mini">Paramètres du profil</h3>
      <div class="form-group">
        <label>Photo de profil (URL)</label>
        <input type="url" id="inputPhoto" placeholder="https://..." />
      </div>
      <div class="form-group">
        <label>Bio</label>
        <textarea id="inputBio" rows="3" placeholder="Quelques mots sur toi..."></textarea>
      </div>
      <div class="form-group">
        <label>Confidentialité de ma liste</label>
        <select id="inputVisibility">
          <option value="public">🌐 Publique (tout le monde peut voir)</option>
          <option value="private">🔒 Privée (seuls mes amis voient)</option>
        </select>
      </div>
      <button class="btn-primary" id="saveProfileBtn">Enregistrer</button>
      <p class="form-success hidden" id="saveSuccess">✓ Profil mis à jour</p>
    </section>

    <nav class="profile-tabs" id="profileTabs">
      <button class="tab-btn active" data-tab="stats">📊 Stats</button>
      <button class="tab-btn" data-tab="games">🎮 Jeux</button>
      <button class="tab-btn" data-tab="reviews">📝 Avis</button>
      <button class="tab-btn" data-tab="friends">👥 Amis</button>
    </nav>

    <section class="tab-content" id="tab-stats">
      <div class="stats-grid" id="statsGrid"></div>
    </section>
    <section class="tab-content hidden" id="tab-games">
      <div id="gamesListBlock"></div>
    </section>
    <section class="tab-content hidden" id="tab-reviews">
      <div id="reviewsListBlock"></div>
    </section>
    <section class="tab-content hidden" id="tab-friends">
      <div class="friends-search" id="friendsSearchBlock">
        <h3 class="section-title-mini">Ajouter un ami</h3>
        <div class="search-wrapper">
          <input type="text" id="friendSearch" placeholder="Pseudo..." class="search-input" />
          <span class="search-icon">⌕</span>
        </div>
        <div id="friendSearchResults"></div>
      </div>
      <div id="incomingRequestsBlock"></div>
      <div id="friendsListBlock"></div>
    </section>
  </main>

  <footer class="footer">
    <p>© 2025 GameBizarre — Tous droits réservés.</p>
  </footer>

  <script src="/assets/js/config.js"></script>
  <script src="/assets/js/data.js"></script>
  <script src="/assets/js/api.js"></script>
  <script src="/assets/js/auth.js"></script>
  <script src="/assets/js/social.js"></script>
  <script src="/assets/js/profile.js"></script>
</body>
</html>
