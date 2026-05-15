<?php $active = 'accueil'; ?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GameBizarre – Actu & Critiques Jeux Vidéo</title>
  <link rel="stylesheet" href="/assets/css/style.css" />
  <link rel="stylesheet" href="/assets/css/animations.css" />
  <link rel="stylesheet" href="/assets/css/social.css" />
</head>
<body>

  <?php include __DIR__ . "/../includes/navbar.php"; ?>

  <section class="hero">
    <div class="hero-content">
      <h1 class="hero-title">
        <span class="accent">Critiques.</span> Actus.<br />
        L'univers du jeu vidéo réinventé.
      </h1>
      <p class="hero-subtitle">Notez, commentez, partagez. Suivez les dernières nouvelles gaming.</p>
      <a href="/jeux.php" class="btn-primary">Explorer les jeux</a>
      <a href="/actualites.php" class="btn-secondary">Dernières actus</a>
    </div>
    <div class="hero-deco">
      <div class="deco-ring ring1"></div>
      <div class="deco-ring ring2"></div>
      <div class="deco-star s1">✦</div>
      <div class="deco-star s2">✧</div>
      <div class="deco-star s3">✦</div>
    </div>
  </section>

  <section class="section-block">
    <div class="section-header">
      <h2 class="section-title"><span class="accent">★</span> Jeux Populaires</h2>
      <a href="/jeux.php" class="see-all">Voir tout →</a>
    </div>
    <div class="cards-grid" id="popularGamesGrid"></div>
  </section>

  <section class="section-block">
    <div class="section-header">
      <h2 class="section-title"><span class="accent">✦</span> Actualités Récentes</h2>
      <a href="/actualites.php" class="see-all">Voir tout →</a>
    </div>
    <div class="news-grid" id="recentNewsGrid"></div>
  </section>

  <footer class="footer">
    <p>© 2025 GameBizarre — Tous droits réservés.</p>
  </footer>

  <script src="/assets/js/config.js"></script>
  <script src="/assets/js/data.js"></script>
  <script src="/assets/js/api.js"></script>
  <script src="/assets/js/social.js"></script>
  <script src="/assets/js/auth.js"></script>
  <script src="/assets/js/main.js"></script>
</body>
</html>
