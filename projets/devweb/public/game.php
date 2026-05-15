<?php
require_once __DIR__ . "/../includes/auth.php";  // session AVANT tout HTML
$active = 'jeux';
?>
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>GameBizarre – Fiche Jeu</title>
  <link rel="stylesheet" href="/assets/css/style.css" />
  <link rel="stylesheet" href="/assets/css/animations.css" />
  <link rel="stylesheet" href="/assets/css/game-page.css" />
  <link rel="stylesheet" href="/assets/css/social.css" />
</head>
<body>

  <?php include __DIR__ . "/../includes/navbar.php"; ?>

  <div id="gameSkeleton" class="game-skeleton">
    <div class="skeleton-hero"></div>
    <div class="skeleton-content">
      <div class="skeleton-block w60"></div>
      <div class="skeleton-block w40"></div>
      <div class="skeleton-block w80"></div>
      <div class="skeleton-block w70"></div>
    </div>
  </div>

  <main id="gameMain" class="hidden">
    <section class="game-hero" id="gameHero">
      <div class="game-hero-bg" id="gameHeroBg"></div>
      <div class="game-hero-overlay"></div>
      <div class="game-hero-content">
        <img class="game-hero-cover" id="gameCover" src="" alt="" />
        <div class="game-hero-info">
          <div class="game-breadcrumb"><a href="/jeux.php">← Retour aux jeux</a></div>
          <h1 class="game-hero-title" id="gameTitle"></h1>
          <div class="game-hero-meta" id="gameMeta"></div>
          <div class="game-hero-rating" id="gameRating"></div>
          <div class="letterbox-actions" id="letterboxActions">
            <button class="lb-btn" id="btnPlayed"  data-status="played">✓ Joué</button>
            <button class="lb-btn" id="btnPlaying" data-status="playing">▶ En cours</button>
            <button class="lb-btn" id="btnWant"    data-status="want">♡ Envie</button>
            <button class="lb-btn btn-follow" id="btnFollow">🔔 Suivre</button>
          </div>
        </div>
      </div>
    </section>

    <div class="game-body">
      <div class="game-main-col">
        <section class="game-section">
          <h2 class="game-section-title">À propos</h2>
          <div class="game-description" id="gameDescription"></div>
        </section>
        <section class="game-section" id="screenshotsSection">
          <h2 class="game-section-title">Screenshots</h2>
          <div class="screenshots-grid" id="screenshotsGrid"></div>
        </section>
        <section class="game-section">
          <h2 class="game-section-title">Avis des joueurs</h2>
          <div class="reviews-list" id="gameReviewsList"></div>
          <div id="reviewFormSection"></div>
        </section>
      </div>

      <aside class="game-sidebar">
        <div class="sidebar-card" id="myRatingCard">
          <h3 class="sidebar-card-title">Ma note</h3>
          <div class="star-rating" id="myStarRating">
            <span class="star" data-val="1">★</span>
            <span class="star" data-val="2">★</span>
            <span class="star" data-val="3">★</span>
            <span class="star" data-val="4">★</span>
            <span class="star" data-val="5">★</span>
          </div>
          <p class="my-rating-label" id="myRatingLabel">Non noté</p>
        </div>
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">Infos</h3>
          <dl class="game-info-list" id="gameInfoList"></dl>
        </div>
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">Genres</h3>
          <div class="tag-list" id="gameGenres"></div>
        </div>
        <div class="sidebar-card">
          <h3 class="sidebar-card-title">Plateformes</h3>
          <div class="tag-list" id="gamePlatforms"></div>
        </div>
        <div class="sidebar-card" id="similarCard">
          <h3 class="sidebar-card-title">Saga / Similaires</h3>
          <div id="similarGames"></div>
        </div>
      </aside>
    </div>
  </main>

  <div class="lightbox hidden" id="lightbox">
    <button class="lightbox-close" id="lightboxClose">✕</button>
    <button class="lightbox-prev" id="lightboxPrev">‹</button>
    <img class="lightbox-img" id="lightboxImg" src="" alt="" />
    <button class="lightbox-next" id="lightboxNext">›</button>
  </div>

  <footer class="footer">
    <p>© 2025 GameBizarre — Tous droits réservés.</p>
  </footer>

  <script src="/assets/js/config.js"></script>
  <script src="/assets/js/data.js"></script>
  <script src="/assets/js/api.js"></script>
  <script src="/assets/js/social.js"></script>
  <script src="/assets/js/auth.js"></script>
  <script src="/assets/js/game-page.js"></script>
</body>
</html>
