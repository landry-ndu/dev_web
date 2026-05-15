<?php
require_once __DIR__ . "/../includes/auth.php";  // session AVANT tout HTML
$active = 'jeux';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GameBizarre – Jeux</title>
  <link rel="stylesheet" href="/assets/css/style.css" />
  <link rel="stylesheet" href="/assets/css/animations.css" />
  <link rel="stylesheet" href="/assets/css/social.css" />
</head>
<body>

  <?php include __DIR__ . "/../includes/navbar.php"; ?>

  <main class="page-main">
    <div class="page-header">
      <h1 class="page-title"><span class="accent">★</span> Catalogue de Jeux</h1>
      <p class="page-subtitle">Notez, commentez et découvrez des jeux vidéo</p>
    </div>

    <div class="filters-bar">
      <div class="search-wrapper" style="flex:1;">
        <input type="text" id="searchGames" placeholder="Rechercher un jeu..." class="search-input" />
        <span class="search-icon">⌕</span>
      </div>
    </div>

    <div class="cards-grid" id="gamesGrid"></div>
  </main>

  <footer class="footer">
    <p>© 2025 GameBizarre — Tous droits réservés.</p>
  </footer>

  <script src="/assets/js/config.js"></script>
  <script src="/assets/js/data.js"></script>
  <script src="/assets/js/api.js"></script>
  <script src="/assets/js/social.js"></script>
  <script src="/assets/js/auth.js"></script>
  <script src="/assets/js/jeux.js"></script>
</body>
</html>
